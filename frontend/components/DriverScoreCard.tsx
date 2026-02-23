import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface DriverScoreCardProps {
  driver: {
    driver_id: string;
    name: string;
    score: number;
    shipments_completed: number;
    avg_eta_accuracy: number;
    co2_efficiency: number;
    ranking: number;
  };
}

const DriverScoreCard: FC<DriverScoreCardProps> = ({ driver }) => {
  // Determine badge based on ranking
  const getRankingBadge = (rank: number) => {
    if (rank === 1) return { icon: 'emojiEvents' as const, color: Colors.warning, text: '1st' };
    if (rank === 2) return { icon: 'emojiEvents' as const, color: '#C0C0C0', text: '2nd' }; // Silver
    if (rank === 3) return { icon: 'emojiEvents' as const, color: '#CD7F32', text: '3rd' }; // Bronze
    return { icon: 'grading' as const, color: Colors.textSecondary, text: `#${rank}` };
  };

  const rankingBadge = getRankingBadge(driver.ranking);

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return Colors.gradeA;
    if (score >= 80) return Colors.gradeB;
    if (score >= 70) return Colors.gradeC;
    if (score >= 60) return Colors.gradeD;
    return Colors.gradeF;
  };

  const scoreColor = getScoreColor(driver.score);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.rankContainer}>
          <MaterialIcons name={rankingBadge.icon === 'emojiEvents' ? 'emoji-events' : rankingBadge.icon} size={24} color={rankingBadge.color} />
          <Text style={[styles.rankText, { color: rankingBadge.color }]}>{rankingBadge.text}</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverId}>ID: {driver.driver_id}</Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{driver.score.toFixed(0)}</Text>
          <Text style={styles.scoreLabel}>Driver Score</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <MaterialIcons name="local-shipping" size={16} color={Colors.textSecondary} />
          <Text style={styles.metricLabel}>Shipments</Text>
          <Text style={styles.metricValue}>{driver.shipments_completed}</Text>
        </View>
        <View style={styles.metricItem}>
          <MaterialIcons name="access-time" size={16} color={Colors.textSecondary} />
          <Text style={styles.metricLabel}>ETA Acc.</Text>
          <Text style={styles.metricValue}>{driver.avg_eta_accuracy.toFixed(1)}%</Text>
        </View>
        <View style={styles.metricItem}>
          <MaterialIcons name="eco" size={16} color={Colors.textSecondary} />
          <Text style={styles.metricLabel}>CO₂ Eff.</Text>
          <Text style={styles.metricValue}>{driver.co2_efficiency.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  driverId: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
});

export default DriverScoreCard;