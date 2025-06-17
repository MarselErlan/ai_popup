/**
 * 🎯 AI Form Assistant - Popup Script
 * Handles authentication and user management
 */

const API_BASE_URL = 'http://localhost:8000';

class PopupManager {
  constructor() {
    this.init();
  }

  async init() {
    console.log('🎯 Popup Manager initialized');
    
    // Check if user is already logged in
    const token = await this.getStoredToken();
    if (token) {
      await this.showDashboard();
    } else {
      this.showLoginForm();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
    document.getElementById('switchToSignupBtn').addEventListener('click', () => this.showSignupForm());
    
    // Signup form
    document.getElementById('signupBtn').addEventListener('click', () => this.handleSignup());
    document.getElementById('switchToLoginBtn').addEventListener('click', () => this.showLoginForm());
    
    // Dashboard
    document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

    // Enter key handling
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (!loginForm.classList.contains('hidden')) {
          this.handleLogin();
        } else if (!signupForm.classList.contains('hidden')) {
          this.handleSignup();
        }
      }
    });
  }

  showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('email').focus();
  }

  showSignupForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('signupEmail').focus();
  }

  async showDashboard() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Load user info and status
    await this.loadUserInfo();
    await this.checkDocumentStatus();
  }

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      this.showError('Please fill in all fields', 'errorMessage');
      return;
    }

    this.setLoading('login', true);
    this.hideError('errorMessage');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store authentication data
      await this.storeAuthData(data.access_token, data.user);
      
      // Notify content script about authentication
      this.notifyContentScript();
      
      this.showSuccess('Login successful!');
      await this.showDashboard();

    } catch (error) {
      console.error('Login error:', error);
      this.showError(error.message, 'errorMessage');
    } finally {
      this.setLoading('login', false);
    }
  }

  async handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!email || !password || !confirmPassword) {
      this.showError('Please fill in all fields', 'signupErrorMessage');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Passwords do not match', 'signupErrorMessage');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters', 'signupErrorMessage');
      return;
    }

    this.setLoading('signup', true);
    this.hideError('signupErrorMessage');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      // Store authentication data
      await this.storeAuthData(data.access_token, data.user);
      
      // Notify content script about authentication
      this.notifyContentScript();
      
      this.showSuccess('Account created successfully!');
      await this.showDashboard();

    } catch (error) {
      console.error('Signup error:', error);
      this.showError(error.message, 'signupErrorMessage');
    } finally {
      this.setLoading('signup', false);
    }
  }

  async handleLogout() {
    await chrome.storage.local.clear();
    this.showLoginForm();
    this.showSuccess('Logged out successfully');
  }

  async loadUserInfo() {
    try {
      const token = await this.getStoredToken();
      const userData = await this.getStoredUser();
      
      if (userData) {
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userId').textContent = `ID: ${userData.id}`;
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  async checkDocumentStatus() {
    try {
      const token = await this.getStoredToken();
      const userData = await this.getStoredUser();
      
      if (!token || !userData) return;

      const response = await fetch(`${API_BASE_URL}/api/v1/documents/status?user_id=${userData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const status = await response.json();
        
        // Update resume status
        const resumeStatus = document.getElementById('resumeStatus');
        if (status.resume_uploaded) {
          resumeStatus.textContent = 'Ready';
          resumeStatus.className = 'status-value status-ready';
        } else {
          resumeStatus.textContent = 'Missing';
          resumeStatus.className = 'status-value status-missing';
        }
        
        // Update personal info status
        const personalInfoStatus = document.getElementById('personalInfoStatus');
        if (status.personal_info_uploaded) {
          personalInfoStatus.textContent = 'Ready';
          personalInfoStatus.className = 'status-value status-ready';
        } else {
          personalInfoStatus.textContent = 'Missing';
          personalInfoStatus.className = 'status-value status-missing';
        }
      } else {
        // Set default status if API call fails
        document.getElementById('resumeStatus').textContent = 'Unknown';
        document.getElementById('personalInfoStatus').textContent = 'Unknown';
      }
    } catch (error) {
      console.error('Error checking document status:', error);
      document.getElementById('resumeStatus').textContent = 'Error';
      document.getElementById('personalInfoStatus').textContent = 'Error';
    }
  }

  async storeAuthData(token, user) {
    await chrome.storage.local.set({
      token: token,
      user: user
    });
  }

  async getStoredToken() {
    const result = await chrome.storage.local.get('token');
    return result.token;
  }

  async getStoredUser() {
    const result = await chrome.storage.local.get('user');
    return result.user;
  }

  notifyContentScript() {
    // Notify all tabs about authentication update
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'authenticationUpdated' }, () => {
          // Ignore errors for tabs that don't have content script
          if (chrome.runtime.lastError) {
            // Silent fail
          }
        });
      });
    });
  }

  setLoading(type, isLoading) {
    const textElement = document.getElementById(`${type}Text`);
    const loadingElement = document.getElementById(`${type}Loading`);
    const buttonElement = document.getElementById(`${type}Btn`);
    
    if (isLoading) {
      textElement.classList.add('hidden');
      loadingElement.classList.remove('hidden');
      buttonElement.disabled = true;
    } else {
      textElement.classList.remove('hidden');
      loadingElement.classList.add('hidden');
      buttonElement.disabled = false;
    }
  }

  showError(message, elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }

  hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.classList.add('hidden');
  }

  showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
      successElement.textContent = message;
      successElement.classList.remove('hidden');
      
      // Hide after 3 seconds
      setTimeout(() => {
        successElement.classList.add('hidden');
      }, 3000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

console.log('🎯 AI Form Assistant popup script loaded');