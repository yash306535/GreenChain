import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';

interface GreenScore {
  shipment_id: string;
  green_score: string;
  green_score_value: number;
  co2_efficiency: number;
  driver_performance: number;
  vehicle_type_bonus: number;
  load_utilization: number;
  benchmark_comparison: string;
  percentile_rank: number;
  last_updated: string;
}

interface CarbonCredit {
  id: string;
  shipment_id: string;
  credits_earned: number;
  baseline_co2_kg: number;
  actual_co2_kg: number;
  co2_saved_kg: number;
  credit_value_inr: number;
  created_at: string;
}

export const useGreenScore = () => {
  const [greenScores, setGreenScores] = useState<GreenScore[]>([]);
  const [carbonCredits, setCarbonCredits] = useState<CarbonCredit[]>([]);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGreenScores = async () => {
    setLoading(true);
    try {
      // Fetch green scores
      const scoresResponse = await apiService.getGreenScore();
      if (scoresResponse.success && scoresResponse.data) {
        const rawScores = Array.isArray(scoresResponse.data)
          ? scoresResponse.data
          : scoresResponse.data.scores || [];

        const normalizedScores = rawScores.map((entry: any) => ({
          shipment_id: entry.shipment_id,
          green_score: entry.green_score || entry.grade || 'B',
          green_score_value: entry.green_score_value ?? entry.value ?? 0,
          co2_efficiency: entry.co2_efficiency ?? 0,
          driver_performance: entry.driver_performance ?? 0,
          vehicle_type_bonus: entry.vehicle_type_bonus ?? 0,
          load_utilization: entry.load_utilization ?? 0,
          benchmark_comparison: entry.benchmark_comparison ?? '',
          percentile_rank: entry.percentile_rank ?? 0,
          last_updated: entry.last_updated ?? new Date().toISOString(),
        }));

        setGreenScores(normalizedScores);
      }

      // Fetch carbon credits
      const creditsResponse = await apiService.getReports();
      if (creditsResponse.success && creditsResponse.data) {
        const credits = creditsResponse.data.carbon_credits || [];
        setCarbonCredits(credits);
        
        // Calculate total credits
        const total = credits?.reduce(
          (sum: number, credit: CarbonCredit) => sum + (credit.credits_earned || 0), 
          0
        ) || 0;
        setTotalCredits(total);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGreenScores();

    // Refresh data periodically
    const interval = setInterval(fetchGreenScores, 60000); // Every minute

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    greenScores,
    carbonCredits,
    totalCredits,
    loading,
    error,
    refetch: fetchGreenScores,
  };
};
