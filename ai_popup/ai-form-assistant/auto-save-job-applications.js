// Auto-save job applications when forms are submitted
// This script detects form submissions and automatically saves the URL with "applied" status

class JobApplicationAutoSave {
  constructor() {
    this.apiBaseUrl = 'http://localhost:8000';
    this.sessionId = null;
    this.init();
  }

  async init() {
    // Load session ID
    await this.loadSessionId();
    
    // Set up form submission listeners
    this.setupFormListeners();
    
    console.log('🎯 Job Application Auto-Save initialized');
  }

  async loadSessionId() {
    try {
      const result = await chrome.storage.local.get(['session_id']);
      this.sessionId = result.session_id;
    } catch (error) {
      console.log('Failed to load session ID:', error);
    }
  }

  setupFormListeners() {
    // Listen for form submissions
    document.addEventListener('submit', (event) => {
      this.handleFormSubmission(event);
    });

    // Listen for button clicks that might be job application submissions
    document.addEventListener('click', (event) => {
      this.handleButtonClick(event);
    });

    // Listen for URL changes (for single-page applications)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.checkForApplicationSuccess();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async handleFormSubmission(event) {
    const form = event.target;
    
    // Check if this looks like a job application form
    if (this.isJobApplicationForm(form)) {
      console.log('🎯 Job application form detected!');
      
      // Small delay to allow form processing
      setTimeout(async () => {
        await this.saveJobApplication('applied');
      }, 1000);
    }
  }

  async handleButtonClick(event) {
    const button = event.target;
    
    // Check if this looks like a job application button
    if (this.isJobApplicationButton(button)) {
      console.log('🎯 Job application button clicked!');
      
      // Small delay to allow navigation/processing
      setTimeout(async () => {
        await this.saveJobApplication('applied');
      }, 2000);
    }
  }

  isJobApplicationForm(form) {
    const formText = form.textContent.toLowerCase();
    const formAction = form.action ? form.action.toLowerCase() : '';
    const formClass = form.className ? form.className.toLowerCase() : '';
    const formId = form.id ? form.id.toLowerCase() : '';
    
    // Keywords that indicate job application forms
    const jobKeywords = [
      'apply', 'application', 'submit', 'resume', 'cv', 'cover letter',
      'job', 'position', 'career', 'employment', 'hire', 'recruit'
    ];
    
    // Check form attributes and content
    const searchText = `${formText} ${formAction} ${formClass} ${formId}`;
    
    return jobKeywords.some(keyword => searchText.includes(keyword));
  }

  isJobApplicationButton(button) {
    const buttonText = button.textContent ? button.textContent.toLowerCase() : '';
    const buttonClass = button.className ? button.className.toLowerCase() : '';
    const buttonId = button.id ? button.id.toLowerCase() : '';
    const buttonTitle = button.title ? button.title.toLowerCase() : '';
    
    // Keywords that indicate job application buttons
    const applicationKeywords = [
      'apply now', 'submit application', 'apply for', 'apply to',
      'submit resume', 'apply for position', 'apply for job',
      'send application', 'apply online', 'quick apply',
      'easy apply', '1-click apply', 'apply with'
    ];
    
    const exactMatches = [
      'apply', 'submit', 'send', 'apply now', 'submit application'
    ];
    
    const searchText = `${buttonText} ${buttonClass} ${buttonId} ${buttonTitle}`;
    
    // Check for exact matches first
    if (exactMatches.some(keyword => buttonText.trim() === keyword)) {
      return true;
    }
    
    // Check for partial matches
    return applicationKeywords.some(keyword => searchText.includes(keyword));
  }

  checkForApplicationSuccess() {
    // Check for success messages or confirmation pages
    const bodyText = document.body.textContent.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();
    
    const successKeywords = [
      'application submitted', 'application received', 'thank you for applying',
      'application successful', 'we received your application',
      'application complete', 'successfully applied'
    ];
    
    const successUrls = [
      'success', 'confirmation', 'thank-you', 'applied', 'submitted'
    ];
    
    const hasSuccessText = successKeywords.some(keyword => bodyText.includes(keyword));
    const hasSuccessUrl = successUrls.some(keyword => currentUrl.includes(keyword));
    
    if (hasSuccessText || hasSuccessUrl) {
      console.log('🎯 Job application success detected!');
      setTimeout(async () => {
        await this.saveJobApplication('applied');
      }, 1000);
    }
  }

  async saveJobApplication(status = 'applied') {
    if (!this.sessionId) {
      console.log('No session ID available for auto-save');
      return;
    }

    try {
      // First, save the URL
      const saveResponse = await fetch(`${this.apiBaseUrl}/api/urls/save`, {
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

      const saveResult = await saveResponse.json();

      if (saveResponse.ok) {
        console.log('✅ URL saved automatically:', saveResult);
        
        // If status is 'applied', update the status
        if (status === 'applied' && saveResult.url && saveResult.url.id) {
          await this.updateUrlStatus(saveResult.url.id, status);
        }
        
        // Show success notification
        this.showNotification('✅ Job application saved and marked as applied!');
        
      } else {
        console.error('Failed to auto-save URL:', saveResult);
      }

    } catch (error) {
      console.error('Error auto-saving job application:', error);
    }
  }

  async updateUrlStatus(urlId, status) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/urls/${urlId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.sessionId
        },
        body: JSON.stringify({
          status: status,
          notes: 'Automatically marked as applied by browser extension'
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ URL status updated automatically:', result);
      } else {
        console.error('Failed to update URL status:', result);
      }

    } catch (error) {
      console.error('Error updating URL status:', error);
    }
  }

  showNotification(message) {
    // Add CSS animations if not already present
    if (!document.getElementById('auto-save-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'auto-save-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      z-index: 999999;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new JobApplicationAutoSave();
  });
} else {
  new JobApplicationAutoSave();
}

// Listen for storage changes (session updates)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.session_id) {
    // Reinitialize with new session
    new JobApplicationAutoSave();
  }
}); 