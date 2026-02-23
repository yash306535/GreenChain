import React, { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface ShipmentCardProps {
  shipment: {
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
  };
  onPress: () => void;
  style?: ViewStyle;
}

const ShipmentCard: FC<ShipmentCardProps> = ({ shipment, onPress, style }) => {
  // Calculate progress percentage
  const progress = shipment.distance_covered_km 
    ? Math.min(100, (shipment.distance_covered_km / shipment.total_distance_km) * 100)
    : 0;

  // Get color based on green score
  const getGreenScoreColor = (score?: string) => {
    if (!score) return Colors.textSecondary;
    switch (score.toUpperCase()) {
      case 'A+':
      case 'A':
        return Colors.gradeA;
      case 'B':
        return Colors.gradeB;
      case 'C':
        return Colors.gradeC;
      case 'D':
        return Colors.gradeD;
      case 'F':
        return Colors.gradeF;
      default:
        return Colors.textSecondary;
    }
  };

  // Get icon based on vehicle type
  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'truck':
        return 'local-shipping';
      case 'ev_truck':
      case 'electric':
        return 'ev-station';
      case 'rail':
        return 'train';
      case 'ship':
        return 'directions-boat';
      default:
        return 'local-shipping';
    }
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <Text style={styles.idText}>{shipment.shipment_id}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: getGreenScoreColor(shipment.green_score) }]}>
            <Text style={styles.scoreText}>{shipment.green_score || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: shipment.status === 'in_transit' ? Colors.primary : Colors.warning }]} />
          <Text style={styles.statusText}>{shipment.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={16} color={Colors.primary} />
          <Text style={styles.locationText}>{shipment.origin}</Text>
        </View>
        <View style={styles.routeLine}>
          <View style={styles.progressLine}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
        </View>
        <View style={styles.locationRow}>
          <MaterialIcons name="flag" size={16} color={Colors.primary} />
          <Text style={styles.locationText}>{shipment.destination}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="speed" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailValue}>{shipment.speed_kmh?.toFixed(1) || '0'} km/h</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="local-gas-station" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailValue}>{shipment.fuel_consumed_liters?.toFixed(1) || '0'} L</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name={getVehicleIcon(shipment.vehicle_type)} size={16} color={Colors.textSecondary} />
            <Text style={styles.detailValue}>{shipment.vehicle_type}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="eco" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailValue}>{shipment.predicted_final_co2_kg?.toFixed(1) || '0'} kg CO₂</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="person" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailValue}>Dr. {shipment.driver_score?.toFixed(0) || '100'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 12,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  routeContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  progressLine: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.textSecondary,
    minWidth: 40,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    marginLeft: 4,
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});

export default ShipmentCard;