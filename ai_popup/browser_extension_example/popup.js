/**
 * 🎯 AI Form Assistant - Popup Script
 * Handles authentication and user management
 */

class PopupManager {
  constructor() {
    this.API_BASE_URL = 'http://localhost:8000';
    this.initializeUI();
  }

  async checkDocumentStatus() {
    try {
      const sessionId = await this.getStoredSessionId();
      
      if (!sessionId) return;

      const response = await fetch(`${this.API_BASE_URL}/api/v1/documents/status`, {
        headers: { 'Authorization': `Session ${sessionId}` }
      });

      if (response.ok) {
        const status = await response.json();
        
        // Update resume status
        const resumeStatus = document.getElementById('resumeStatus');
        if (status.data.resume && status.data.resume.filename) {
          resumeStatus.textContent = 'Ready';
          resumeStatus.className = 'status-value status-ready';
        } else {
          resumeStatus.textContent = 'Missing';
          resumeStatus.className = 'status-value status-missing';
        }
        
        // Update personal info status
        const personalInfoStatus = document.getElementById('personalInfoStatus');
        if (status.data.personal_info && status.data.personal_info.filename) {
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

  async getStoredSessionId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['sessionId'], (result) => {
        resolve(result.sessionId);
      });
    });
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/simple/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store session ID
      chrome.storage.local.set({
        sessionId: data.session_id,
        userId: data.user_id,
        email: data.email
      }, () => {
        console.log('Session stored');
      });

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const sessionId = await this.getStoredSessionId();
      
      if (sessionId) {
        await fetch(`${this.API_BASE_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Session ${sessionId}`
          },
          body: JSON.stringify({ session_id: sessionId })
        });
      }

      // Clear stored data
      chrome.storage.local.remove(['sessionId', 'userId', 'email'], () => {
        console.log('Session cleared');
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  initializeUI() {
    // Check if user is already logged in
    this.getStoredSessionId().then(sessionId => {
      if (sessionId) {
        this.showDashboard();
      } else {
        this.showLogin();
      }
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await this.handleLogin(email, password);
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.handleLogout();
      });
    }

    // Switch to signup
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
      signupLink.addEventListener('click', () => {
        this.showSignup();
      });
    }

    // Switch to login
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
      loginLink.addEventListener('click', () => {
        this.showLogin();
      });
    }
  }

  async handleLogin(email, password) {
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    
    try {
      loginBtn.innerHTML = '<div class="loading"></div> Logging in...';
      loginBtn.disabled = true;

      const data = await this.login(email, password);
      console.log('Login successful:', data);
      
      // Notify content scripts about authentication
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'authenticationUpdated'
          }).catch(() => {
            // Ignore errors for tabs that don't have content script
          });
        });
      });

      this.showDashboard();
    } catch (error) {
      console.error('Login failed:', error);
      this.showError('Login failed. Please check your credentials.');
    } finally {
      loginBtn.textContent = originalText;
      loginBtn.disabled = false;
    }
  }

  async handleLogout() {
    try {
      await this.logout();
      this.showLogin();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  showLogin() {
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const signupView = document.getElementById('signupView');
    
    if (loginView) loginView.classList.remove('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
    if (signupView) signupView.classList.add('hidden');
  }

  showSignup() {
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const signupView = document.getElementById('signupView');
    
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
    if (signupView) signupView.classList.remove('hidden');
  }

  showDashboard() {
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const signupView = document.getElementById('signupView');
    
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');
    if (signupView) signupView.classList.add('hidden');

    // Load user info and document status
    this.loadUserInfo();
    this.checkDocumentStatus();
  }

  async loadUserInfo() {
    try {
      const result = await chrome.storage.local.get(['email', 'userId']);
      const userEmail = document.getElementById('userEmail');
      const userId = document.getElementById('userId');
      
      if (userEmail && result.email) {
        userEmail.textContent = result.email;
      }
      if (userId && result.userId) {
        userId.textContent = `ID: ${result.userId}`;
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

console.log('🎯 AI Form Assistant popup script loaded');
