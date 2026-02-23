import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useShipments } from '../../hooks/useShipments';
import GradientHeader from '../../components/GradientHeader';
import { useRouter } from 'expo-router';

// ── helpers ──────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
};

const VEHICLE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  ev_truck: 'flash',
  truck_diesel: 'car',
  truck_cng: 'leaf',
  train: 'train',
};

const VEHICLE_COLOR: Record<string, string> = {
  ev_truck: '#10b981',
  truck_diesel: '#6b7280',
  truck_cng: '#3b82f6',
  train: '#8b5cf6',
};

function gradeColor(grade?: string): string {
  return GRADE_COLOR[grade?.toUpperCase() ?? ''] ?? '#6b7280';
}

function vehicleLabel(v: string): string {
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Leaflet HTML builder ──────────────────────────────────────────────────────

function buildMapHtml(shipmentsJson: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #e5e0d8; }
    #map { width: 100%; height: 100%; }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 2.5px solid #fff;
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      font-family: -apple-system, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      cursor: pointer;
      transition: transform 0.15s;
    }
    .custom-marker.selected { transform: scale(1.25); box-shadow: 0 4px 12px rgba(0,0,0,0.45); }
    .pulse {
      position: absolute;
      top: -3px; right: -3px;
      width: 10px; height: 10px;
      border-radius: 50%;
      border: 2px solid #fff;
    }
    .leaflet-control-zoom { border-radius: 8px !important; }
    .leaflet-control-attribution { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const SHIPMENTS = ${shipmentsJson};
    const GRADE_COLOR = {A:'#10b981',B:'#3b82f6',C:'#f59e0b',D:'#f97316',F:'#ef4444'};

    const map = L.map('map', {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markers = {};

    function post(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    map.on('click', function() { post({ type: 'mapClick' }); });

    function createMarker(s) {
      if (s.current_lat == null || s.current_lng == null) return null;
      const grade = s.green_score || 'C';
      const color = GRADE_COLOR[grade] || '#6b7280';
      const size = 34;
      const inTransit = s.status === 'in_transit';

      const html = '<div class="custom-marker" id="pin-' + s.shipment_id + '" style="width:' + size + 'px;height:' + size + 'px;background:' + color + ';position:relative;">'
        + grade
        + (inTransit ? '<div class="pulse" style="background:' + color + ';"></div>' : '')
        + '</div>'
        + '<div style="background:rgba(255,255,255,0.95);border:1.5px solid ' + color + ';border-radius:4px;padding:1px 4px;margin-top:3px;text-align:center;font-size:9px;font-weight:700;color:' + color + ';font-family:-apple-system,sans-serif;white-space:nowrap;">' + s.shipment_id + '</div>';

      const icon = L.divIcon({
        html: html,
        className: '',
        iconSize: [size + 16, size + 22],
        iconAnchor: [(size + 16) / 2, 0],
      });

      const marker = L.marker([s.current_lat, s.current_lng], { icon })
        .addTo(map)
        .on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          post({ type: 'markerClick', shipment_id: s.shipment_id });
        });

      return marker;
    }

    SHIPMENTS.forEach(function(s) {
      const m = createMarker(s);
      if (m) markers[s.shipment_id] = m;
    });

    // Listen for messages from React Native
    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    function handleMessage(e) {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === 'filter') {
          const vt = msg.vehicle_type;
          SHIPMENTS.forEach(function(s) {
            const m = markers[s.shipment_id];
            if (!m) return;
            if (!vt || s.vehicle_type === vt) {
              map.addLayer(m);
            } else {
              map.removeLayer(m);
            }
          });
        }

        if (msg.type === 'selectMarker') {
          // Pan to selected shipment
          const s = SHIPMENTS.find(function(x) { return x.shipment_id === msg.shipment_id; });
          if (s && s.current_lat != null) {
            map.flyTo([s.current_lat - 1.5, s.current_lng], 7, { duration: 0.6 });
          }
          // Highlight selected
          Object.keys(markers).forEach(function(id) {
            const pin = document.getElementById('pin-' + id);
            if (pin) pin.classList.toggle('selected', id === msg.shipment_id);
          });
        }

        if (msg.type === 'deselectMarker') {
          Object.keys(markers).forEach(function(id) {
            const pin = document.getElementById('pin-' + id);
            if (pin) pin.classList.remove('selected');
          });
        }
      } catch(err) {}
    }
  </script>
</body>
</html>`;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const router = useRouter();
  const { shipments } = useShipments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string | null>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const webviewRef = useRef<WebView>(null);

  const selectedShipment = shipments.find((s) => s.shipment_id === selectedId) ?? null;
  const vehicleTypes = Array.from(new Set(shipments.map((s) => s.vehicle_type)));
  const activeCount = shipments.filter((s) => s.status === 'in_transit').length;
  const completedCount = shipments.filter((s) => s.status === 'completed').length;

  const mapHtml = buildMapHtml(JSON.stringify(shipments));

  // Send filter to WebView when filterVehicle changes
  useEffect(() => {
    webviewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
        JSON.stringify({ type: 'filter', vehicle_type: filterVehicle }),
      )} })); true;`,
    );
  }, [filterVehicle]);

  const openPanel = useCallback(
    (shipmentId: string) => {
      setSelectedId(shipmentId);
      webviewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
          JSON.stringify({ type: 'selectMarker', shipment_id: shipmentId }),
        )} })); true;`,
      );
      Animated.spring(panelAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    },
    [panelAnim],
  );

  const closePanel = useCallback(() => {
    webviewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: '{"type":"deselectMarker"}' })); true;`,
    );
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedId(null));
  }, [panelAnim]);

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'markerClick') {
          openPanel(msg.shipment_id);
        } else if (msg.type === 'mapClick') {
          if (selectedId) closePanel();
        }
      } catch {}
    },
    [openPanel, closePanel, selectedId],
  );

  return (
    <View style={styles.container}>
      <GradientHeader title="Live Tracking" subtitle="Track shipments in real-time" icon="map" />

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.statText}>{activeCount} Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.statText}>{completedCount} Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="location" size={12} color="#6b7280" />
          <Text style={styles.statText}>{shipments.length} Total</Text>
        </View>
      </View>

      {/* Map container with WebView + overlays */}
      <View style={styles.mapContainer}>
        {shipments.length > 0 ? (
          <WebView
            ref={webviewRef}
            source={{ html: mapHtml }}
            style={styles.map}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.loadingMap}>
            <Ionicons name="map" size={48} color="#d1d5db" />
            <Text style={styles.loadingText}>Loading shipments…</Text>
          </View>
        )}

        {/* Vehicle filter chips overlay */}
        <View style={styles.filterOverlay}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.chip, !filterVehicle && styles.chipActive]}
              onPress={() => setFilterVehicle(null)}
            >
              <Ionicons name="layers" size={12} color={!filterVehicle ? '#ffffff' : '#374151'} />
              <Text style={[styles.chipText, !filterVehicle && styles.chipTextActive]}>
                All ({shipments.length})
              </Text>
            </TouchableOpacity>

            {vehicleTypes.map((vt) => {
              const active = filterVehicle === vt;
              const color = VEHICLE_COLOR[vt] ?? '#6b7280';
              const count = shipments.filter((s) => s.vehicle_type === vt).length;
              return (
                <TouchableOpacity
                  key={vt}
                  style={[
                    styles.chip,
                    active && { backgroundColor: color, borderColor: color },
                  ]}
                  onPress={() => setFilterVehicle(active ? null : vt)}
                >
                  <Ionicons
                    name={VEHICLE_ICON[vt] ?? 'car'}
                    size={12}
                    color={active ? '#ffffff' : color}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {vehicleLabel(vt)} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Grade legend overlay */}
        <View style={styles.legendOverlay}>
          {Object.entries(GRADE_COLOR).map(([grade, color]) => (
            <View key={grade} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{grade}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Shipment detail panel */}
      {selectedShipment && (
        <Animated.View
          style={[styles.detailPanel, { transform: [{ translateY: panelTranslateY }] }]}
        >
          <View style={styles.handle} />

          <View style={styles.panelHeader}>
            <View style={styles.panelTitleRow}>
              <View
                style={[
                  styles.gradeCircle,
                  { backgroundColor: gradeColor(selectedShipment.green_score) },
                ]}
              >
                <Text style={styles.gradeCircleText}>
                  {selectedShipment.green_score ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelShipmentId}>{selectedShipment.shipment_id}</Text>
                <Text style={styles.panelRoute}>
                  {selectedShipment.origin} → {selectedShipment.destination}
                </Text>
              </View>
              <TouchableOpacity onPress={closePanel} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    selectedShipment.status === 'in_transit' ? '#d1fae5' : '#fef3c7',
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      selectedShipment.status === 'in_transit' ? '#10b981' : '#f59e0b',
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      selectedShipment.status === 'in_transit' ? '#065f46' : '#92400e',
                  },
                ]}
              >
                {selectedShipment.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Ionicons name="speedometer" size={18} color="#3b82f6" />
              <Text style={styles.metricValue}>
                {typeof selectedShipment.speed_kmh === 'number'
                  ? `${Math.round(selectedShipment.speed_kmh)} km/h`
                  : '—'}
              </Text>
              <Text style={styles.metricLabel}>Speed</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="map" size={18} color="#10b981" />
              <Text style={styles.metricValue}>
                {typeof selectedShipment.distance_covered_km === 'number'
                  ? `${Math.round(selectedShipment.distance_covered_km)} km`
                  : '—'}
              </Text>
              <Text style={styles.metricLabel}>Covered</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="leaf" size={18} color="#f59e0b" />
              <Text style={styles.metricValue}>
                {typeof selectedShipment.total_co2_kg === 'number'
                  ? `${selectedShipment.total_co2_kg.toFixed(1)} kg`
                  : '—'}
              </Text>
              <Text style={styles.metricLabel}>CO₂</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="time" size={18} color="#8b5cf6" />
              <Text style={styles.metricValue}>
                {typeof selectedShipment.eta_minutes === 'number' &&
                selectedShipment.eta_minutes > 0
                  ? `${Math.round(selectedShipment.eta_minutes / 60)}h`
                  : 'Done'}
              </Text>
              <Text style={styles.metricLabel}>ETA</Text>
            </View>
          </View>

          {/* Progress bar */}
          {typeof selectedShipment.distance_covered_km === 'number' &&
            typeof selectedShipment.total_distance_km === 'number' &&
            selectedShipment.total_distance_km > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Journey Progress</Text>
                  <Text style={styles.progressPct}>
                    {Math.round(
                      (selectedShipment.distance_covered_km /
                        selectedShipment.total_distance_km) *
                        100,
                    )}
                    %
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          100,
                          (selectedShipment.distance_covered_km /
                            selectedShipment.total_distance_km) *
                            100,
                        )}%`,
                        backgroundColor: gradeColor(selectedShipment.green_score),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressSub}>{selectedShipment.origin}</Text>
                  <Text style={styles.progressSub}>{selectedShipment.destination}</Text>
                </View>
              </View>
            )}

          {/* View Detail button */}
          <TouchableOpacity
            style={styles.viewDetailBtn}
            onPress={() => {
              closePanel();
              router.push(`/shipment/${selectedShipment.shipment_id}` as any);
            }}
          >
            <Ionicons name="analytics" size={16} color="#ffffff" />
            <Text style={styles.viewDetailText}>View Full Detail</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  statDivider: { width: 1, height: 16, backgroundColor: '#e5e7eb' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f1f5f9',
  },
  loadingText: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  filterOverlay: { position: 'absolute', top: 12, left: 0, right: 0 },
  filterContent: { paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  chipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#ffffff' },
  legendOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  detailPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 16,
  },
  panelHeader: { marginBottom: 16 },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  gradeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeCircleText: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  panelShipmentId: { fontSize: 17, fontWeight: '700', color: '#111827' },
  panelRoute: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 3,
  },
  metricValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  metricLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  progressSection: { marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  progressPct: { fontSize: 12, fontWeight: '700', color: '#111827' },
  progressTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: 11, color: '#9ca3af' },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
  },
  viewDetailText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
