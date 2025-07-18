import axios from 'axios';

const API_BASE_URL = 'https://backendaipopup-production.up.railway.app';

// Create axios instance with default config
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

// Handle session expiration and cleanup
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data
      authService.clearAuthData();
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
  status: string;
  user_id: string;
  email: string;
  message: string;
}

export interface SessionResponse {
  status: string;
  session_id: string;
  user_id: string;
  message: string;
}

export interface SessionInfo {
  status: string;
  user_id: string;
  email: string;
  session_id: string;
  device_info?: string;
  created_at: string;
  last_used_at: string;
}

export interface LogoutResponse {
  status: string;
  message: string;
}

export interface DocumentStatus {
  resume_uploaded: boolean;
  personal_info_uploaded: boolean;
  resume_status?: string;
  personal_info_status?: string;
}

export interface UpdateSessionResponse {
  status: string;
  session_id: string;
  user_id: string;
  message: string;
}

export const authService = {
  // Helper methods for auth data management
  clearAuthData() {
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    
    // Also clear from extension storage if available
    if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
      try {
        (window as any).chrome.storage.local.remove([
          'session_id',
          'user_id',
          'user_email'
        ]);
      } catch (e) {
        console.log('Chrome storage not available:', e);
      }
    }
  },

  async setAuthData(data: { userId: string; email: string; sessionId: string }) {
    // Store in localStorage
    localStorage.setItem('session_id', data.sessionId);
    localStorage.setItem('user_id', data.userId);
    localStorage.setItem('user_email', data.email);
    
    // Also store in extension storage if available
    if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
      try {
        await (window as any).chrome.storage.local.set({
          session_id: data.sessionId,
          user_id: data.userId,
          user_email: data.email
        });
      } catch (e) {
        console.log('Chrome storage not available:', e);
      }
    }
  },

  // Login user - now with separate session management
  async login(credentials: LoginCredentials): Promise<{ userId: string; email: string; sessionId: string }> {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });
      
      // First authenticate the user
      const loginResponse = await api.post<LoginResponse>('/api/simple/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      console.log('Login response:', loginResponse.data);
      const { user_id, email } = loginResponse.data;

      if (!user_id || !email) {
        throw new Error('Invalid login response format');
      }

      // Check and update session - this will ensure only one active session
      const sessionResponse = await api.post<UpdateSessionResponse>(
        `/api/session/check-and-update/${user_id}`
      );

      console.log('Session response:', sessionResponse.data);
      const { session_id } = sessionResponse.data;

      // Store the auth data
      await this.setAuthData({
        userId: user_id,
        email,
        sessionId: session_id
      });

      return {
        userId: user_id,
        email,
        sessionId: session_id
      };
    } catch (error: any) {
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      
      throw new Error(error.message || 'Login failed');
    }
  },

  // Signup user with better error handling
  async signup(credentials: SignupCredentials): Promise<LoginResponse> {
    try {
      console.log('Attempting signup with:', { email: credentials.email });
      
      // Clear any existing auth data before signup
      this.clearAuthData();
      
      // Backend expects 'email' and 'password' only for register endpoint
      const registerData = {
        email: credentials.email,
        password: credentials.password
      };
      
      try {
        const response = await api.post('/api/simple/register', registerData);
        console.log('Signup response:', response.data);
        
        const { status, user_id, email, message } = response.data;
        
        if (!user_id || !email) {
          throw new Error('Invalid registration response format');
        }

        return {
          status,
          user_id,
          email,
          message
        };
      } catch (error: any) {
        // Handle specific error cases
        if (error.response?.status === 409) {
          throw new Error('This email is already registered. Please login instead.');
        }
        
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error('Signup error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(error.message || 'Signup failed. Please try again.');
    }
  },

  // Upload resume file
  async uploadResume(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

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
  async uploadPersonalInfo(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

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
  async deleteResume(): Promise<any> {
    try {
      const response = await api.delete('/api/v1/resume');
      return response.data;
    } catch (error: any) {
      console.error('Resume delete error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Resume delete failed');
    }
  },

  // Delete personal info
  async deletePersonalInfo(): Promise<any> {
    try {
      const response = await api.delete('/api/v1/personal-info');
      return response.data;
    } catch (error: any) {
      console.error('Personal info delete error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Personal info delete failed');
    }
  },

  // Download resume
  async downloadResume(): Promise<Blob> {
    try {
      const response = await api.get('/api/v1/resume/download', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Resume download error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Resume download failed');
    }
  },

  // Download personal info
  async downloadPersonalInfo(): Promise<Blob> {
    try {
      const response = await api.get('/api/v1/personal-info/download', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Personal info download error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Personal info download failed');
    }
  },

  // Reembed resume from database
  async reembedResume(): Promise<any> {
    try {
      const response = await api.post('/api/v1/resume/reembed');
      return response.data;
    } catch (error: any) {
      console.error('Resume reembed error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Resume reembed failed');
    }
  },

  // Reembed personal info from database
  async reembedPersonalInfo(): Promise<any> {
    try {
      const response = await api.post('/api/v1/personal-info/reembed');
      return response.data;
    } catch (error: any) {
      console.error('Personal info reembed error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Personal info reembed failed');
    }
  },

  // Get documents status
  async getDocumentsStatus(): Promise<DocumentStatus> {
    try {
      const response = await api.get('/api/v1/documents/status');
      
      // The backend returns documents directly in response.data.documents
      const documentStatus = response.data.documents || response.data;
      
      // Transform the API response to match our expected format
      const transformedStatus: DocumentStatus = {
        resume_uploaded: !!(documentStatus.resume && documentStatus.resume.filename),
        personal_info_uploaded: !!(documentStatus.personal_info && documentStatus.personal_info.filename),
        resume_status: documentStatus.resume?.processing_status || 'unknown',
        personal_info_status: documentStatus.personal_info?.processing_status || 'unknown'
      };
      
      return transformedStatus;
    } catch (error: any) {
      console.error('Documents status error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get documents status');
    }
  },

  // Get current user info
  getCurrentUser(): { id: string; email?: string } | null {
    const userId = localStorage.getItem('user_id');
    const email = localStorage.getItem('user_email');
    
    if (!userId) return null;
    
    return {
      id: userId,
      email: email || undefined
    };
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

  // Validate user exists in database
  async validateUser(userId: string): Promise<any> {
    try {
      const response = await api.get(`/api/validate-user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('User validation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to validate user');
    }
  },



  // Logout - now properly cleans up sessions
  async logout(): Promise<void> {
    try {
      const sessionId = localStorage.getItem('session_id');
      if (sessionId) {
        // Attempt to invalidate session on backend
        await api.delete(`/api/session/${sessionId}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local auth data
      this.clearAuthData();
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(localStorage.getItem('session_id') && localStorage.getItem('user_id'));
  },

  // Get current user info
  getCurrentUserInfo(): Promise<User> {
    return this.getCurrentUserInfo();
  }
};

export default api; 
