import Constants from 'expo-constants';
import { Platform } from 'react-native';

const resolveBackendApiUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_BACKEND_API_URL;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }

  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost ||
    '';
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : '';

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:8000`;
  }

  if (Platform.OS === 'android') {
    // Android emulator cannot reach host localhost directly.
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
};

const buildApiCandidates = (): string[] => {
  const configured = process.env.EXPO_PUBLIC_BACKEND_API_URL?.trim();
  const candidates: string[] = [];
  const add = (url?: string) => {
    if (!url) return;
    const normalized = url.replace(/\/+$/, '');
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  add(configured);

  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost ||
    '';
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : '';
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    add(`http://${host}:8000`);
  }

  if (Platform.OS === 'android') {
    add('http://10.0.2.2:8000');
    add('http://127.0.0.1:8000');
    add('http://localhost:8000');
  } else {
    add('http://localhost:8000');
    add('http://127.0.0.1:8000');
  }

  return candidates;
};

const BACKEND_API_URL = resolveBackendApiUrl();

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiService {
  private baseUrl: string;
  private readonly baseCandidates: string[];

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = baseUrl;
    this.baseCandidates = buildApiCandidates();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    let lastError: any;
    const candidates = [this.baseUrl, ...this.baseCandidates.filter(c => c !== this.baseUrl)];

    for (const base of candidates) {
      try {
        const url = `${base}${endpoint}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        const rawText = await response.text();
        const parsed = rawText ? JSON.parse(rawText) : null;

        if (!response.ok) {
          const detail = parsed?.detail || parsed?.message || `HTTP error! status: ${response.status}`;
          throw new Error(detail);
        }

        // Persist the working host so subsequent calls don't retry.
        this.baseUrl = base;
        return { data: parsed, success: true };
      } catch (error: any) {
        lastError = error;
      }
    }

    console.error(`API request failed: ${endpoint}`, lastError, { baseCandidates: candidates });
    return { error: lastError?.message || 'Network error', success: false };
  }

  // Shipments API
  async getShipments(): Promise<ApiResponse<any[]>> {
    return this.request('/shipments');
  }

  async getShipmentById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/shipments/${id}`);
  }

  async updateShipment(data: any): Promise<ApiResponse<any>> {
    return this.request('/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Emissions API
  async getEmissions(): Promise<ApiResponse<any[]>> {
    return this.request('/emissions');
  }

  async getEmissionsByShipmentId(shipmentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/emissions/${shipmentId}`);
  }

  // Alerts API
  async getAlerts(): Promise<ApiResponse<any[]>> {
    return this.request('/alerts');
  }

  async markAlertAsRead(alertId: string): Promise<ApiResponse<any>> {
    return this.request(`/alerts/${alertId}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true }),
    });
  }

  // Analytics API
  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.request('/analytics/fleet-overview');
  }

  // Green Score API
  async getGreenScore(): Promise<ApiResponse<any>> {
    return this.request('/green-score/fleet');
  }

  // AI Insights API
  async getAIInsights(query: string): Promise<ApiResponse<any>> {
    return this.request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question: query }),
    });
  }

  // Reports API
  async getReports(): Promise<ApiResponse<any>> {
    return this.request('/reports/fleet-summary');
  }

  // Route Alternatives API
  async getRouteAlternatives(shipmentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/shipments/${shipmentId}/route-alternatives`);
  }
}

export const apiService = new ApiService();
