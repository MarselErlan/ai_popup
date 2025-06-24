/**
 * 🎯 Unified AI Form Assistant Popup
 * Combines extension popup and floating popup functionality
 * 
 * Works both as:
 * - Browser extension popup (when clicked from extension icon)
 * - Floating popup (when injected into web pages)
 */

class UnifiedPopupManager {
  constructor() {
    this.API_BASE_URL = 'http://localhost:8000';
    this.isFloatingMode = this.detectFloatingMode();
    this.initializeUI();
  }

  detectFloatingMode() {
    // Check if we're running as a floating popup vs extension popup
    return window.location.href.includes('http') && !chrome?.extension;
  }

  async checkDocumentStatus() {
    try {
      const sessionId = await this.getStoredSessionId();
      
      if (!sessionId) {
        console.log('⚠️ No session ID found, skipping document status check');
        return;
      }

      console.log('📄 Checking document status with session:', sessionId);

      const response = await fetch(`${this.API_BASE_URL}/api/v1/documents/status`, {
        headers: { 
          'Authorization': sessionId,  // API expects just the session ID
          'Content-Type': 'application/json'
        }
      });

      console.log('📄 Document status response:', response.status);

      if (response.ok) {
        const status = await response.json();
        console.log('📄 Document status data:', status);
        
        // Update resume status
        const resumeStatus = document.getElementById('resumeStatus');
        if (status.data && status.data.resume && status.data.resume.filename) {
          resumeStatus.textContent = 'Ready';
          resumeStatus.className = 'status-value status-ready';
        } else {
          resumeStatus.textContent = 'Missing';
          resumeStatus.className = 'status-value status-missing';
        }
        
        // Update personal info status
        const personalInfoStatus = document.getElementById('personalInfoStatus');
        if (status.data && status.data.personal_info && status.data.personal_info.filename) {
          personalInfoStatus.textContent = 'Ready';
          personalInfoStatus.className = 'status-value status-ready';
        } else {
          personalInfoStatus.textContent = 'Missing';
          personalInfoStatus.className = 'status-value status-missing';
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Document status API error:', response.status, errorText);
        
        // Set default status if API call fails
        document.getElementById('resumeStatus').textContent = 'Unknown';
        document.getElementById('personalInfoStatus').textContent = 'Unknown';
      }
    } catch (error) {
      console.error('❌ Error checking document status:', error);
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

  async checkWebAppLogin() {
    try {
      console.log('🔍 Checking for web app login...');
      
      // Query active tabs to check if web app is open and user is logged in
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        // Check if tab is localhost:5173 (web app)
        if (tab.url && (tab.url.includes('localhost:5173') || tab.url.includes('127.0.0.1:5173'))) {
          console.log('🔍 Found web app tab:', tab.url);
          
          try {
            // Send message to content script to check login status
            const response = await chrome.tabs.sendMessage(tab.id, {
              action: 'checkWebAppLogin'
            });
            
            if (response && response.isLoggedIn) {
              console.log('✅ Web app login confirmed:', response);
              return {
                email: response.email,
                userId: response.userId,
                sessionId: response.sessionId,
                tabId: tab.id
              };
            }
          } catch (error) {
            console.log('⚠️ Could not check login on tab:', tab.id, error.message);
          }
        }
      }
      
      console.log('❌ No web app login found');
      return null;
    } catch (error) {
      console.error('❌ Error checking web app login:', error);
      return null;
    }
  }

  async syncWithWebApp(webAppSession) {
    try {
      console.log('🔄 Syncing with web app session:', webAppSession);
      
      // Store the session data in extension storage
      const storageData = {
        sessionId: webAppSession.sessionId,
        userId: webAppSession.userId,
        email: webAppSession.email
      };
      
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(storageData, () => {
          if (chrome.runtime.lastError) {
            console.error('❌ Storage error:', chrome.runtime.lastError);
            reject(new Error('Failed to store session data'));
            return;
          }
          
          console.log('✅ Web app session synced to extension');
          resolve(storageData);
        });
      });
    } catch (error) {
      console.error('❌ Sync error:', error);
      throw error;
    }
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
    // Check if user is already logged in to extension
    try {
      const sessionId = await this.getStoredSessionId();
      
      if (sessionId) {
        console.log('🔍 Found existing extension session:', sessionId);
        this.showDashboard();
        return;
      }
      
      console.log('🔍 No extension session found, checking web app login...');
      
      // Check if user is logged in to web app
      const webAppSession = await this.checkWebAppLogin();
      if (webAppSession) {
        console.log('✅ Web app login detected:', webAppSession);
        this.showWebAppLoginDetected(webAppSession);
      } else {
        console.log('🔍 No web app login found, showing manual login');
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

    // Sync login button
    const syncLoginBtn = document.getElementById('syncLoginBtn');
    if (syncLoginBtn) {
      syncLoginBtn.addEventListener('click', async () => {
        await this.handleSyncLogin();
      });
    }

    // Manual login button (from web app detected view)
    const manualLoginBtn = document.getElementById('manualLoginBtn');
    if (manualLoginBtn) {
      manualLoginBtn.addEventListener('click', () => {
        this.showLogin();
      });
    }

    // URL Tracker buttons
    const saveCurrentPageBtn = document.getElementById('saveCurrentPageBtn');
    if (saveCurrentPageBtn) {
      saveCurrentPageBtn.addEventListener('click', async () => {
        await this.saveCurrentPage();
      });
    }

    const openUrlTrackerBtn = document.getElementById('openUrlTrackerBtn');
    if (openUrlTrackerBtn) {
      openUrlTrackerBtn.addEventListener('click', () => {
        this.openUrlTracker();
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

  async handleSyncLogin() {
    const syncBtn = document.getElementById('syncLoginBtn');
    const originalText = syncBtn.textContent;
    
    try {
      console.log('🔄 Starting sync login process...');
      syncBtn.innerHTML = '<div class="loading"></div> Syncing...';
      syncBtn.disabled = true;

      if (!this.pendingWebAppSession) {
        throw new Error('No web app session data available');
      }

      // Sync the session data to extension storage
      await this.syncWithWebApp(this.pendingWebAppSession);
      
      console.log('✅ Sync successful, showing dashboard');
      this.showDashboard();
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.showError(`Sync failed: ${error.message}`);
    } finally {
      syncBtn.textContent = originalText;
      syncBtn.disabled = false;
    }
  }

  async handleLogout() {
    try {
      console.log('🚪 Starting logout process...');
      await this.logout();
      console.log('✅ Logout successful, showing login screen');
      this.showLogin();
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Show login anyway to reset the UI
      this.showLogin();
    }
  }

  showWebAppLoginDetected(webAppSession) {
    const webAppLoginView = document.getElementById('webAppLoginView');
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const signupView = document.getElementById('signupView');
    
    // Hide all other views
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
    if (signupView) signupView.classList.add('hidden');
    
    // Show web app login view
    if (webAppLoginView) {
      webAppLoginView.classList.remove('hidden');
      
      // Update detected user info
      const detectedEmail = document.getElementById('detectedEmail');
      const detectedUserId = document.getElementById('detectedUserId');
      
      if (detectedEmail) detectedEmail.textContent = webAppSession.email || 'Unknown';
      if (detectedUserId) detectedUserId.textContent = `ID: ${webAppSession.userId?.substring(0, 8)}...` || 'Unknown';
    }
    
    // Store web app session for sync
    this.pendingWebAppSession = webAppSession;
  }

  showLogin() {
    const webAppLoginView = document.getElementById('webAppLoginView');
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const signupView = document.getElementById('signupView');
    
    if (webAppLoginView) webAppLoginView.classList.add('hidden');
    if (loginView) loginView.classList.remove('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
    if (signupView) signupView.classList.add('hidden');
  }

  showSignup() {
    const webAppLoginView = document.getElementById('webAppLoginView');
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const signupView = document.getElementById('signupView');
    
    if (webAppLoginView) webAppLoginView.classList.add('hidden');
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
    if (signupView) signupView.classList.remove('hidden');
  }

  showDashboard() {
    const webAppLoginView = document.getElementById('webAppLoginView');
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const signupView = document.getElementById('signupView');
    
    if (webAppLoginView) webAppLoginView.classList.add('hidden');
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');
    if (signupView) signupView.classList.add('hidden');

    // Setup dashboard-specific event listeners
    this.setupDashboardEventListeners();

    // Load user info and document status
    this.loadUserInfo();
    this.checkDocumentStatus();
    this.loadUrlStats();
  }

  setupDashboardEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.removeEventListener('click', this.handleLogout); // Remove any existing listener
      logoutBtn.addEventListener('click', async () => {
        console.log('🚪 Logout button clicked');
        await this.handleLogout();
      });
    }

    // URL Tracker buttons
    const saveCurrentPageBtn = document.getElementById('saveCurrentPageBtn');
    if (saveCurrentPageBtn) {
      saveCurrentPageBtn.removeEventListener('click', this.saveCurrentPage);
      saveCurrentPageBtn.addEventListener('click', async () => {
        console.log('💾 Save current page button clicked');
        await this.saveCurrentPage();
      });
    }

    const openUrlTrackerBtn = document.getElementById('openUrlTrackerBtn');
    if (openUrlTrackerBtn) {
      openUrlTrackerBtn.removeEventListener('click', this.openUrlTracker);
      openUrlTrackerBtn.addEventListener('click', () => {
        console.log('🔗 Open URL tracker button clicked');
        this.openUrlTracker();
      });
    }

    // Translation toggle
    const translationToggle = document.getElementById('translationToggle');
    if (translationToggle) {
      // Load saved state
      this.loadTranslationState();
      
      translationToggle.addEventListener('change', async () => {
        const isEnabled = translationToggle.checked;
        console.log('🌐 Translation toggle changed:', isEnabled ? 'enabled' : 'disabled');
        
        // Save state to storage
        try {
          await chrome.storage.local.set({ 'translationEnabled': isEnabled });
        } catch (error) {
          console.error('Failed to save translation state:', error);
        }
        
        // Send message to content script
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'toggleTranslation',
              enabled: isEnabled
            });
          }
        } catch (error) {
          console.error('Failed to send message to content script:', error);
        }
        
        // Update instructions
        this.updateTranslationInstructions(isEnabled);
      });
    }
  }

  async loadTranslationState() {
    try {
      const result = await chrome.storage.local.get(['translationEnabled']);
      const isEnabled = result.translationEnabled !== false; // Default to true
      
      const translationToggle = document.getElementById('translationToggle');
      if (translationToggle) {
        translationToggle.checked = isEnabled;
        this.updateTranslationInstructions(isEnabled);
      }
    } catch (error) {
      console.error('Failed to load translation state:', error);
    }
  }

  updateTranslationInstructions(isEnabled) {
    const instructionsDiv = document.getElementById('translationInstructions');
    if (instructionsDiv) {
      if (isEnabled) {
        instructionsDiv.innerHTML = '✨ Highlight any English text on websites to see instant Russian translation';
        instructionsDiv.style.background = '#ecfdf5';
        instructionsDiv.style.borderLeft = '3px solid #10b981';
      } else {
        instructionsDiv.innerHTML = '⏸️ Translation feature is disabled - toggle above to enable';
        instructionsDiv.style.background = '#fef3c7';
        instructionsDiv.style.borderLeft = '3px solid #f59e0b';
      }
    }
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
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.classList.remove('hidden');
      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 5000);
    }
  }

  // URL Tracker Methods
  async saveCurrentPage() {
    const saveBtn = document.getElementById('saveCurrentPageBtn');
    if (!saveBtn) {
      console.error('❌ Save button not found');
      return;
    }
    
    const originalText = saveBtn.textContent;
    
    try {
      console.log('💾 Saving current page...');
      saveBtn.innerHTML = '<div class="loading"></div> Saving...';
      saveBtn.disabled = true;

      // Get current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        throw new Error('No active tab found');
      }

      const currentTab = tabs[0];
      const sessionId = await this.getStoredSessionId();
      
      if (!sessionId) {
        throw new Error('Not authenticated. Please login first.');
      }

      // Save URL via API
      const response = await fetch(`${this.API_BASE_URL}/api/urls/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionId
        },
        body: JSON.stringify({
          url: currentTab.url,
          title: currentTab.title
        })
      });

      const result = await response.json();

      if (response.ok) {
        this.showError(`✅ ${result.message || 'URL saved successfully!'}`, 'successMessage');
        // Refresh URL stats
        this.loadUrlStats();
      } else {
        throw new Error(result.detail || 'Failed to save URL');
      }

    } catch (error) {
      console.error('Failed to save URL:', error);
      this.showError(`❌ ${error.message}`);
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  openUrlTracker() {
    try {
      console.log('🔗 Opening URL Tracker...');
      
      // Check if chrome.tabs is available
      if (!chrome.tabs) {
        console.error('❌ Chrome tabs API not available');
        this.showError('Cannot open URL tracker. Extension permissions issue.');
        return;
      }
      
      // Open URL tracker web app in new tab
      chrome.tabs.create({ url: 'http://localhost:5173' }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to open URL tracker:', chrome.runtime.lastError);
          this.showError('Failed to open URL tracker. Please check if the web app is running.');
        } else {
          console.log('✅ URL tracker opened successfully');
        }
      });
    } catch (error) {
      console.error('❌ Error opening URL tracker:', error);
      this.showError('Failed to open URL tracker. Please try again.');
    }
  }

  async loadUrlStats() {
    try {
      const sessionId = await this.getStoredSessionId();
      if (!sessionId) return;

      const response = await fetch(`${this.API_BASE_URL}/api/urls/stats/summary`, {
        headers: {
          'Authorization': sessionId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 URL stats data:', data);
        
        const urlStatsDiv = document.getElementById('urlStats');
        if (urlStatsDiv && data.stats) {
          const stats = data.stats;
          urlStatsDiv.innerHTML = `
            📊 <strong>${stats.total_urls}</strong> URLs tracked<br>
            ✅ <strong>${stats.applied}</strong> applied • 
            ⏳ <strong>${stats.in_progress}</strong> in progress • 
            📝 <strong>${stats.not_applied}</strong> pending
          `;
        } else if (urlStatsDiv) {
          urlStatsDiv.textContent = `📊 Tracked: 0 URLs`;
        }
      } else {
        console.error('Failed to load URL stats:', response.status);
      }
    } catch (error) {
      console.error('Error loading URL stats:', error);
    }
  }
}

/**
 * 🌐 Floating Popup Manager
 * Creates and manages floating popup on web pages
 */
class FloatingPopupManager {
  constructor() {
    this.isVisible = false;
    this.popupContainer = null;
    this.createFloatingButton();
  }

  createFloatingButton() {
    // Remove existing button
    if (document.getElementById('ai-floating-trigger')) {
      document.getElementById('ai-floating-trigger').remove();
    }

    // Create floating trigger button
    const button = document.createElement('div');
    button.id = 'ai-floating-trigger';
    button.innerHTML = '🤖';
    
    // Add styles
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      user-select: none;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    // Add click event
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopup();
    });

    document.body.appendChild(button);
  }

  togglePopup() {
    if (this.isVisible) {
      this.hidePopup();
    } else {
      this.showPopup();
    }
  }

  async showPopup() {
    if (this.popupContainer) {
      this.popupContainer.remove();
    }

    // Create popup container with embedded HTML
    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'ai-floating-popup';
    this.popupContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 380px;
      min-height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles
    if (!document.getElementById('ai-popup-styles')) {
      const style = document.createElement('style');
      style.id = 'ai-popup-styles';
      style.textContent = `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-20px) scale(0.9); }
        }
      `;
      document.head.appendChild(style);
    }

    // Create popup content (simplified version)
    this.popupContainer.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">
            🤖 AI Assistant
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            Smart Form Filling & URL Tracking
          </div>
        </div>
        <div id="floating-popup-content" style="background: white; border-radius: 16px; padding: 24px; color: #374151;">
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 16px; margin-bottom: 10px;">🔄 Loading...</div>
            <div style="font-size: 12px; color: #6b7280;">Initializing AI Assistant</div>
          </div>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(this.popupContainer);
    this.isVisible = true;

    // Initialize popup functionality
    setTimeout(() => {
      new UnifiedPopupManager();
    }, 100);

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
    }, 100);
  }

  hidePopup() {
    if (this.popupContainer) {
      this.popupContainer.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (this.popupContainer) {
          this.popupContainer.remove();
          this.popupContainer = null;
        }
      }, 300);
    }
    this.isVisible = false;
  }

  handleOutsideClick(e) {
    if (this.popupContainer && 
        !this.popupContainer.contains(e.target) && 
        !document.getElementById('ai-floating-trigger').contains(e.target)) {
      this.hidePopup();
    }
  }
}

// Initialize based on context
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

function initializePopup() {
  // Check if we're in a browser extension context or web page context
  if (typeof chrome !== 'undefined' && chrome.extension) {
    // Extension popup context
    console.log('🎯 Initializing Extension Popup');
    new UnifiedPopupManager();
  } else if (window.location.href.includes('popup.html')) {
    // Direct popup HTML access
    console.log('🎯 Initializing Direct Popup');
    new UnifiedPopupManager();
  } else {
    // Web page context - create floating popup
    console.log('🌐 Initializing Floating Popup');
    new FloatingPopupManager();
  }
}

// Export for external usage
window.UnifiedPopupManager = UnifiedPopupManager;
window.FloatingPopupManager = FloatingPopupManager;

console.log('🎯 Unified AI Form Assistant popup script loaded');
