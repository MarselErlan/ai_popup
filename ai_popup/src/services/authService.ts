import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name?: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
  is_active?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DocumentStatus {
  resume_uploaded: boolean;
  personal_info_uploaded: boolean;
  resume_status?: string;
  personal_info_status?: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  // Signup user
  async signup(credentials: SignupCredentials): Promise<LoginResponse> {
    try {
      // Backend expects 'email' and 'password' only for register endpoint
      const registerData = {
        email: credentials.email,
        password: credentials.password
      };
      const response = await api.post('/api/auth/register', registerData);
      return response.data;
    } catch (error: any) {
      console.error('Signup error:', error.response?.data || error.message);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Signup failed');
    }
  },

  // Upload resume file
  async uploadResume(file: File, userId: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const response = await api.post('/api/v1/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Resume upload error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Resume upload failed');
    }
  },

  // Upload personal info file
  async uploadPersonalInfo(file: File, userId: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const response = await api.post('/api/v1/personal-info/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Personal info upload error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Personal info upload failed');
    }
  },

  // Delete resume
  async deleteResume(userId: string): Promise<any> {
    try {
      const response = await api.delete(`/api/v1/resume/delete?user_id=${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Resume delete error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Resume delete failed');
    }
  },

  // Delete personal info
  async deletePersonalInfo(userId: string): Promise<any> {
    try {
      const response = await api.delete(`/api/v1/personal-info/delete?user_id=${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Personal info delete error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Personal info delete failed');
    }
  },

  // Download resume
  async downloadResume(userId: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/v1/resume/download?user_id=${userId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Resume download error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Resume download failed');
    }
  },

  // Download personal info
  async downloadPersonalInfo(userId: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/v1/personal-info/download?user_id=${userId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Personal info download error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Personal info download failed');
    }
  },

  // Reembed resume from database
  async reembedResume(userId: string): Promise<any> {
    try {
      const response = await api.post(`/api/v1/resume/reembed?user_id=${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Resume reembed error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Resume reembed failed');
    }
  },

  // Reembed personal info from database
  async reembedPersonalInfo(userId: string): Promise<any> {
    try {
      const response = await api.post(`/api/v1/personal-info/reembed?user_id=${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Personal info reembed error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Personal info reembed failed');
    }
  },

  // Get documents status
  async getDocumentsStatus(userId: string): Promise<DocumentStatus> {
    try {
      const response = await api.get(`/api/v1/documents/status?user_id=${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Documents status error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get documents status');
    }
  },

  // Get current user info
  async getCurrentUserInfo(): Promise<User> {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Get user info error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get user info');
    }
  },

  // Validate session
  async validateSession(): Promise<boolean> {
    try {
      const response = await api.get('/api/auth/validate');
      return response.data.valid || false;
    } catch (error: any) {
      console.error('Session validation error:', error.response?.data || error.message);
      return false;
    }
  },

  // Generate field answer (main API endpoint)
  async generateFieldAnswer(label: string, url: string, userId: string): Promise<any> {
    try {
      const response = await api.post('/api/generate-field-answer', {
        label,
        url,
        user_id: userId
      });
      return response.data;
    } catch (error: any) {
      console.error('Generate field answer error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to generate field answer');
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default api; 