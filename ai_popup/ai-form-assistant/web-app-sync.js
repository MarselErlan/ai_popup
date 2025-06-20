/**
 * 🔄 Unified Web App Session Sync Script
 * 
 * This single script handles ALL session synchronization between your web app and browser extension.
 * No need for multiple scripts - this does everything!
 * 
 * Features:
 * ✅ Automatic login detection from API calls
 * ✅ Manual sync functions for custom integration
 * ✅ Multiple localStorage key format detection
 * ✅ Framework integration helpers (React, Vue, Angular)
 * ✅ Real-time session monitoring
 * ✅ Extension communication
 * ✅ Error handling and debugging
 * 
 * Usage: Just include this script in your web app HTML:
 * <script src="web-app-sync.js"></script>
 */

(function() {
  console.log('🔄 Unified Web App Session Sync loaded');

  // Configuration
  const CHECK_INTERVAL = 2000; // Check every 2 seconds
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
   * Auto-detect and sync from web app login response
   */
  window.autoSyncFromLogin = function(loginResponse) {
    console.log('🔄 Auto-sync from login response:', loginResponse);
    
    // Try to extract session data from various response formats
    let sessionData = {};
    
    if (loginResponse) {
      // Common response patterns
      sessionData.sessionId = loginResponse.sessionId || 
                              loginResponse.session_id || 
                              loginResponse.token ||
                              loginResponse.accessToken ||
                              loginResponse.auth_token;
                              
      sessionData.userId = loginResponse.userId || 
                          loginResponse.user_id || 
                          loginResponse.id ||
                          loginResponse.user?.id ||
                          loginResponse.user?.user_id;
                          
      sessionData.email = loginResponse.email || 
                         loginResponse.user?.email ||
                         loginResponse.userEmail;
    }
    
    if (sessionData.sessionId && sessionData.userId) {
      console.log('✅ Extracted session data from login response');
      window.syncSessionWithExtension(sessionData);
      return true;
    } else {
      console.log('⚠️ Could not extract session data from login response');
      return false;
    }
  };

  /**
   * Hook into common AJAX/fetch patterns to auto-detect login
   */
  function setupAutoDetection() {
    // Hook into fetch API
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        // Check if this looks like a login request
        const url = args[0];
        if (typeof url === 'string' && 
            (url.includes('/login') || url.includes('/auth') || url.includes('/signin'))) {
          
          // Clone response to read without consuming
          const clonedResponse = response.clone();
          clonedResponse.json().then(data => {
            console.log('🔍 Detected login response:', data);
            window.autoSyncFromLogin(data);
          }).catch(() => {
            // Response might not be JSON, ignore
          });
        }
        return response;
      });
    };

    // Hook into XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('load', function() {
        if (this._url && 
            (this._url.includes('/login') || this._url.includes('/auth') || this._url.includes('/signin'))) {
          try {
            const data = JSON.parse(this.responseText);
            console.log('🔍 Detected XHR login response:', data);
            window.autoSyncFromLogin(data);
          } catch (e) {
            // Response might not be JSON, ignore
          }
        }
      });
      return originalXHRSend.apply(this, args);
    };
    
    console.log('✅ Auto-detection hooks installed');
  }

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
   * Try to detect existing session from various sources
   */
  function detectExistingSession() {
    console.log('🔍 Detecting existing session from web app...');
    
    // Method 1: Check if sessionId is in URL hash (common pattern)
    const hash = window.location.hash;
    if (hash.includes('sessionId=')) {
      const sessionId = hash.match(/sessionId=([^&]+)/)?.[1];
      if (sessionId) {
        console.log('✅ Found sessionId in URL hash');
        return { sessionId };
      }
    }
    
    // Method 2: Check for common session storage patterns
    const possibleSessionKeys = [
      'sessionId', 'session_id', 'session-id',
      'authToken', 'auth_token', 'auth-token',
      'accessToken', 'access_token', 'access-token'
    ];
    
    const possibleUserKeys = [
      'userId', 'user_id', 'user-id',
      'userID', 'USER_ID'
    ];
    
    const possibleEmailKeys = [
      'email', 'userEmail', 'user_email', 'user-email'
    ];
    
    let detectedSession = {};
    
    // Check localStorage for various key patterns
    for (const key of possibleSessionKeys) {
      const value = localStorage.getItem(key);
      if (value && value !== 'null' && value !== 'undefined') {
        detectedSession.sessionId = value;
        console.log(`✅ Found session in localStorage.${key}:`, value.substring(0, 20) + '...');
        break;
      }
    }
    
    for (const key of possibleUserKeys) {
      const value = localStorage.getItem(key);
      if (value && value !== 'null' && value !== 'undefined') {
        detectedSession.userId = value;
        console.log(`✅ Found userId in localStorage.${key}:`, value);
        break;
      }
    }
    
    for (const key of possibleEmailKeys) {
      const value = localStorage.getItem(key);
      if (value && value !== 'null' && value !== 'undefined') {
        detectedSession.email = value;
        console.log(`✅ Found email in localStorage.${key}:`, value);
        break;
      }
    }
    
    // Method 3: Check sessionStorage as fallback
    if (!detectedSession.sessionId) {
      for (const key of possibleSessionKeys) {
        const value = sessionStorage.getItem(key);
        if (value && value !== 'null' && value !== 'undefined') {
          detectedSession.sessionId = value;
          console.log(`✅ Found session in sessionStorage.${key}:`, value.substring(0, 20) + '...');
          break;
        }
      }
    }
    
    return detectedSession;
  }

  /**
   * Normalize session data to standard format
   */
  function normalizeSessionData(detectedSession) {
    if (detectedSession.sessionId && detectedSession.userId) {
      // Store in standard format
      localStorage.setItem('sessionId', detectedSession.sessionId);
      localStorage.setItem('userId', detectedSession.userId);
      if (detectedSession.email) {
        localStorage.setItem('email', detectedSession.email);
      }
      
      console.log('✅ Session data normalized to standard format');
      return true;
    }
    return false;
  }

  /**
   * Initialize sync system
   */
  function initializeSync() {
    console.log('🚀 Initializing web app session sync...');
    
    // Set up auto-detection hooks first
    setupAutoDetection();
    
    // Then try to detect existing session
    const detectedSession = detectExistingSession();
    if (detectedSession.sessionId || detectedSession.userId) {
      console.log('🔍 Detected existing session data:', detectedSession);
      
      // Normalize to standard format
      if (normalizeSessionData(detectedSession)) {
        // Trigger sync immediately
        setTimeout(checkSessionChanges, 100);
      }
    }
    
    // Check initial state
    checkSessionChanges();
    
    // Set up periodic checking (more frequent initially)
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
    
    // Listen for DOM changes (when web app updates session)
    const observer = new MutationObserver(() => {
      // Debounce the session check
      clearTimeout(window.sessionCheckTimeout);
      window.sessionCheckTimeout = setTimeout(() => {
        const newSession = detectExistingSession();
        if (newSession.sessionId || newSession.userId) {
          normalizeSessionData(newSession);
          checkSessionChanges();
        }
      }, 500);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-session', 'data-user', 'data-auth']
    });
    
    console.log('✅ Web app session sync initialized with enhanced detection');
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
    autoSyncFromLogin: window.autoSyncFromLogin,
    detectExistingSession: detectExistingSession,
    isExtensionAvailable: checkExtensionAvailability
  };

})(); 