// Floating Popup that embeds the actual extension popup on any webpage
// This creates a persistent popup interface that works on all sites

class FloatingPopupManager {
  constructor() {
    this.isVisible = false;
    this.popupContainer = null;
    this.apiBaseUrl = 'http://localhost:8000';
    this.sessionId = null;
    this.userId = null;
    this.userEmail = null;
    
    this.init();
  }

  async init() {
    // Check authentication status
    await this.loadAuthData();
    
    // Create floating trigger button
    this.createFloatingButton();
    
    // Listen for auth changes
    this.setupStorageListener();
  }

  async loadAuthData() {
    try {
      const result = await chrome.storage.local.get(['session_id', 'user_id', 'user_email']);
      this.sessionId = result.session_id;
      this.userId = result.user_id;
      this.userEmail = result.user_email;
    } catch (error) {
      console.log('Auth data load failed:', error);
    }
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

  showPopup() {
    if (this.popupContainer) {
      this.popupContainer.remove();
    }

    // Create popup container
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
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Create popup content (replicate popup.html structure)
    this.popupContainer.innerHTML = this.getPopupHTML();
    
    // Add to page
    document.body.appendChild(this.popupContainer);
    this.isVisible = true;

    // Initialize popup functionality
    this.initializePopupLogic();

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

  getPopupHTML() {
    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            🤖 AI Assistant
          </div>
          <div style="font-size: 14px; opacity: 0.9; font-weight: 400;">
            Smart Form Filling & URL Tracking
          </div>
        </div>
      </div>

      <div style="padding: 24px;">
        <!-- Success/Error Messages -->
        <div id="floating-success-message" style="display: none; background: #f0fdf4; color: #166534; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; border-left: 4px solid #16a34a;"></div>
        <div id="floating-error-message" style="display: none; background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; border-left: 4px solid #dc2626;"></div>

        <!-- Login View -->
        <div id="floating-login-view" style="display: none;">
          <form id="floating-login-form">
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #374151;">Email Address</label>
              <input type="email" id="floating-email" placeholder="your.email@example.com" required style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; background: #f9fafb; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #374151;">Password</label>
              <input type="password" id="floating-password" placeholder="Enter your password" required style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; background: #f9fafb; box-sizing: border-box;">
            </div>
            
            <button type="submit" id="floating-login-btn" style="width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; gap: 8px;">
              Login
            </button>
          </form>
        </div>

        <!-- Dashboard View -->
        <div id="floating-dashboard-view" style="display: none;">
          <div style="margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: 600; color: #1f2937;" id="floating-user-email"></div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;" id="floating-user-id"></div>
          </div>
          
          <!-- URL Tracker Section -->
          <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #374151; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              🔗 URL Tracker
            </div>
            
            <button id="floating-save-current-btn" style="width: 100%; padding: 12px; margin-bottom: 8px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
              📌 Save Current Page
            </button>
            
            <button id="floating-open-tracker-btn" style="width: 100%; padding: 12px; margin-bottom: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">
              📋 Open URL Tracker
            </button>
            
            <div id="floating-url-stats" style="font-size: 12px; color: #6b7280; text-align: center; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
              Loading URL stats...
            </div>
          </div>

          <!-- Document Status -->
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 600; color: #374151; margin-bottom: 12px;">📄 Document Status</div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-weight: 500; color: #374151;">Resume</span>
              <span id="floating-resume-status" style="font-size: 12px; padding: 4px 8px; border-radius: 6px; font-weight: 500;">Checking...</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
              <span style="font-weight: 500; color: #374151;">Personal Info</span>
              <span id="floating-personal-info-status" style="font-size: 12px; padding: 4px 8px; border-radius: 6px; font-weight: 500;">Checking...</span>
            </div>
          </div>
          
          <button id="floating-logout-btn" style="width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db;">
            Logout
          </button>
        </div>
      </div>
    `;
  }

  async initializePopupLogic() {
    // Check if user is authenticated
    if (this.sessionId && this.userId) {
      this.showDashboardView();
    } else {
      this.showLoginView();
    }
  }

  showLoginView() {
    const loginView = document.getElementById('floating-login-view');
    const dashboardView = document.getElementById('floating-dashboard-view');
    
    if (loginView) loginView.style.display = 'block';
    if (dashboardView) dashboardView.style.display = 'none';

    // Setup login form
    const loginForm = document.getElementById('floating-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
  }

  showDashboardView() {
    const loginView = document.getElementById('floating-login-view');
    const dashboardView = document.getElementById('floating-dashboard-view');
    
    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';

    // Load user info
    this.loadUserInfo();
    this.loadDocumentStatus();
    this.loadUrlStats();

    // Setup dashboard buttons
    this.setupDashboardEvents();
  }

  setupDashboardEvents() {
    // Save current page button
    const saveBtn = document.getElementById('floating-save-current-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveCurrentPage();
      });
    }

    // Open tracker button
    const openBtn = document.getElementById('floating-open-tracker-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:5173' });
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('floating-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }
  }

  async handleLogin() {
    const email = document.getElementById('floating-email').value;
    const password = document.getElementById('floating-password').value;
    const loginBtn = document.getElementById('floating-login-btn');
    
    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    const originalText = loginBtn.textContent;
    
    try {
      loginBtn.innerHTML = '<div style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div> Logging in...';
      loginBtn.disabled = true;

      // Step 1: Authenticate user
      const loginResponse = await fetch(`${this.apiBaseUrl}/api/simple/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const loginData = await loginResponse.json();

      // Step 2: Create session
      const sessionResponse = await fetch(`${this.apiBaseUrl}/api/session/check-and-update/${loginData.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!sessionResponse.ok) {
        throw new Error('Session creation failed');
      }

      const sessionData = await sessionResponse.json();

      // Store authentication data
      await chrome.storage.local.set({
        session_id: sessionData.session_id,
        user_id: loginData.user_id,
        user_email: loginData.email
      });

      // Update local state
      this.sessionId = sessionData.session_id;
      this.userId = loginData.user_id;
      this.userEmail = loginData.email;

      this.showSuccess('Login successful!');
      setTimeout(() => {
        this.showDashboardView();
      }, 1000);

    } catch (error) {
      console.error('Login failed:', error);
      this.showError(`Login failed: ${error.message}`);
    } finally {
      loginBtn.textContent = originalText;
      loginBtn.disabled = false;
    }
  }

  async saveCurrentPage() {
    const saveBtn = document.getElementById('floating-save-current-btn');
    const originalText = saveBtn.textContent;
    
    try {
      saveBtn.innerHTML = '<div style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div> Saving...';
      saveBtn.disabled = true;

      if (!this.sessionId) {
        throw new Error('Not authenticated. Please login first.');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/urls/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.sessionId
        },
        body: JSON.stringify({
          url: window.location.href,
          title: document.title
        })
      });

      const result = await response.json();

      if (response.ok) {
        this.showSuccess(result.message || 'URL saved successfully!');
        this.loadUrlStats(); // Refresh stats
      } else {
        throw new Error(result.detail || 'Failed to save URL');
      }

    } catch (error) {
      console.error('Failed to save URL:', error);
      this.showError(error.message);
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  async handleLogout() {
    try {
      await chrome.storage.local.remove(['session_id', 'user_id', 'user_email']);
      this.sessionId = null;
      this.userId = null;
      this.userEmail = null;
      this.showLoginView();
      this.showSuccess('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  loadUserInfo() {
    const userEmailEl = document.getElementById('floating-user-email');
    const userIdEl = document.getElementById('floating-user-id');
    
    if (userEmailEl && this.userEmail) {
      userEmailEl.textContent = this.userEmail;
    }
    if (userIdEl && this.userId) {
      userIdEl.textContent = `ID: ${this.userId}`;
    }
  }

  async loadDocumentStatus() {
    try {
      if (!this.sessionId) return;

      const response = await fetch(`${this.apiBaseUrl}/api/v1/documents/status`, {
        headers: { 'Authorization': this.sessionId }
      });

      if (response.ok) {
        const status = await response.json();
        
        const resumeStatus = document.getElementById('floating-resume-status');
        const personalInfoStatus = document.getElementById('floating-personal-info-status');
        
        if (resumeStatus) {
          if (status.data?.resume?.filename) {
            resumeStatus.textContent = 'Ready';
            resumeStatus.style.background = '#dcfce7';
            resumeStatus.style.color = '#166534';
          } else {
            resumeStatus.textContent = 'Missing';
            resumeStatus.style.background = '#fef3c7';
            resumeStatus.style.color = '#92400e';
          }
        }
        
        if (personalInfoStatus) {
          if (status.data?.personal_info?.filename) {
            personalInfoStatus.textContent = 'Ready';
            personalInfoStatus.style.background = '#dcfce7';
            personalInfoStatus.style.color = '#166534';
          } else {
            personalInfoStatus.textContent = 'Missing';
            personalInfoStatus.style.background = '#fef3c7';
            personalInfoStatus.style.color = '#92400e';
          }
        }
      }
    } catch (error) {
      console.error('Error loading document status:', error);
    }
  }

  async loadUrlStats() {
    try {
      if (!this.sessionId) return;

      const response = await fetch(`${this.apiBaseUrl}/api/urls/stats/summary`, {
        headers: { 'Authorization': this.sessionId }
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;
        
        const urlStatsEl = document.getElementById('floating-url-stats');
        if (urlStatsEl) {
          urlStatsEl.innerHTML = `
            📊 <strong>${stats.total_urls}</strong> URLs tracked<br>
            ✅ <strong>${stats.applied}</strong> applied • 
            ⏳ <strong>${stats.in_progress}</strong> in progress • 
            📝 <strong>${stats.not_applied}</strong> pending
          `;
        }
      }
    } catch (error) {
      console.error('Error loading URL stats:', error);
    }
  }

  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.session_id || changes.user_id || changes.user_email) {
        this.loadAuthData().then(() => {
          if (this.isVisible) {
            this.initializePopupLogic();
          }
        });
      }
    });
  }

  showSuccess(message) {
    const successEl = document.getElementById('floating-success-message');
    if (successEl) {
      successEl.textContent = message;
      successEl.style.display = 'block';
      setTimeout(() => {
        successEl.style.display = 'none';
      }, 3000);
    }
  }

  showError(message) {
    const errorEl = document.getElementById('floating-error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    }
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FloatingPopupManager();
  });
} else {
  new FloatingPopupManager();
} 