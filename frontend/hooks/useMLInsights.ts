import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../lib/api';

export interface CO2Prediction {
  predicted_co2_kg: number;
  co2_per_km: number;
  baseline_co2_kg: number;
  delta_kg: number;
  credit_status: string;
  credits_earned: number;
  credits_inr: number;
  grade: string;
  model: string;
}

export interface AnomalyResult {
  is_anomaly: boolean;
  severity_score: number;
  severity_level: string;
  alert_message: string;
  factors: Record<string, string>;
  model: string;
}

export interface DriverProfile {
  profile: string;
  badge: string;
  color: string;
  risk_score: number;
  coaching_tips: string[];
  model: string;
}

export interface CreditForecast {
  forecast: Array<{ date: string; day: string; credits: number; inr: number }>;
  total_credits: number;
  total_inr: number;
  avg_daily_credits: number;
  model: string;
}

export interface RouteRecommendation {
  recommended_mode: string;
  confidence: number;
  co2_saved_kg: number;
  credits_earned: number;
  credits_inr: number;
  alternatives: Record<string, { score: number }>;
  model: string;
}

export interface FuelWasteResult {
  risk_pct: number;
  risk_level: string;
  risk_factors: string[];
  recommendation: string;
  model: string;
}

export interface ShipmentScore {
  score: number;
  grade: string;
  co2_ratio: number;
  improvement_tips: string[];
  model: string;
}

export const useMLInsights = () => {
  const [co2Prediction, setCO2Prediction] = useState<CO2Prediction | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [creditForecast, setCreditForecast] = useState<CreditForecast | null>(null);
  const [routeRec, setRouteRec] = useState<RouteRecommendation | null>(null);
  const [fuelWaste, setFuelWaste] = useState<FuelWasteResult | null>(null);
  const [shipmentScore, setShipmentScore] = useState<ShipmentScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [co2Res, anomalyRes, driverRes, forecastRes, routeRes, fuelRes, scoreRes] =
        await Promise.all([
          apiService.predictCO2({}),
          apiService.detectAnomaly({}),
          apiService.getDriverProfile({}),
          apiService.forecastCredits(30),
          apiService.recommendRoute({}),
          apiService.fuelWasteRisk({}),
          apiService.scoreShipment({}),
        ]);

      if (co2Res.success && co2Res.data) setCO2Prediction(co2Res.data);
      if (anomalyRes.success && anomalyRes.data) setAnomalyResult(anomalyRes.data);
      if (driverRes.success && driverRes.data) setDriverProfile(driverRes.data);
      if (forecastRes.success && forecastRes.data) setCreditForecast(forecastRes.data);
      if (routeRes.success && routeRes.data) setRouteRec(routeRes.data);
      if (fuelRes.success && fuelRes.data) setFuelWaste(fuelRes.data);
      if (scoreRes.success && scoreRes.data) setShipmentScore(scoreRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ML insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    co2Prediction,
    anomalyResult,
    driverProfile,
    creditForecast,
    routeRec,
    fuelWaste,
    shipmentScore,
    loading,
    error,
    refetch: fetchAll,
  };
};
