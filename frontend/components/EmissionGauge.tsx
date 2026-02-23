import React, { FC } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Circle, Text as SvgText, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// Gauge occupies 65% of screen width, capped so it never looks huge on tablets
const gaugeSize = Math.min(width * 0.65, 280);
const strokeWidth = 18;
const radius = (gaugeSize - strokeWidth) / 2;
const circumference = Math.PI * radius; // half-circle circumference

// We draw a semi-circle: circle centre sits at bottom edge of SVG visible area.
// Add 72px below to give room for the value + unit texts.
const svgWidth = gaugeSize;
const svgHeight = gaugeSize / 2 + 72;

interface EmissionGaugeProps {
  value: number;
  maxValue?: number;
  unit?: string;
  label?: string;
}

function getLevelInfo(pct: number): { label: string; color: string; bg: string; icon: string } {
  if (pct <= 0.3)  return { label: 'Low',      color: Colors.gradeA,  bg: '#dcfce7', icon: 'leaf'           };
  if (pct <= 0.6)  return { label: 'Moderate', color: Colors.gradeB,  bg: '#d1fae5', icon: 'analytics'      };
  if (pct <= 0.8)  return { label: 'High',     color: Colors.warning, bg: '#fef3c7', icon: 'warning'        };
  return             { label: 'Critical',  color: Colors.error,   bg: '#fee2e2', icon: 'alert-circle'   };
}

const LEGEND = [
  { label: 'Low',      color: Colors.gradeA  },
  { label: 'Moderate', color: Colors.gradeB  },
  { label: 'High',     color: Colors.warning },
  { label: 'Critical', color: Colors.error   },
];

const EmissionGauge: FC<EmissionGaugeProps> = ({
  value,
  maxValue = 100,
  unit = 'kg CO₂',
  label = 'Current Emissions',
}) => {
  const pct = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference - pct * circumference;
  const level = getLevelInfo(pct);
  const cx = gaugeSize / 2;
  const cy = gaugeSize / 2; // circle centre — at the bottom of the arc viewport

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="speedometer-outline" size={16} color={Colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{label}</Text>
      </View>

      {/* Gauge SVG */}
      <View style={styles.gaugeWrap}>
        <Svg width={svgWidth} height={svgHeight}>
          {/* Track arc (grey) */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(-180 ${cx} ${cy})`}
          />
          {/* Progress arc */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={level.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-180 ${cx} ${cy})`}
          />
          {/* Value */}
          <SvgText
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fontSize={28}
            fontWeight="800"
            fill={Colors.textPrimary}
          >
            {value.toFixed(1)}
          </SvgText>
          {/* Unit */}
          <SvgText
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            fontSize={13}
            fill={Colors.textSecondary}
          >
            {unit}
          </SvgText>
          {/* Min / Max labels at base of arc */}
          <SvgText
            x={strokeWidth}
            y={cy + 4}
            textAnchor="start"
            fontSize={10}
            fill={Colors.textSecondary}
          >
            0
          </SvgText>
          <SvgText
            x={gaugeSize - strokeWidth}
            y={cy + 4}
            textAnchor="end"
            fontSize={10}
            fill={Colors.textSecondary}
          >
            {maxValue}
          </SvgText>
        </Svg>

        {/* Status badge */}
        <View style={[styles.badge, { backgroundColor: level.bg }]}>
          <Ionicons name={level.icon as any} size={13} color={level.color} />
          <Text style={[styles.badgeText, { color: level.color }]}>{level.label}</Text>
        </View>
      </View>

      {/* Percentage bar */}
      <View style={styles.percentRow}>
        <Text style={styles.percentLabel}>
          {(pct * 100).toFixed(0)}% of max
        </Text>
        <View style={styles.percentTrack}>
          <View
            style={[
              styles.percentFill,
              { width: `${pct * 100}%` as any, backgroundColor: level.color },
            ]}
          />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {LEGEND.map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  gaugeWrap: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 4,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  percentRow: {
    marginTop: 16,
    marginHorizontal: 4,
  },
  percentLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 5,
    textAlign: 'right',
  },
  percentTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  percentFill: {
    height: 6,
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 3,
  },
});

export default EmissionGauge;
