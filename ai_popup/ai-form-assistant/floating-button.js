// Floating Button for Quick URL Saving
// This script creates a small floating button that allows users to quickly save URLs

class FloatingUrlSaver {
  constructor() {
    this.isAuthenticated = false;
    this.apiBaseUrl = 'http://localhost:8000';
    this.floatingButton = null;
    this.miniPopup = null;
    this.sessionId = null;
    
    this.init();
  }

  async init() {
    // Check authentication status
    await this.checkAuthStatus();
    
    // Create floating button
    this.createFloatingButton();
    
    // Listen for auth changes
    this.setupAuthListener();
  }

  async checkAuthStatus() {
    try {
      // Get session from storage
      const result = await chrome.storage.local.get(['session_id', 'user_id']);
      this.sessionId = result.session_id;
      this.isAuthenticated = !!(result.session_id && result.user_id);
    } catch (error) {
      console.log('Auth check failed:', error);
      this.isAuthenticated = false;
    }
  }

  createFloatingButton() {
    // Remove existing button if any
    if (this.floatingButton) {
      this.floatingButton.remove();
    }

    // Create floating button
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'ai-url-tracker-floating-btn';
    this.floatingButton.innerHTML = `
      <div class="floating-btn-icon">🔗</div>
      <div class="floating-btn-tooltip">Save URL</div>
    `;
    
    // Add styles
    this.floatingButton.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 18px;
      user-select: none;
      ${this.isAuthenticated ? '' : 'opacity: 0.6;'}
    `;

    // Add hover styles
    const style = document.createElement('style');
    style.textContent = `
      #ai-url-tracker-floating-btn:hover {
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
      }
      
      #ai-url-tracker-floating-btn .floating-btn-tooltip {
        position: absolute;
        right: 60px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      #ai-url-tracker-floating-btn:hover .floating-btn-tooltip {
        opacity: 1;
      }
      
      .ai-mini-popup {
        position: fixed;
        top: 50%;
        right: 80px;
        transform: translateY(-50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 999998;
        padding: 16px;
        min-width: 250px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e5e7eb;
      }
      
      .ai-mini-popup h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #1f2937;
      }
      
      .ai-mini-popup button {
        width: 100%;
        padding: 10px;
        margin: 6px 0;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .ai-mini-popup .save-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      
      .ai-mini-popup .save-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
      }
      
      .ai-mini-popup .open-btn {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }
      
      .ai-mini-popup .open-btn:hover {
        background: #e5e7eb;
      }
      
      .ai-mini-popup .close-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #6b7280;
        width: auto;
        padding: 4px;
        margin: 0;
      }
      
      .ai-mini-popup .url-info {
        background: #f8fafc;
        padding: 8px;
        border-radius: 6px;
        margin: 8px 0;
        font-size: 12px;
        color: #6b7280;
        word-break: break-all;
      }
      
      .ai-success-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        animation: slideInRight 0.3s ease;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Add click event
    this.floatingButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isAuthenticated) {
        this.showMiniPopup();
      } else {
        this.showAuthPrompt();
      }
    });

    // Add to page
    document.body.appendChild(this.floatingButton);
  }

  showMiniPopup() {
    // Remove existing popup
    if (this.miniPopup) {
      this.miniPopup.remove();
    }

    // Create mini popup
    this.miniPopup = document.createElement('div');
    this.miniPopup.className = 'ai-mini-popup';
    this.miniPopup.innerHTML = `
      <button class="close-btn">×</button>
      <h3>🔗 URL Tracker</h3>
      <div class="url-info">
        <strong>Current Page:</strong><br>
        ${document.title}<br>
        <small>${window.location.href}</small>
      </div>
      <button class="save-btn" id="quick-save-btn">
        📌 Save Current Page
      </button>
      <button class="open-btn" id="open-tracker-btn">
        📋 Open URL Tracker
      </button>
    `;

    // Add event listeners
    this.miniPopup.querySelector('.close-btn').addEventListener('click', () => {
      this.miniPopup.remove();
      this.miniPopup = null;
    });

    this.miniPopup.querySelector('#quick-save-btn').addEventListener('click', () => {
      this.quickSaveUrl();
    });

    this.miniPopup.querySelector('#open-tracker-btn').addEventListener('click', () => {
      this.openUrlTracker();
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
    }, 100);

    document.body.appendChild(this.miniPopup);
  }

  handleOutsideClick(e) {
    if (this.miniPopup && !this.miniPopup.contains(e.target) && !this.floatingButton.contains(e.target)) {
      this.miniPopup.remove();
      this.miniPopup = null;
    }
  }

  async quickSaveUrl() {
    const saveBtn = this.miniPopup.querySelector('#quick-save-btn');
    const originalText = saveBtn.textContent;
    
    try {
      saveBtn.textContent = '⏳ Saving...';
      saveBtn.disabled = true;

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
        this.showSuccessToast(result.message || 'URL saved successfully!');
        this.miniPopup.remove();
        this.miniPopup = null;
      } else {
        throw new Error(result.detail || 'Failed to save URL');
      }
    } catch (error) {
      console.error('Failed to save URL:', error);
      this.showErrorToast(error.message || 'Failed to save URL');
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  openUrlTracker() {
    // Close mini popup
    if (this.miniPopup) {
      this.miniPopup.remove();
      this.miniPopup = null;
    }
    
    // Open URL tracker in new tab
    chrome.tabs.create({ url: 'http://localhost:5173' });
  }

  showAuthPrompt() {
    this.showErrorToast('Please login first. Click the extension icon to authenticate.');
  }

  showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'ai-success-toast';
    toast.textContent = `✅ ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'ai-success-toast';
    toast.style.background = '#ef4444';
    toast.textContent = `❌ ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  setupAuthListener() {
    // Listen for storage changes (auth updates)
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.session_id || changes.user_id) {
        this.checkAuthStatus().then(() => {
          // Update button appearance
          if (this.floatingButton) {
            this.floatingButton.style.opacity = this.isAuthenticated ? '1' : '0.6';
          }
        });
      }
    });
  }
}

// Initialize floating button when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FloatingUrlSaver();
  });
} else {
  new FloatingUrlSaver();
} 