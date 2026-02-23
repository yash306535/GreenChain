import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface BenchmarkComparison {
  name: string;
  value: number;    // your actual value
  benchmark: number; // target / industry benchmark
  unit: string;
}

interface BenchmarkBarProps {
  data: BenchmarkComparison[];
  title: string;
}

function getBarColor(value: number, benchmark: number): string {
  const ratio = value / benchmark;
  if (ratio <= 1.0)  return Colors.gradeA;   // at or below target → green
  if (ratio <= 1.25) return Colors.warning;   // up to 25% above → amber
  return Colors.error;                        // >25% above → red
}

function getStatusIcon(value: number, benchmark: number): { name: string; color: string } {
  const ratio = value / benchmark;
  if (ratio <= 1.0)  return { name: 'checkmark-circle', color: Colors.gradeA  };
  if (ratio <= 1.25) return { name: 'remove-circle',    color: Colors.warning };
  return                     { name: 'close-circle',    color: Colors.error   };
}

const BenchmarkBar: FC<BenchmarkBarProps> = ({ data, title }) => {
  const allValues = data.flatMap(d => [d.value, d.benchmark]);
  const maxVal = Math.max(...allValues) * 1.12; // 12% headroom

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="podium-outline" size={15} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendLabel}>Your value</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker]} />
          <Text style={styles.legendLabel}>Target</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Rows */}
      {data.map((item, idx) => {
        const valuePct  = (item.value     / maxVal) * 100;
        const targetPct = (item.benchmark / maxVal) * 100;
        const barColor  = getBarColor(item.value, item.benchmark);
        const status    = getStatusIcon(item.value, item.benchmark);
        const isLast    = idx === data.length - 1;

        return (
          <View key={idx} style={[styles.row, isLast && styles.rowLast]}>
            {/* Name + status icon */}
            <View style={styles.rowLabel}>
              <Ionicons name={status.name as any} size={14} color={status.color} style={styles.statusIcon} />
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
            </View>

            {/* Bar track */}
            <View style={styles.barTrack}>
              {/* Filled portion */}
              <View
                style={[
                  styles.barFill,
                  { width: `${valuePct}%` as any, backgroundColor: barColor },
                ]}
              />
              {/* Target marker */}
              <View
                style={[
                  styles.targetMarker,
                  { left: `${targetPct}%` as any },
                ]}
              />
            </View>

            {/* Values */}
            <View style={styles.rowValues}>
              <Text style={[styles.yourValue, { color: barColor }]}>
                {item.value.toFixed(2)}
              </Text>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.targetValue}>
                {item.benchmark.toFixed(2)}
              </Text>
              <Text style={styles.unit}> {item.unit}</Text>
            </View>
          </View>
        );
      })}

      {/* Footer tip */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={12} color={Colors.textSecondary} />
        <Text style={styles.footerText}>Bar = your value · Marker = target</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
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
  legendRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  legendMarker: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    backgroundColor: Colors.textPrimary,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginBottom: 4,
  },

  // --- Each row ---
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 8,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusIcon: {
    marginRight: 6,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },

  // Progress bar
  barTrack: {
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 10,
    borderRadius: 5,
  },
  targetMarker: {
    position: 'absolute',
    top: -3,
    width: 3,
    height: 16,
    borderRadius: 1.5,
    backgroundColor: Colors.textPrimary,
    marginLeft: -1.5,
  },

  // Value labels
  rowValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  yourValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 5,
  },
  targetValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  unit: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 3,
  },
});

export default BenchmarkBar;
