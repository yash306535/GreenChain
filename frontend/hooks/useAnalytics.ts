import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';

interface FleetStats {
  date: string;
  total_co2_kg: number;
  total_shipments: number;
  avg_green_score: number;
  total_carbon_credits: number;
  flagged_shipments: number;
  created_at: string;
}

interface DriverPerformance {
  driver_id: string;
  name: string;
  score: number;
  shipments_completed: number;
  avg_eta_accuracy: number;
  co2_efficiency: number;
  ranking: number;
}

interface BenchmarkComparison {
  shipment_id: string;
  co2_per_km: number;
  benchmark_type: string;
  percentile: number;
  comparison_value: number;
  difference: number;
}

export const useAnalytics = () => {
  const [fleetStats, setFleetStats] = useState<FleetStats[]>([]);
  const [driverLeaderboard, setDriverLeaderboard] = useState<DriverPerformance[]>([]);
  const [benchmarkComparisons, setBenchmarkComparisons] = useState<BenchmarkComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAnalytics();
      if (response.success && response.data) {
        if (Array.isArray(response.data.fleet_stats)) {
          setFleetStats(response.data.fleet_stats);
          setDriverLeaderboard(response.data.driver_leaderboard?.slice(0, 10) || []); // Top 10 drivers
          setBenchmarkComparisons(response.data.benchmark_comparisons || []);
        } else {
          setFleetStats([
            {
              date: new Date().toISOString().slice(0, 10),
              total_co2_kg: response.data.total_co2_kg ?? 0,
              total_shipments: response.data.total_shipments ?? 0,
              avg_green_score: response.data.avg_green_score ?? 0,
              total_carbon_credits: response.data.total_carbon_credits ?? 0,
              flagged_shipments: response.data.flagged_shipments ?? 0,
              created_at: new Date().toISOString(),
            },
          ]);
          setDriverLeaderboard([]);
          setBenchmarkComparisons([]);
        }
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Refresh data periodically
    const interval = setInterval(fetchAnalytics, 120000); // Every 2 minutes

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    fleetStats,
    driverLeaderboard,
    benchmarkComparisons,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
