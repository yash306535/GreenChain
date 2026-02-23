import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useShipments } from '../../hooks/useShipments';
import GradientHeader from '../../components/GradientHeader';
import ShipmentCard from '../../components/ShipmentCard';
import EmissionGauge from '../../components/EmissionGauge';
import RouteCompareModal from '../../components/RouteCompareModal';

// ── Skeleton shimmer ──────────────────────────────────────────────────────────

function SkeletonBlock({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#e5e7eb',
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

function ShipmentDetailSkeleton() {
  return (
    <View style={styles.container}>
      <GradientHeader title="Shipment Details" subtitle="Loading…" icon="analytics" />

      {/* Card placeholder */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonRow}>
          <SkeletonBlock width={120} height={14} />
          <SkeletonBlock width={60} height={22} borderRadius={11} />
        </View>
        <SkeletonBlock width="70%" height={20} style={{ marginTop: 12 }} />
        <SkeletonBlock width="50%" height={14} style={{ marginTop: 8 }} />
        <View style={styles.skeletonMetricsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonMetricBox}>
              <SkeletonBlock width={32} height={32} borderRadius={16} />
              <SkeletonBlock width="80%" height={12} style={{ marginTop: 6 }} />
              <SkeletonBlock width="60%" height={10} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Gauge placeholder */}
      <View style={styles.skeletonSection}>
        <SkeletonBlock width={160} height={18} style={{ marginBottom: 16 }} />
        <View style={{ alignItems: 'center' }}>
          <SkeletonBlock width={200} height={110} borderRadius={100} />
        </View>
      </View>

      {/* Details rows placeholder */}
      <View style={styles.skeletonSection}>
        <SkeletonBlock width={140} height={18} style={{ marginBottom: 16 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonDetailRow}>
            <SkeletonBlock width="40%" height={13} />
            <SkeletonBlock width="30%" height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shipments, loading } = useShipments();
  const shipment = shipments.find((s) => s.shipment_id === id);

  const [showRouteModal, setShowRouteModal] = React.useState(false);
  const [routeAlternatives, setRouteAlternatives] = React.useState([]);

  // Show skeleton while the first load is in progress
  if (loading && !shipment) {
    return <ShipmentDetailSkeleton />;
  }

  // Finished loading but shipment genuinely not found
  if (!shipment) {
    return (
      <View style={styles.container}>
        <GradientHeader title="Shipment Details" subtitle="Not found" icon="analytics" />
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundEmoji}>📦</Text>
          <Text style={styles.notFoundTitle}>Shipment not found</Text>
          <Text style={styles.notFoundSub}>
            {id ? `No shipment with ID "${id}"` : 'No shipment ID provided'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <GradientHeader
        title={`Shipment ${shipment.shipment_id}`}
        subtitle={`${shipment.origin} → ${shipment.destination}`}
        icon="analytics"
      />

      <ShipmentCard shipment={shipment} onPress={() => {}} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emissions Overview</Text>
        <EmissionGauge
          value={shipment.predicted_final_co2_kg || 0}
          maxValue={100}
          unit="kg CO₂"
          label="Predicted Final Emissions"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipment Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vehicle Type</Text>
          <Text style={styles.detailValue}>
            {shipment.vehicle_type.replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cargo Weight</Text>
          <Text style={styles.detailValue}>{shipment.cargo_weight_tons} tons</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>
            {shipment.distance_covered_km} / {shipment.total_distance_km} km
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ETA</Text>
          <Text style={styles.detailValue}>
            {shipment.eta_minutes
              ? `${Math.round(shipment.eta_minutes / 60)}h ${shipment.eta_minutes % 60}m`
              : 'Arrived'}
          </Text>
        </View>
        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.detailLabel}>Driver Score</Text>
          <Text
            style={[
              styles.detailValue,
              {
                color:
                  (shipment.driver_score ?? 0) >= 80
                    ? '#10b981'
                    : (shipment.driver_score ?? 0) >= 60
                    ? '#f59e0b'
                    : '#ef4444',
              },
            ]}
          >
            {shipment.driver_score ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Text style={styles.linkButton} onPress={() => setShowRouteModal(true)}>
          View Route Alternatives
        </Text>
      </View>

      <RouteCompareModal
        visible={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        alternatives={routeAlternatives}
        shipmentId={shipment.shipment_id}
      />
    </ScrollView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  // Skeleton styles
  skeletonCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonMetricsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  skeletonMetricBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  skeletonSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  skeletonDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  // Not found state
  notFoundBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  notFoundEmoji: {
    fontSize: 48,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  notFoundSub: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Content styles
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  buttonContainer: {
    alignItems: 'center',
    margin: 16,
    marginTop: 4,
  },
  linkButton: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
