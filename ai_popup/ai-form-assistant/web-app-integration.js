/**
 * 🔄 Web App Integration Script
 * Add this to your web app to automatically sync with browser extension
 */

(function() {
  console.log('🔄 Web App Integration Script loaded');

  /**
   * Call this function after successful login in your web app
   */
  window.notifyExtensionOfLogin = function(sessionData) {
    console.log('🔐 Notifying extension of login:', sessionData);
    
    // Ensure we have the required data
    if (!sessionData || !sessionData.sessionId || !sessionData.userId) {
      console.error('❌ Invalid session data for extension sync:', sessionData);
      return false;
    }
    
    // Store in localStorage (standard format)
    localStorage.setItem('sessionId', sessionData.sessionId);
    localStorage.setItem('userId', sessionData.userId);
    if (sessionData.email) {
      localStorage.setItem('email', sessionData.email);
    }
    
    // If web-app-sync.js is loaded, use its sync function
    if (window.syncSessionWithExtension) {
      window.syncSessionWithExtension(sessionData);
    } else {
      // Manual sync dispatch
      window.dispatchEvent(new CustomEvent('webAppLogin', {
        detail: sessionData
      }));
    }
    
    console.log('✅ Extension notified of login');
    return true;
  };

  /**
   * Call this function after logout in your web app
   */
  window.notifyExtensionOfLogout = function() {
    console.log('🚪 Notifying extension of logout');
    
    // Clear localStorage
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('webAppLogout'));
    
    console.log('✅ Extension notified of logout');
  };

  /**
   * Auto-detect login from common patterns
   */
  function setupLoginDetection() {
    // Pattern 1: Listen for successful API responses
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        if (response.ok) {
          const url = args[0];
          if (typeof url === 'string' && 
              (url.includes('/login') || url.includes('/auth') || url.includes('/signin'))) {
            
            response.clone().json().then(data => {
              console.log('🔍 Detected login API response:', data);
              
              // Try to auto-extract session data
              const sessionData = {
                sessionId: data.sessionId || data.session_id || data.token || data.accessToken,
                userId: data.userId || data.user_id || data.id || data.user?.id,
                email: data.email || data.user?.email
              };
              
              if (sessionData.sessionId && sessionData.userId) {
                console.log('✅ Auto-detected session data from API');
                window.notifyExtensionOfLogin(sessionData);
              }
            }).catch(() => {
              // Not JSON or failed to parse, ignore
            });
          }
        }
        return response;
      });
    };
    
    console.log('✅ Login detection hooks installed');
  }

  /**
   * Integration examples for common frameworks
   */
  window.webAppIntegration = {
    
    // Example 1: Manual integration after login
    afterLogin: function(loginResponse) {
      console.log('🔐 Manual login integration called');
      
      const sessionData = {
        sessionId: loginResponse.sessionId || loginResponse.token,
        userId: loginResponse.userId || loginResponse.user_id,
        email: loginResponse.email
      };
      
      return window.notifyExtensionOfLogin(sessionData);
    },
    
    // Example 2: React integration
    reactLogin: function(user, token) {
      return window.notifyExtensionOfLogin({
        sessionId: token,
        userId: user.id,
        email: user.email
      });
    },
    
    // Example 3: Vue integration
    vueLogin: function(authStore) {
      return window.notifyExtensionOfLogin({
        sessionId: authStore.token,
        userId: authStore.user.id,
        email: authStore.user.email
      });
    },
    
    // Example 4: Angular integration
    angularLogin: function(authService) {
      return window.notifyExtensionOfLogin({
        sessionId: authService.getToken(),
        userId: authService.getCurrentUser().id,
        email: authService.getCurrentUser().email
      });
    },
    
    // Example 5: Check current session
    checkSession: function() {
      const sessionData = {
        sessionId: localStorage.getItem('sessionId'),
        userId: localStorage.getItem('userId'),
        email: localStorage.getItem('email')
      };
      
      if (sessionData.sessionId && sessionData.userId) {
        console.log('✅ Current session found:', sessionData);
        return sessionData;
      } else {
        console.log('❌ No current session');
        return null;
      }
    }
  };

  // Initialize auto-detection
  setupLoginDetection();
  
  console.log('✅ Web App Integration ready');
  console.log('💡 Usage: window.notifyExtensionOfLogin({sessionId, userId, email})');

})(); 