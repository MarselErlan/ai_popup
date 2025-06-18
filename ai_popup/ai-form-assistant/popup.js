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



  async signup(email, password) {
    try {
      console.log('📝 Registering user:', email);
      
      const response = await fetch(`${this.API_BASE_URL}/api/simple/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      console.log('✅ User registered:', data);
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      console.log('📡 Step 1: Authenticating user...');
      
      // Step 1: Authenticate user
      const loginResponse = await fetch(`${this.API_BASE_URL}/api/simple/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Login response status:', loginResponse.status);

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('❌ Login API error:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || `Login failed (${loginResponse.status})`);
        } catch (parseError) {
          throw new Error(`Login failed (${loginResponse.status}): ${errorText}`);
        }
      }

      const loginData = await loginResponse.json();
      console.log('✅ Login response data:', loginData);
      
      if (!loginData.user_id || !loginData.email) {
        throw new Error('Invalid login response format - missing user_id or email');
      }

      console.log('📡 Step 2: Creating/updating session...');
      
      // Step 2: Get/Create session for the user
      const sessionResponse = await fetch(`${this.API_BASE_URL}/api/session/check-and-update/${loginData.user_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Session response status:', sessionResponse.status);

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('❌ Session API error:', errorText);
        throw new Error(`Failed to create session (${sessionResponse.status}): ${errorText}`);
      }

      const sessionData = await sessionResponse.json();
      console.log('✅ Session response data:', sessionData);
      
      // Store session and user info
      const storageData = {
        sessionId: sessionData.session_id,
        userId: loginData.user_id,
        email: loginData.email
      };
      
      console.log('💾 Step 3: Storing to extension storage:', storageData);
      
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(storageData, () => {
          if (chrome.runtime.lastError) {
            console.error('❌ Storage error:', chrome.runtime.lastError);
            reject(new Error('Failed to store session data'));
            return;
          }
          
          console.log('✅ Session and user data stored successfully');
          
          // Verify storage
          chrome.storage.local.get(['sessionId', 'userId', 'email'], (result) => {
            console.log('🔍 Verification - stored data:', result);
            resolve({ ...loginData, session_id: sessionData.session_id });
          });
        });
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const sessionId = await this.getStoredSessionId();
      
      if (sessionId) {
        console.log('🚪 Logging out session:', sessionId);
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
      await this.clearStoredData();
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear data anyway
      await this.clearStoredData();
    }
  }

  async clearStoredData() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['sessionId', 'userId', 'email'], () => {
        console.log('🗑️ Session data cleared');
        resolve();
      });
    });
  }

  async initializeUI() {
    // Check if user is already logged in
    try {
      const sessionId = await this.getStoredSessionId();
      
      if (sessionId) {
        console.log('🔍 Found existing session:', sessionId);
        this.showDashboard();
      } else {
        console.log('🔍 No existing session found');
        this.showLogin();
      }
    } catch (error) {
      console.error('Error initializing UI:', error);
      this.showLogin();
    }

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

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        await this.handleSignup(email, password, confirmPassword);
      });
    }
  }

  async handleLogin(email, password) {
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    
    try {
      console.log('🔐 Starting login process for:', email);
      loginBtn.innerHTML = '<div class="loading"></div> Logging in...';
      loginBtn.disabled = true;

      const data = await this.login(email, password);
      console.log('✅ Login successful:', data);
      
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
      console.error('❌ Login failed:', error);
      this.showError(`Login failed: ${error.message}`);
    } finally {
      loginBtn.textContent = originalText;
      loginBtn.disabled = false;
    }
  }

  async handleSignup(email, password, confirmPassword) {
    const signupBtn = document.getElementById('signupBtn');
    const originalText = signupBtn.textContent;
    
    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        this.showError('Passwords do not match', 'signupErrorMessage');
        return;
      }

      if (password.length < 6) {
        this.showError('Password must be at least 6 characters long', 'signupErrorMessage');
        return;
      }

      signupBtn.innerHTML = '<div class="loading"></div> Creating account...';
      signupBtn.disabled = true;

      const data = await this.signup(email, password);
      console.log('Signup successful:', data);
      
      // Automatically login after successful signup
      await this.handleLogin(email, password);
      
    } catch (error) {
      console.error('Signup failed:', error);
      this.showError('Account creation failed. Please try again.', 'signupErrorMessage');
    } finally {
      signupBtn.textContent = originalText;
      signupBtn.disabled = false;
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

  showError(message, elementId = 'errorMessage') {
    const errorDiv = document.getElementById(elementId);
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
