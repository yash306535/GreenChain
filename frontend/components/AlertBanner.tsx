import React, { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface AlertBannerProps {
  alert: {
    id: string;
    shipment_id: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    is_read: boolean;
    created_at: string;
  };
  onDismiss?: (id: string) => void;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const AlertBanner: FC<AlertBannerProps> = ({ alert, onDismiss, onPress, style }) => {
  // Get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return Colors.info;
      case 'medium':
        return Colors.warning;
      case 'high':
        return '#f97316'; // Orange
      case 'critical':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  // Get icon based on alert type
  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'high_emission':
        return 'warning';
      case 'idling':
        return 'hourglass-empty';
      case 'fuel_leak_suspected':
        return 'local-gas-station';
      case 'delay_risk':
        return 'schedule';
      case 'route_deviation':
        return 'navigation';
      default:
        return 'notifications';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAlertType = (alertType: string) => {
    return alertType
      .split('_')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const severityColor = getSeverityColor(alert.severity);
  const alertIcon = getAlertIcon(alert.alert_type);

  return (
    <TouchableOpacity 
      style={[styles.container, { borderLeftColor: severityColor }, style]} 
      onPress={() => onPress && onPress(alert.id)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name={alertIcon} size={24} color={severityColor} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.alertType, { color: severityColor }]}>{formatAlertType(alert.alert_type)}</Text>
          <Text style={styles.time}>{formatTime(alert.created_at)}</Text>
        </View>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.shipmentId}>Shipment: {alert.shipment_id}</Text>
      </View>
      
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={() => onDismiss(alert.id)}>
          <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  message: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  shipmentId: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dismissButton: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
});

export default AlertBanner;
