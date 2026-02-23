import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../lib/api';
import { notificationService } from '../lib/notifications';

interface Alert {
  id: string;
  shipment_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which alert IDs have already triggered a notification this session
  const notifiedIds = useRef<Set<string>>(new Set());
  // Flag: skip notification firing on the very first fetch (don't spam on app open)
  const isFirstFetch = useRef(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getAlerts();
      if (response.success && response.data) {
        const incoming: Alert[] = response.data;

        // On subsequent fetches, fire a notification for any NEW unread high/medium alerts
        if (!isFirstFetch.current) {
          const newActionable = incoming.filter(
            (a) =>
              !a.is_read &&
              (a.severity === 'high' || a.severity === 'critical' || a.severity === 'medium') &&
              !notifiedIds.current.has(a.id),
          );

          for (const alert of newActionable) {
            notifiedIds.current.add(alert.id);
            notificationService.sendAlertNotification(alert).catch(() => {});
          }
        } else {
          // Seed the notified set with all current alerts so we don't re-fire them on startup
          incoming.forEach((a) => notifiedIds.current.add(a.id));
          isFirstFetch.current = false;
        }

        setAlerts(incoming);
        setUnreadCount(incoming.filter((a) => !a.is_read).length);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (alertId: string) => {
    try {
      const response = await apiService.markAlertAsRead(alertId);
      if (response.success) {
        setAlerts((prev) =>
          prev.map((alert) => (alert.id === alertId ? { ...alert, is_read: true } : alert)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(`Error marking alert ${alertId} as read:`, err);
    }
  };

  const markAllAsRead = async () => {
    const unreadAlerts = alerts.filter((alert) => !alert.is_read);
    for (const alert of unreadAlerts) {
      await markAsRead(alert.id);
    }
  };

  useEffect(() => {
    // Request notification permissions on mount (no-op if already granted)
    notificationService.requestPermissions().catch(() => {});

    fetchAlerts();

    // Listen for notifications arriving while app is in foreground
    const subscription = notificationService.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.type === 'alert') {
        fetchAlerts();
      }
    });

    // Poll every 15 seconds
    const interval = setInterval(fetchAlerts, 15_000);

    return () => {
      subscription?.remove();
      clearInterval(interval);
    };
  }, [fetchAlerts]);

  return {
    alerts,
    unreadCount,
    loading,
    error,
    refetch: fetchAlerts,
    markAsRead,
    markAllAsRead,
  };
};
