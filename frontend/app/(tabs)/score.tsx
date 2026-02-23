import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useGreenScore } from '../../hooks/useGreenScore';
import GradientHeader from '../../components/GradientHeader';
import GreenScoreBadge from '../../components/GreenScoreBadge';
import CarbonCreditCard from '../../components/CarbonCreditCard';
import AchievementBadge from '../../components/AchievementBadge';

export default function ScoreScreen() {
  const { greenScores, carbonCredits, totalCredits, loading } = useGreenScore();

  // Mock achievements data
  const mockAchievements = [
    {
      id: '1',
      title: 'Green Pioneer',
      description: 'Completed first eco-friendly shipment',
      earned: true,
      earned_date: new Date().toISOString(),
      icon: 'eco',
      points: 50,
    },
    {
      id: '2',
      title: 'Efficiency Master',
      description: 'Achieved A+ rating for 5 consecutive shipments',
      earned: true,
      earned_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      icon: 'stars',
      points: 100,
    },
    {
      id: '3',
      title: 'Carbon Hero',
      description: 'Saved 1000 kg of CO2 emissions',
      earned: false,
      icon: 'favorite',
      points: 200,
    },
    {
      id: '4',
      title: 'Route Optimizer',
      description: 'Used alternative routes 10 times',
      earned: false,
      icon: 'route',
      points: 150,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <GradientHeader 
        title="Green Score" 
        subtitle="Track sustainability metrics" 
        icon="eco"
      />

      {/* Overall Green Score */}
      <View style={styles.scoreSection}>
        {greenScores.length > 0 ? (
          <GreenScoreBadge 
            score={greenScores[0].green_score} 
            value={greenScores[0].green_score_value}
            label="Overall Green Score"
            size="large"
          />
        ) : (
          <GreenScoreBadge 
            score="B" 
            value={75}
            label="Overall Green Score"
            size="large"
          />
        )}
      </View>

      {/* Carbon Credits Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              
            </View>
            <View>
              <Text style={styles.sectionTitle}>Carbon Credits</Text>
              <Text style={styles.sectionSubtitle}>Total: {totalCredits.toFixed(2)} credits</Text>
            </View>
          </View>
        </View>
      </View>

      {carbonCredits.map(credit => (
        <CarbonCreditCard key={credit.id} credit={credit} />
      ))}

      {/* Achievements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              
            </View>
            <View>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <Text style={styles.sectionSubtitle}>Your sustainability milestones</Text>
            </View>
          </View>
        </View>
      </View>

      {mockAchievements.map(achievement => (
        <AchievementBadge key={achievement.id} achievement={achievement} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});