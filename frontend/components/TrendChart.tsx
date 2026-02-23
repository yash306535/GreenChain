import React, { FC } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// Card has marginHorizontal: 16 → inner card width = width - 32.
// No horizontal padding on the card so the chart fills edge-to-edge inside the card.
const CARD_H_MARGIN = 16;
const chartWidth = width - CARD_H_MARGIN * 2;

interface DataPoint {
  x: string;
  y: number;
}

interface TrendChartProps {
  data: DataPoint[];
  title: string;
  yAxisLabel?: string;
  color?: string;
  unit?: string;
}

const TrendChart: FC<TrendChartProps> = ({
  data,
  title,
  yAxisLabel = '',
  color = Colors.primary,
  unit = '',
}) => {
  const chartData = {
    labels: data.map(p => p.x),
    datasets: [{ data: data.map(p => p.y), strokeWidth: 2.5 }],
  };

  const values = data.map(p => p.y);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = values.reduce((a, b) => a + b, 0) / values.length;

  const stats = [
    { icon: 'trending-down-outline' as const, label: 'Min', value: `${minVal.toFixed(1)} ${unit}`, color: Colors.gradeA },
    { icon: 'analytics-outline'     as const, label: 'Avg', value: `${avgVal.toFixed(1)} ${unit}`, color: Colors.info   },
    { icon: 'trending-up-outline'   as const, label: 'Max', value: `${maxVal.toFixed(1)} ${unit}`, color: Colors.warning },
  ];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="bar-chart-outline" size={15} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Chart — zero horizontal padding so it fills the card cleanly */}
      <LineChart
        data={chartData}
        width={chartWidth}
        height={210}
        yAxisLabel={yAxisLabel}
        yAxisSuffix={unit ? ` ${unit}` : ''}
        withInnerLines={true}
        withOuterLines={false}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#f8fafc',
          decimalPlaces: 1,
          color: (opacity = 1) => color,
          labelColor: () => Colors.textSecondary,
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: color,
            fill: '#ffffff',
          },
          propsForBackgroundLines: {
            stroke: '#f1f5f9',
            strokeDasharray: '',
            strokeWidth: 1,
          },
          propsForLabels: { fontSize: 10 },
          fillShadowGradientFrom: color,
          fillShadowGradientTo: '#ffffff',
          fillShadowGradientOpacity: 0.15,
        }}
        bezier
        style={styles.chart}
      />

      {/* Stats row */}
      <View style={styles.statsRow}>
        {stats.map(s => (
          <View key={s.label} style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: s.color + '22' }]}>
              <Ionicons name={s.icon} size={13} color={s.color} />
            </View>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: CARD_H_MARGIN,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden', // clips chart edges to card border-radius
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default TrendChart;
