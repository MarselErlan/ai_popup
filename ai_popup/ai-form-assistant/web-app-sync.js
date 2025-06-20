/**
 * 🔄 Web App Session Sync Script
 * This script helps synchronize login sessions between the web app and browser extension
 * 
 * Usage: Include this script in your web app to enable automatic session sync
 */

(function() {
  console.log('🔄 Web App Session Sync loaded');

  // Configuration
  const EXTENSION_ID = chrome.runtime?.id;
  const CHECK_INTERVAL = 2000; // Check every 2 seconds
  
  // Track last known session state
  let lastSessionState = null;

  /**
   * Check for session changes and notify extension
   */
  function checkSessionChanges() {
    try {
      const currentSession = {
        sessionId: localStorage.getItem('sessionId'),
        userId: localStorage.getItem('userId'),
        email: localStorage.getItem('email')
      };

      // Convert to string for comparison
      const currentSessionStr = JSON.stringify(currentSession);
      
      if (currentSessionStr !== lastSessionState) {
        console.log('🔄 Session state changed:', currentSession);
        
        if (currentSession.sessionId && currentSession.userId) {
          // Session established - notify extension
          notifyExtensionOfLogin(currentSession);
          
          // Dispatch custom event for content script
          window.dispatchEvent(new CustomEvent('webAppLogin', {
            detail: currentSession
          }));
          
          console.log('✅ Login detected and synced to extension');
        } else {
          // Session cleared - notify extension
          notifyExtensionOfLogout();
          
          window.dispatchEvent(new CustomEvent('webAppLogout'));
          
          console.log('🚪 Logout detected and synced to extension');
        }
        
        lastSessionState = currentSessionStr;
      }
    } catch (error) {
      console.warn('⚠️ Session sync check error:', error);
    }
  }

  /**
   * Notify extension of login
   */
  function notifyExtensionOfLogin(sessionData) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        // Try to communicate with extension
        chrome.runtime.sendMessage(EXTENSION_ID, {
          action: 'syncSession',
          sessionData: sessionData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('📱 Extension not available:', chrome.runtime.lastError.message);
          } else {
            console.log('✅ Session synced to extension:', response);
          }
        });
      } catch (error) {
        console.log('📱 Extension communication failed:', error.message);
      }
    }
  }

  /**
   * Notify extension of logout
   */
  function notifyExtensionOfLogout() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, {
          action: 'clearSession'
        }, (response) => {
          if (!chrome.runtime.lastError) {
            console.log('✅ Extension session cleared:', response);
          }
        });
      } catch (error) {
        console.log('📱 Extension communication failed:', error.message);
      }
    }
  }

  /**
   * Manual sync function that web app can call
   */
  window.syncSessionWithExtension = function(sessionData) {
    console.log('🔄 Manual session sync requested:', sessionData);
    
    if (sessionData && sessionData.sessionId && sessionData.userId) {
      // Store in localStorage
      localStorage.setItem('sessionId', sessionData.sessionId);
      localStorage.setItem('userId', sessionData.userId);
      if (sessionData.email) {
        localStorage.setItem('email', sessionData.email);
      }
      
      // Notify extension
      notifyExtensionOfLogin(sessionData);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('webAppLogin', {
        detail: sessionData
      }));
      
      console.log('✅ Manual sync completed');
    }
  };

  /**
   * Check if extension is available
   */
  function checkExtensionAvailability() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      console.log('✅ Browser extension API available');
      return true;
    } else {
      console.log('📱 Browser extension API not available');
      return false;
    }
  }

  /**
   * Initialize sync system
   */
  function initializeSync() {
    console.log('🚀 Initializing web app session sync...');
    
    // Check initial state
    checkSessionChanges();
    
    // Set up periodic checking
    setInterval(checkSessionChanges, CHECK_INTERVAL);
    
    // Listen for storage events (from other tabs)
    window.addEventListener('storage', (event) => {
      if (['sessionId', 'userId', 'email'].includes(event.key)) {
        console.log('🔄 Storage event detected:', event.key, event.newValue);
        setTimeout(checkSessionChanges, 100);
      }
    });
    
    // Listen for focus events (when user returns to tab)
    window.addEventListener('focus', () => {
      setTimeout(checkSessionChanges, 100);
    });
    
    console.log('✅ Web app session sync initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSync);
  } else {
    initializeSync();
  }

  // Expose utility functions
  window.webAppSync = {
    checkSession: checkSessionChanges,
    syncSession: window.syncSessionWithExtension,
    isExtensionAvailable: checkExtensionAvailability
  };

})(); 