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
    // Add your UI initialization code here
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

console.log('🎯 AI Form Assistant popup script loaded');
