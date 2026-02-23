import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import GradientHeader from '../../components/GradientHeader';
import DriverScoreCard from '../../components/DriverScoreCard';
import TrendChart from '../../components/TrendChart';

export default function AnalyticsScreen() {
  const { driverLeaderboard, fleetStats, loading } = useAnalytics();

  // Mock data for trend chart
  const mockTrendData = [
    { x: 'Jan', y: 420 },
    { x: 'Feb', y: 380 },
    { x: 'Mar', y: 450 },
    { x: 'Apr', y: 390 },
    { x: 'May', y: 410 },
    { x: 'Jun', y: 370 },
  ];

  return (
    <ScrollView style={styles.container}>
      <GradientHeader 
        title="Analytics" 
        subtitle="Fleet performance insights" 
        icon="analytics"
      />

      <TrendChart 
        data={mockTrendData} 
        title="Monthly Fleet Emissions (kg CO₂)" 
        yAxisLabel="" 
        unit="kg" 
      />

      {/* Driver Leaderboard */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionIcon}>
            
          </View>
          <View>
            <Text style={styles.sectionTitle}>Driver Leaderboard</Text>
            <Text style={styles.sectionSubtitle}>Top performers in the fleet</Text>
          </View>
        </View>
      </View>

      {driverLeaderboard.map((driver, index) => (
        <DriverScoreCard key={driver.driver_id} driver={driver} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  sectionIconInner: {
    width: 24,
    height: 24,
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