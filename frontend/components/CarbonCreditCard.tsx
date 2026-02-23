import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface CarbonCreditCardProps {
  credit: {
    id: string;
    shipment_id: string;
    credits_earned: number;
    baseline_co2_kg: number;
    actual_co2_kg: number;
    co2_saved_kg: number;
    credit_value_inr: number;
    created_at: string;
  };
}

const CarbonCreditCard: FC<CarbonCreditCardProps> = ({ credit }) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="paid" size={24} color={Colors.success} />
        </View>
        <View style={styles.creditInfo}>
          <Text style={styles.creditAmount}>{credit.credits_earned.toFixed(2)}</Text>
          <Text style={styles.creditLabel}>Carbon Credits Earned</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="trending-up" size={16} color={Colors.success} />
            <Text style={styles.detailLabel}>CO₂ Saved</Text>
            <Text style={styles.detailValue}>{credit.co2_saved_kg.toFixed(2)} kg</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="currency-exchange" size={16} color={Colors.info} />
            <Text style={styles.detailLabel}>Value</Text>
            <Text style={styles.detailValue}>{formatCurrency(credit.credit_value_inr)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="flag-circle" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Baseline</Text>
            <Text style={styles.detailValue}>{credit.baseline_co2_kg.toFixed(2)} kg</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="check-circle" size={16} color={Colors.success} />
            <Text style={styles.detailLabel}>Actual</Text>
            <Text style={styles.detailValue}>{credit.actual_co2_kg.toFixed(2)} kg</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.shipmentId}>Shipment: {credit.shipment_id}</Text>
        <Text style={styles.date}>{formatDate(credit.created_at)}</Text>
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
  iconContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
  },
  creditInfo: {
    flex: 1,
  },
  creditAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.success,
  },
  creditLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  detailItemLast: {
    marginRight: 0,
  },
  detailLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  shipmentId: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default CarbonCreditCard;