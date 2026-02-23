import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';
import { notificationService } from '../lib/notifications';

interface Shipment {
  id: string;
  shipment_id: string;
  origin: string;
  destination: string;
  current_lat?: number;
  current_lng?: number;
  speed_kmh?: number;
  fuel_consumed_liters?: number;
  distance_covered_km?: number;
  total_distance_km: number;
  eta_minutes?: number;
  status: string;
  vehicle_type: string;
  cargo_weight_tons?: number;
  driver_score?: number;
  green_score?: string;
  green_score_value?: number;
  predicted_final_co2_kg?: number;
  total_co2_kg?: number;
  co2_per_km?: number;
  created_at: string;
  updated_at: string;
}

export const useShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await apiService.getShipments();
      if (response.success && response.data) {
        setShipments(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch shipments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshShipment = async (id: string) => {
    try {
      const response = await apiService.getShipmentById(id);
      if (response.success && response.data) {
        setShipments(prev => prev.map(shipment => 
          shipment.shipment_id === id ? response.data : shipment
        ));
      }
    } catch (err) {
      console.error(`Error refreshing shipment ${id}:`, err);
    }
  };

  useEffect(() => {
    fetchShipments();

    // Set up notification listener for shipment updates
    const subscription = notificationService.addNotificationReceivedListener(notification => {
      // Handle shipment-related notifications
      const data = notification.request.content.data;
      if (data && data.type === 'shipment_update') {
        refreshShipment(data.shipmentId);
      }
    });

    // Refresh data periodically
    const interval = setInterval(fetchShipments, 30000); // Every 30 seconds

    return () => {
      subscription?.remove();
      clearInterval(interval);
    };
  }, []);

  return {
    shipments,
    loading,
    error,
    refetch: fetchShipments,
    refreshShipment,
  };
};
