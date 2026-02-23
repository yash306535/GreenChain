import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMLInsights } from '../../hooks/useMLInsights';
import GradientHeader from '../../components/GradientHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────────────────────

const gradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return '#22c55e';
    case 'B': return '#3b82f6';
    case 'C': return '#f59e0b';
    case 'D': return '#f97316';
    default:  return '#ef4444';
  }
};

const severityColor = (level: string) => {
  switch (level) {
    case 'low':      return '#22c55e';
    case 'medium':   return '#f59e0b';
    case 'high':     return '#f97316';
    case 'critical': return '#ef4444';
    default:         return '#6b7280';
  }
};

const riskColor = (level: string) => {
  switch (level) {
    case 'low':    return '#22c55e';
    case 'medium': return '#f59e0b';
    case 'high':   return '#ef4444';
    default:       return '#6b7280';
  }
};

// Simple bar component for charts
const Bar = ({ value, maxValue, color, label, subLabel }: {
  value: number; maxValue: number; color: string; label: string; subLabel?: string;
}) => {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={barStyles.value}>{subLabel ?? value.toFixed(1)}</Text>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 60, fontSize: 11, color: '#6b7280' },
  track: { flex: 1, height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 5 },
  value: { width: 55, fontSize: 11, color: '#374151', textAlign: 'right' },
});

// ── Section wrapper ──────────────────────────────────────────────────

const Section = ({ title, subtitle, icon, children, modelTag }: {
  title: string; subtitle: string; icon: string; children: React.ReactNode; modelTag?: string;
}) => (
  <View style={sectionStyles.container}>
    <View style={sectionStyles.header}>
      <View style={sectionStyles.iconWrap}>
        <MaterialIcons name={icon as any} size={20} color="#22c55e" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={sectionStyles.title}>{title}</Text>
        <Text style={sectionStyles.subtitle}>{subtitle}</Text>
      </View>
    </View>
    {children}
    {modelTag && (
      <View style={sectionStyles.modelRow}>
        <MaterialIcons name="memory" size={12} color="#9ca3af" />
        <Text style={sectionStyles.modelText}>{modelTag}</Text>
      </View>
    )}
  </View>
);

const sectionStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconWrap: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  modelText: { fontSize: 10, color: '#9ca3af', marginLeft: 4 },
});

// ── Stat pill ────────────────────────────────────────────────────────

const Stat = ({ label, value, color, unit }: {
  label: string; value: string | number; color?: string; unit?: string;
}) => (
  <View style={statStyles.pill}>
    <Text style={statStyles.label}>{label}</Text>
    <Text style={[statStyles.value, color ? { color } : undefined]}>
      {value}{unit ? ` ${unit}` : ''}
    </Text>
  </View>
);

const statStyles = StyleSheet.create({
  pill: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 10, alignItems: 'center', marginHorizontal: 3 },
  label: { fontSize: 10, color: '#6b7280', marginBottom: 4, textAlign: 'center' },
  value: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
});

// ── Main Screen ──────────────────────────────────────────────────────

export default function MLScreen() {
  const {
    co2Prediction, anomalyResult, driverProfile,
    creditForecast, routeRec, fuelWaste, shipmentScore,
    loading, error, refetch,
  } = useMLInsights();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading ML Insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <GradientHeader
        title="ML Insights"
        subtitle="7 AI models powering your fleet"
        icon="psychology"
      />

      {/* 1. CO2 Prediction */}
      {co2Prediction && (
        <Section title="CO\u2082 Emission Prediction" subtitle="RandomForest regression on trip features" icon="cloud" modelTag={co2Prediction.model}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={[styles.gradeBadge, { backgroundColor: gradeColor(co2Prediction.grade) }]}>
              <Text style={styles.gradeText}>{co2Prediction.grade}</Text>
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.bigValue}>{co2Prediction.predicted_co2_kg} <Text style={styles.bigUnit}>kg CO\u2082</Text></Text>
              <Text style={{ fontSize: 12, color: co2Prediction.delta_kg > 0 ? '#22c55e' : '#ef4444', marginTop: 2 }}>
                {co2Prediction.delta_kg > 0 ? '\u2193' : '\u2191'} {Math.abs(co2Prediction.delta_kg).toFixed(1)} kg vs baseline
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Stat label="CO\u2082/km" value={co2Prediction.co2_per_km} unit="kg" />
            <Stat label="Credits" value={co2Prediction.credits_earned} color="#22c55e" />
            <Stat label="Value" value={`\u20B9${co2Prediction.credits_inr}`} color="#3b82f6" />
          </View>
        </Section>
      )}

      {/* 2. Anomaly Detection */}
      {anomalyResult && (
        <Section title="Anomaly Detection" subtitle="IsolationForest on driving telemetry" icon="warning" modelTag={anomalyResult.model}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={[styles.statusDot, { backgroundColor: severityColor(anomalyResult.severity_level) }]} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                {anomalyResult.is_anomaly ? 'Anomaly Detected' : 'Normal Behaviour'}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{anomalyResult.alert_message}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <Stat label="Severity" value={anomalyResult.severity_score} color={severityColor(anomalyResult.severity_level)} />
            <Stat label="Level" value={anomalyResult.severity_level.toUpperCase()} color={severityColor(anomalyResult.severity_level)} />
          </View>
          {Object.entries(anomalyResult.factors).map(([key, val]) => (
            <View key={key} style={styles.factorRow}>
              <Text style={styles.factorKey}>{key.replace(/_/g, ' ')}</Text>
              <View style={[styles.factorBadge, { backgroundColor: val === 'normal' ? '#dcfce7' : '#fef3c7' }]}>
                <Text style={{ fontSize: 11, color: val === 'normal' ? '#166534' : '#92400e', fontWeight: '600' }}>{val}</Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* 3. Driver Profile */}
      {driverProfile && (
        <Section title="Driver Behaviour Profile" subtitle="KMeans clustering (k=4)" icon="person" modelTag={driverProfile.model}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={[styles.profileBadge, { backgroundColor: driverProfile.color }]}>
              <MaterialIcons name="directions-car" size={22} color="#fff" />
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: driverProfile.color }}>{driverProfile.badge}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Risk Score: {driverProfile.risk_score}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Coaching Tips</Text>
          {driverProfile.coaching_tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <MaterialIcons name="lightbulb-outline" size={14} color="#f59e0b" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* 4. Carbon Credit Forecast */}
      {creditForecast && (
        <Section title="Carbon Credit Forecast" subtitle="GradientBoosting 30-day projection" icon="trending-up" modelTag={creditForecast.model}>
          <View style={{ flexDirection: 'row', marginBottom: 14 }}>
            <Stat label="Total Credits" value={creditForecast.total_credits} color="#22c55e" />
            <Stat label="Total Value" value={`\u20B9${creditForecast.total_inr}`} color="#3b82f6" />
            <Stat label="Avg/Day" value={creditForecast.avg_daily_credits} />
          </View>
          {/* Mini chart - show first 14 days as bars */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Next 14 Days</Text>
          {creditForecast.forecast.slice(0, 14).map((d, i) => (
            <Bar
              key={d.date}
              value={d.credits}
              maxValue={1.2}
              color={d.day === 'Sat' || d.day === 'Sun' ? '#94a3b8' : '#22c55e'}
              label={d.day}
              subLabel={`${d.credits.toFixed(3)} cr`}
            />
          ))}
        </Section>
      )}

      {/* 5. Route Recommendation */}
      {routeRec && (
        <Section title="Route Mode Recommendation" subtitle="GBClassifier on logistics features" icon="alt-route" modelTag={routeRec.model}>
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <View style={styles.recBadge}>
              <MaterialIcons
                name={routeRec.recommended_mode === 'rail' ? 'train' : routeRec.recommended_mode === 'road' ? 'local-shipping' : 'swap-horiz'}
                size={28}
                color="#fff"
              />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginTop: 8 }}>
              {routeRec.recommended_mode.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
              {routeRec.confidence}% confidence
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <Stat label="CO\u2082 Saved" value={routeRec.co2_saved_kg} unit="kg" color="#22c55e" />
            <Stat label="Credits" value={routeRec.credits_earned} color="#22c55e" />
            <Stat label="Value" value={`\u20B9${routeRec.credits_inr}`} color="#3b82f6" />
          </View>
          {/* Alternative mode scores */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Mode Comparison</Text>
          {Object.entries(routeRec.alternatives).map(([mode, data]) => (
            <Bar
              key={mode}
              value={data.score}
              maxValue={100}
              color={mode === routeRec.recommended_mode ? '#22c55e' : '#94a3b8'}
              label={mode.replace(/_/g, ' ')}
              subLabel={`${data.score}%`}
            />
          ))}
        </Section>
      )}

      {/* 6. Fuel Waste Risk */}
      {fuelWaste && (
        <Section title="Fuel Waste Early Warning" subtitle="RandomForest pre-trip risk assessment" icon="local-gas-station" modelTag={fuelWaste.model}>
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <View style={styles.riskCircle}>
              <Text style={[styles.riskPct, { color: riskColor(fuelWaste.risk_level) }]}>{fuelWaste.risk_pct}%</Text>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>Risk</Text>
            </View>
            <View style={[styles.riskLevelBadge, { backgroundColor: riskColor(fuelWaste.risk_level) }]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{fuelWaste.risk_level.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.recBox}>
            <MaterialIcons name="info-outline" size={16} color="#3b82f6" />
            <Text style={styles.recText}>{fuelWaste.recommendation}</Text>
          </View>
          {fuelWaste.risk_factors.map((f, i) => (
            <View key={i} style={styles.tipRow}>
              <MaterialIcons name="report-problem" size={14} color="#f59e0b" />
              <Text style={styles.tipText}>{f}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* 7. Shipment Green Score */}
      {shipmentScore && (
        <Section title="Green Grade Scorer" subtitle="MLP Neural Network (128-64-32)" icon="verified" modelTag={shipmentScore.model}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={[styles.gradeBadge, { backgroundColor: gradeColor(shipmentScore.grade), width: 56, height: 56, borderRadius: 28 }]}>
              <Text style={[styles.gradeText, { fontSize: 22 }]}>{shipmentScore.grade}</Text>
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.bigValue}>{shipmentScore.score} <Text style={styles.bigUnit}>/ 100</Text></Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                CO\u2082 ratio: {shipmentScore.co2_ratio}x baseline
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Improvement Tips</Text>
          {shipmentScore.improvement_tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <MaterialIcons name="tips-and-updates" size={14} color="#22c55e" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Section>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  gradeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  bigValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  bigUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  factorKey: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  factorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  recBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskPct: {
    fontSize: 22,
    fontWeight: '800',
  },
  riskLevelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  recText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
