import React, { FC, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface RouteAlternative {
  id: string;
  original_co2_kg: number;
  alternative_route: string;
  alternative_vehicle: string;
  estimated_co2_saving_pct: number;
  estimated_time_delta_mins: number;
  cost_implication_inr: number;
  gemini_reasoning: string;
  created_at: string;
}

interface RouteCompareModalProps {
  visible: boolean;
  onClose: () => void;
  alternatives: RouteAlternative[];
  shipmentId: string;
}

const RouteCompareModal: FC<RouteCompareModalProps> = ({ 
  visible, 
  onClose, 
  alternatives, 
  shipmentId 
}) => {
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  const formatTimeChange = (minutes: number) => {
    if (minutes === 0) return 'No change';
    return minutes > 0 
      ? `+${minutes} min` 
      : `${minutes} min`;
  };

  const formatCostChange = (cost: number) => {
    if (cost === 0) return 'No change';
    return cost > 0 
      ? `+₹${Math.abs(cost).toFixed(2)}` 
      : `-₹${Math.abs(cost).toFixed(2)}`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Route Alternatives</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            {alternatives.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="route" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>No alternative routes available</Text>
                <Text style={styles.emptyStateSubtext}>Try again later or contact support</Text>
              </View>
            ) : (
              alternatives.map((alternative, index) => (
                <View 
                  key={alternative.id} 
                  style={[
                    styles.alternativeContainer,
                    selectedAlternative === alternative.id && styles.selectedAlternative
                  ]}
                >
                  <View style={styles.alternativeHeader}>
                    <Text style={styles.alternativeTitle}>
                      Alternative #{index + 1}: {alternative.alternative_vehicle}
                    </Text>
                    <View style={styles.badgeContainer}>
                      <MaterialIcons name="trending-down" size={16} color={Colors.success} />
                      <Text style={styles.badgeText}>
                        {Math.abs(alternative.estimated_co2_saving_pct).toFixed(1)}% CO₂ saving
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="eco" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailLabel}>Original CO₂</Text>
                        <Text style={styles.detailValue}>{alternative.original_co2_kg.toFixed(2)} kg</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="swap-horiz" size={16} color={Colors.success} />
                        <Text style={styles.detailLabel}>Time Change</Text>
                        <Text style={[styles.detailValue, alternative.estimated_time_delta_mins >= 0 ? styles.positiveValue : styles.negativeValue]}>
                          {formatTimeChange(alternative.estimated_time_delta_mins)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="currency-exchange" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailLabel}>Cost Impact</Text>
                        <Text style={[styles.detailValue, alternative.cost_implication_inr >= 0 ? styles.positiveValue : styles.negativeValue]}>
                          {formatCostChange(alternative.cost_implication_inr)}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="info" size={16} color={Colors.info} />
                        <Text style={styles.detailLabel}>Reasoning</Text>
                        <Text style={styles.reasoningText} numberOfLines={2}>
                          {alternative.gemini_reasoning}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => setSelectedAlternative(alternative.id)}
                  >
                    <Text style={styles.selectButtonText}>
                      {selectedAlternative === alternative.id ? 'Selected' : 'Select Route'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
          
          {alternatives.length > 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, !selectedAlternative && styles.disabledButton]} 
                disabled={!selectedAlternative}
              >
                <Text style={styles.confirmButtonText}>Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: Colors.surface,
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  alternativeContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  selectedAlternative: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    marginRight: 16,
  },
  detailItemLast: {
    marginRight: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  positiveValue: {
    color: Colors.error,
  },
  negativeValue: {
    color: Colors.success,
  },
  reasoningText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    flex: 1,
  },
  selectButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary,
  },
  confirmButtonText: {
    color: Colors.surface,
    fontWeight: '600',
  },
});

export default RouteCompareModal;