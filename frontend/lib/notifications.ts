import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface AlertNotificationPayload {
  id: string;
  shipment_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

const SEVERITY_EMOJI: Record<string, string> = {
  critical: '🚨',
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

const SEVERITY_TITLE: Record<string, string> = {
  critical: 'Critical Alert',
  high: 'High Severity Alert',
  medium: 'Warning',
  low: 'Info',
};

const ALERT_TYPE_LABEL: Record<string, string> = {
  emission_spike: 'Emission Spike',
  harsh_braking: 'Harsh Braking',
  idle_alert: 'Idle Alert',
  delay_risk: 'Delay Risk',
  route_suggestion: 'Route Suggestion',
};

class NotificationService {
  private _channelCreated = false;

  /**
   * Ensure the Android notification channel exists once.
   */
  private async _ensureAndroidChannel(): Promise<void> {
    if (this._channelCreated || Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('greenchain-alerts', {
      name: 'GreenChain Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      sound: 'default',
    });
    this._channelCreated = true;
  }

  /**
   * Request permission to send notifications.
   * Returns true if granted.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      await this._ensureAndroidChannel();
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('[Notifications] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Fire an immediate local notification for an alert.
   * Works in both Expo Go and dev builds.
   */
  async sendAlertNotification(alert: AlertNotificationPayload): Promise<string> {
    try {
      await this._ensureAndroidChannel();

      const emoji = SEVERITY_EMOJI[alert.severity] ?? '⚠️';
      const severityLabel = SEVERITY_TITLE[alert.severity] ?? 'Alert';
      const typeLabel = ALERT_TYPE_LABEL[alert.alert_type] ?? alert.alert_type.replace(/_/g, ' ');

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} ${severityLabel} — ${alert.shipment_id}`,
          body: `[${typeLabel}] ${alert.message}`,
          data: { type: 'alert', alert_id: alert.id, shipment_id: alert.shipment_id },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'greenchain-alerts' }),
        },
        trigger: null, // fire immediately
      });

      return identifier;
    } catch (error) {
      console.warn('[Notifications] sendAlertNotification failed:', error);
      return '';
    }
  }

  /**
   * Send an immediate notification with custom title/body.
   */
  async sendImmediateNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<string> {
    try {
      await this._ensureAndroidChannel();

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data ?? {},
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'greenchain-alerts' }),
        },
        trigger: null,
      });

      return identifier;
    } catch (error) {
      console.warn('[Notifications] sendImmediateNotification failed:', error);
      return '';
    }
  }

  /**
   * Cancel a scheduled notification by its identifier.
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {}
  }

  /**
   * Cancel all scheduled notifications.
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  }

  /**
   * Listen for notifications received while app is in foreground.
   */
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Listen for user tapping a notification.
   */
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void,
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();
