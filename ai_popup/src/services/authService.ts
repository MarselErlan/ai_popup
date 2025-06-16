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
  async getDocumentsStatus(userId: string): Promise<any> {
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