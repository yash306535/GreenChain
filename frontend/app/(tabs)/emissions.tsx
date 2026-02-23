import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';
import EmissionGauge from '../../components/EmissionGauge';
import TrendChart from '../../components/TrendChart';
import BenchmarkBar from '../../components/BenchmarkBar';
import Colors from '../../constants/Colors';

const mockEmissionData = [
  { x: 'Mon', y: 45.2 },
  { x: 'Tue', y: 52.1 },
  { x: 'Wed', y: 38.7 },
  { x: 'Thu', y: 41.3 },
  { x: 'Fri', y: 48.9 },
  { x: 'Sat', y: 35.6 },
  { x: 'Sun', y: 42.4 },
];

const mockBenchmarkData = [
  { name: 'India Avg',   value: 0.90, benchmark: 0.90, unit: 'kg/km' },
  { name: 'EU 2030',     value: 0.75, benchmark: 0.55, unit: 'kg/km' },
  { name: 'Best Diesel', value: 0.75, benchmark: 0.65, unit: 'kg/km' },
  { name: 'EV Truck',    value: 0.75, benchmark: 0.05, unit: 'kg/km' },
  { name: 'Train',       value: 0.75, benchmark: 0.03, unit: 'kg/km' },
];

// Derive summary stats from weekly data
const values   = mockEmissionData.map(d => d.y);
const todayVal = values[values.length - 1];
const mondayVal = values[0];
const weeklyAvg = values.reduce((a, b) => a + b, 0) / values.length;
const changeAmt = todayVal - mondayVal;
const changePct = (changeAmt / mondayVal) * 100;

const STATS = [
  {
    icon:  'today-outline'       as const,
    label: 'Today',
    value: `${todayVal.toFixed(1)}`,
    unit:  'kg CO₂',
    color: Colors.primary,
    bg:    '#dcfce7',
  },
  {
    icon:  'analytics-outline'   as const,
    label: 'Weekly Avg',
    value: `${weeklyAvg.toFixed(1)}`,
    unit:  'kg CO₂',
    color: Colors.info,
    bg:    '#dbeafe',
  },
  {
    icon:  changePct <= 0 ? 'trending-down-outline' as const : 'trending-up-outline' as const,
    label: 'vs Monday',
    value: `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`,
    unit:  'change',
    color: changePct <= 0 ? Colors.gradeA : Colors.error,
    bg:    changePct <= 0 ? '#dcfce7'    : '#fee2e2',
  },
];

export default function EmissionsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <GradientHeader
        title="Emissions Tracking"
        subtitle="Monitor your carbon footprint"
        icon="eco"
      />

      {/* Summary stats */}
      <View style={styles.statsRow}>
        {STATS.map(s => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={15} color={s.color} />
            </View>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statUnit}>{s.unit}</Text>
          </View>
        ))}
      </View>

      {/* Live indicator */}
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Live · Updated just now</Text>
        <Ionicons name="refresh-outline" size={12} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
      </View>

      {/* Section label */}
      <SectionLabel icon="speedometer-outline" text="Current Level" />
      <EmissionGauge
        value={42.5}
        maxValue={100}
        unit="kg CO₂"
        label="Current Emissions"
      />

      {/* Section label */}
      <SectionLabel icon="bar-chart-outline" text="Weekly Trend" />
      <TrendChart
        data={mockEmissionData}
        title="Weekly Emission Trends"
        yAxisLabel=""
        unit="kg"
      />

      {/* Section label */}
      <SectionLabel icon="podium-outline" text="Industry Benchmarks" />
      <BenchmarkBar
        data={mockBenchmarkData}
        title="Performance vs Benchmarks"
      />
    </ScrollView>
  );
}

function SectionLabel({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Ionicons name={icon} size={13} color={Colors.primaryDark} />
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Summary stats row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statUnit: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Live indicator
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gradeA,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Section labels
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 2,
    gap: 5,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 3,
  },
});
