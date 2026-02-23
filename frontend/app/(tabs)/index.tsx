import React from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useShipments } from '../../hooks/useShipments';
import ShipmentCard from '../../components/ShipmentCard';
import GradientHeader from '../../components/GradientHeader';
import AlertBanner from '../../components/AlertBanner';
import { useAlerts } from '../../hooks/useAlerts';

export default function DashboardScreen() {
  const { shipments, loading, refetch } = useShipments();
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();

  const unreadAlerts = alerts.filter(alert => !alert.is_read);
  const visibleAlerts = unreadAlerts.slice(0, 3);

  const renderShipment = ({ item }: { item: any }) => (
    <ShipmentCard shipment={item} onPress={() => router.push(`/shipment/${item.shipment_id}`)} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={shipments}
        renderItem={renderShipment}
        keyExtractor={item => item.id}
        onRefresh={refetch}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <GradientHeader
              title="GreenChain Dashboard"
              subtitle="Real-time supply chain tracking"
              icon="local-shipping"
            />

            <View style={styles.notificationsCard}>
              <View style={styles.notificationsHeader}>
                <View style={styles.notificationsTitleWrap}>
                  <MaterialIcons name="notifications-active" size={18} color="#b45309" />
                  <Text style={styles.notificationsTitle}>Notifications</Text>
                  <View style={styles.notificationsBadge}>
                    <Text style={styles.notificationsBadgeText}>{unreadCount}</Text>
                  </View>
                </View>

                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
              </View>

              {visibleAlerts.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <MaterialIcons name="task-alt" size={18} color="#16a34a" />
                  <Text style={styles.emptyNotificationsText}>No active alerts</Text>
                </View>
              ) : (
                visibleAlerts.map(alert => (
                  <AlertBanner
                    key={alert.id}
                    alert={alert}
                    onDismiss={markAsRead}
                    onPress={() => {
                      markAsRead(alert.id);
                      router.push(`/shipment/${alert.shipment_id}`);
                    }}
                    style={styles.alertItem}
                  />
                ))
              )}
            </View>

            <View style={styles.shipmentsHeader}>
              <Text style={styles.shipmentsTitle}>Shipments</Text>
              <Text style={styles.shipmentsCount}>{shipments.length} active</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyShipments}>
              <Text style={styles.emptyShipmentsText}>No shipments available</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    paddingBottom: 24,
  },
  notificationsCard: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationsTitle: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  notificationsBadge: {
    marginLeft: 8,
    backgroundColor: '#f97316',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyNotifications: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyNotificationsText: {
    marginLeft: 6,
    color: '#166534',
    fontSize: 13,
    fontWeight: '500',
  },
  alertItem: {
    marginHorizontal: 0,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  shipmentsHeader: {
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shipmentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  shipmentsCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyShipments: {
    marginTop: 24,
    alignItems: 'center',
  },
  emptyShipmentsText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
