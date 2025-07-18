import axios from 'axios';

const API_BASE_URL = 'https://backendaipopup-production.up.railway.app';

// Create axios instance with default config (similar to authService)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add authorization header if session exists
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('session_id');
  if (sessionId) {
    config.headers.Authorization = sessionId;
  }
  return config;
});

// Handle session expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data and redirect to login
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface TrackedUrl {
  id: string;
  url: string;
  title?: string;
  domain?: string;
  status: 'not_applied' | 'applied' | 'in_progress';
  applied_at?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  is_active: boolean;
}

export interface SaveUrlRequest {
  url: string;
  title?: string;
  notes?: string;
}

export interface UpdateUrlStatusRequest {
  status: 'not_applied' | 'applied' | 'in_progress';
  notes?: string;
}

export interface TrackedUrlsResponse {
  urls: TrackedUrl[];
  total: number;
}

export interface UrlStatsResponse {
  status: string;
  stats: {
    total_urls: number;
    not_applied: number;
    applied: number;
    in_progress: number;
    recent_activity: number;
    application_rate: number;
  };
}

export interface SaveUrlResponse {
  status: string;
  message: string;
  url?: TrackedUrl;
}

export interface UpdateUrlResponse {
  status: string;
  message: string;
  url?: TrackedUrl;
}

export const urlTrackingService = {
  // Save URL from browser extension or manual input
  async saveUrl(data: SaveUrlRequest): Promise<SaveUrlResponse> {
    try {
      const response = await api.post<SaveUrlResponse>('/api/urls/save', data);
      return response.data;
    } catch (error: any) {
      console.error('Save URL error:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Failed to save URL');
    }
  },

  // Get all tracked URLs for the current user
  async getTrackedUrls(statusFilter?: string): Promise<TrackedUrlsResponse> {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get<TrackedUrlsResponse>('/api/urls/list', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get tracked URLs error:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Failed to get tracked URLs');
    }
  },

  // Get a specific URL by ID
  async getUrlById(urlId: string): Promise<TrackedUrl> {
    try {
      const response = await api.get<TrackedUrl>(`/api/urls/${urlId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get URL by ID error:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Failed to get URL');
    }
  },

  // Update URL application status
  async updateUrlStatus(urlId: string, data: UpdateUrlStatusRequest): Promise<UpdateUrlResponse> {
    try {
      const response = await api.put<UpdateUrlResponse>(`/api/urls/${urlId}/status`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update URL status error:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Failed to update URL status');
    }
  },

  // Delete a tracked URL
  async deleteUrl(urlId: string): Promise<{ status: string; message: string }> {
    try {
      const response = await api.delete(`/api/urls/${urlId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete URL error:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Failed to delete URL');
    }
  },

  // Get URL tracking statistics
  async getUrlStats(): Promise<UrlStatsResponse> {
    try {
      const response = await api.get<UrlStatsResponse>('/api/urls/stats/summary');
      return response.data;
    } catch (error: any) {
      console.error('Get URL stats error:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Failed to get URL statistics');
    }
  },

  // Helper function to get current page URL and title (for browser extension)
  getCurrentPageInfo(): { url: string; title: string } {
    if (typeof window !== 'undefined') {
      return {
        url: window.location.href,
        title: document.title
      };
    }
    return { url: '', title: '' };
  },

  // Helper function to extract domain from URL
  extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch (error) {
      console.warn('Failed to extract domain from URL:', url);
      return '';
    }
  },

  // Helper function to format date
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  },

  // Helper function to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'applied':
        return '#10b981'; // green
      case 'in_progress':
        return '#f59e0b'; // yellow
      case 'not_applied':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  },

  // Helper function to get status display text
  getStatusText(status: string): string {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'in_progress':
        return 'In Progress';
      case 'not_applied':
        return 'Not Applied';
      default:
        return status;
    }
  }
}; 