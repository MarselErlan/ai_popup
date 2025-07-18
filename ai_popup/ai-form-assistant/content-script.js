/**
 * 🎯 AI Form Assistant - Content Script
 * Enhanced version with improved authentication, field detection, and text translation
 */

(function () {
  // Use extension icon URL
  const AI_ICON_URL = chrome.runtime.getURL('ai_popup.png');
  const API_BASE_URL = 'https://backendaipopup-production.up.railway.app';

  // ============================================================================
  // 🌐 TRANSLATION FEATURE - Highlight text to translate English → Russian
  // ============================================================================
  
  let translationPopup = null;
  let isTranslationEnabled = true; // Can be toggled via popup

  // Listen for text selection - improved stability
  document.addEventListener('mouseup', async function(event) {
    if (!isTranslationEnabled) return;
    
    // Don't hide popup if clicking on the popup itself
    if (event.target.closest('#ai-translation-popup')) {
      return;
    }
    
    // Small delay to ensure selection is complete
    setTimeout(async () => {
      const selectedText = window.getSelection().toString().trim();
      
      if (selectedText.length > 0) {
        console.log('🔤 Text selected for translation:', selectedText);
        
        // Get selection position for popup placement
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Only proceed if we have a valid selection rectangle
          if (rect.width > 0 && rect.height > 0) {
            await translateAndShowPopup(selectedText, rect);
          }
        }
      }
      // REMOVED: else clause that was hiding popup when no text selected
    }, 100); // 100ms delay for stability
  });

  // Translation function
  async function translateAndShowPopup(text, rect) {
    try {
      console.log('🌐 Translating text:', text);
      
      // Show loading popup first
      showLoadingPopup(text, rect);
      
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          source_language: 'en',
          target_language: 'ru'
        })
      });
      
      const result = await response.json();
      console.log('✅ Translation result:', result);
      
      if (result.status === 'success') {
        showTranslationPopup(result, rect);
      } else {
        showErrorPopup(text, 'Translation service error', rect);
      }
      
    } catch (error) {
      console.error('❌ Translation failed:', error);
      showErrorPopup(text, 'Network error - make sure backend is running', rect);
    }
  }

  // Show loading popup - simplified
  function showLoadingPopup(text, rect) {
    // Remove any existing popup
    const existingPopup = document.getElementById('ai-translation-popup-stable');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    translationPopup = document.createElement('div');
    translationPopup.id = 'ai-translation-popup-stable';
    translationPopup.style.cssText = getPopupBaseStyles(rect);
    
    translationPopup.innerHTML = `
      <div id="ai-drag-header" style="
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        padding: 12px 16px; 
        background: rgba(255,255,255,0.1); 
        border-radius: 10px 10px 0 0; 
        cursor: move;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        user-select: none;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 600; opacity: 0.9; font-size: 13px;">🌐 Translating...</span>
          <div style="display: flex; gap: 4px;">
            <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
            <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
            <div style="width: 4px; height: 4px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
          </div>
        </div>
        <button id="ai-close-btn" style="
          background: rgba(255,255,255,0.2); 
          border: none; 
          color: white; 
          cursor: pointer; 
          font-size: 16px; 
          opacity: 0.8; 
          padding: 4px 8px; 
          margin: 0; 
          border-radius: 4px;
          transition: all 0.2s;
        ">×</button>
      </div>
              <div style="
          padding: 24px; 
          text-align: center; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          flex: 1;
          min-height: 60px;
        ">
          <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
    `;
    
    // Add loading animation
    if (!document.getElementById('ai-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'ai-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(translationPopup);
    
    // Add close button functionality for loading popup
    const loadingCloseBtn = translationPopup.querySelector('#ai-close-btn');
    if (loadingCloseBtn) {
      loadingCloseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        translationPopup.remove();
        translationPopup = null;
        console.log('🗑️ Loading popup closed via X button');
      });
    }
    
    // Make loading popup draggable too
    makeDraggable(translationPopup);
  }

  // Show translation popup - draggable and resizable (SUPER STABLE VERSION)
  function showTranslationPopup(translation, rect) {
    // Remove any existing popup first
    const existingPopup = document.getElementById('ai-translation-popup-stable');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    // Create a completely independent popup with dynamic sizing
    const popup = document.createElement('div');
    popup.id = 'ai-translation-popup-stable';
    popup.style.cssText = getPopupBaseStyles(rect);
    
    // Create draggable header and resizable content
    popup.innerHTML = `
      
        <button id="ai-close-btn" style="
          background: rgba(255,255,255,0.2); 
          border: none; 
          color: white; 
          cursor: pointer; 
          font-size: 16px; 
          opacity: 0.8; 
          padding: 4px 8px; 
          margin: 0; 
          border-radius: 4px;
          transition: all 0.2s;
        ">×</button>
              <div id="ai-content" style="
          padding: 20px 24px; 
          font-size: 14px; 
          font-weight: 500; 
          line-height: 1.5; 
          overflow-wrap: break-word;
          word-wrap: break-word;
          hyphens: auto;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-height: 0;
          box-sizing: border-box;

        ">
        ${translation.translated_text}
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Add close button event listener
    const closeBtn = popup.querySelector('#ai-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        popup.remove();
        console.log('🗑️ Translation popup closed via X button');
      });
      
      // Add hover effect for close button
      closeBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255,255,255,0.3)';
        this.style.opacity = '1';
      });
      
      closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255,255,255,0.2)';
        this.style.opacity = '0.8';
      });
    }
    
    // Make popup draggable
    makeDraggable(popup);
    
    // Update the global reference
    translationPopup = popup;
    
    console.log('✅ Draggable translation popup created - drag to move, resize corner to adjust size');
  }

  // Show error popup - simplified
  function showErrorPopup(text, error, rect) {
    hideTranslationPopup();
    
    translationPopup = document.createElement('div');
    translationPopup.id = 'ai-translation-popup';
    translationPopup.style.cssText = getPopupBaseStyles(rect, '#e74c3c'); // Red background for error
    
    translationPopup.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-weight: 600; opacity: 0.8; font-size: 12px;">❌ Translation Error</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; opacity: 0.8; padding: 0; margin: 0; line-height: 1;">×</button>
      </div>
      <div style="padding: 12px; background: rgba(255,255,255,0.2); border-radius: 6px; font-size: 13px; line-height: 1.4;">
        ${error}
      </div>
    `;
    
    document.body.appendChild(translationPopup);
    
    // No auto-hide - only close with X button or click outside
  }

  // Professional dynamic popup styles - auto-adjusts to content
  function getPopupBaseStyles(rect, bgColor = '#667eea') {
    const gradient = bgColor === '#667eea' 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : `linear-gradient(135deg, ${bgColor} 0%, #c0392b 100%)`;
      
    return `
      position: fixed;
      top: 20px;
      left: 20px;
      background: ${gradient};
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      width: fit-content;
      height: fit-content;
      min-width: 200px;
      max-width: 600px;
      min-height: 80px;
      max-height: none;
      border: 2px solid rgba(255,255,255,0.3);
      backdrop-filter: blur(15px);
      cursor: move;
      user-select: none;
      resize: both;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
  }

  // Hide translation popup - simplified, no animation
  function hideTranslationPopup() {
    if (translationPopup) {
      translationPopup.remove();
      translationPopup = null;
    }
  }

  // Make entire popup draggable - SIMPLIFIED VERSION
  function makeDraggable(popup) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    
    // Make entire popup draggable (except buttons)
    popup.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
      // Don't drag when clicking buttons or content area
      if (e.target.tagName === 'BUTTON' || e.target.id === 'ai-content') return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current position of popup
      const rect = popup.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      popup.style.cursor = 'grabbing';
      
      e.preventDefault(); // Prevent text selection
    }
    
    function dragMove(e) {
      if (isDragging) {
        e.preventDefault();
        
        // Calculate how much mouse has moved
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Calculate new position
        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;
        
        // Keep popup within screen bounds
        const maxX = window.innerWidth - popup.offsetWidth;
        const maxY = window.innerHeight - popup.offsetHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));
        
        // Apply new position
        popup.style.left = newLeft + 'px';
        popup.style.top = newTop + 'px';
      }
    }
    
    function dragEnd() {
      if (isDragging) {
        isDragging = false;
        popup.style.cursor = 'move';
      }
    }
  }

  // Removed click-outside functionality - only X button closes popup

  // Listen for messages from popup to toggle translation
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleTranslation') {
      isTranslationEnabled = request.enabled;
      console.log('🌐 Translation feature:', isTranslationEnabled ? 'enabled' : 'disabled');
      sendResponse({ success: true });
    }
  });

  // Initialize translation state from storage
  chrome.storage.local.get(['translationEnabled'], (result) => {
    isTranslationEnabled = result.translationEnabled !== false; // Default to true
    console.log('🌐 Translation feature initialized:', isTranslationEnabled ? 'enabled' : 'disabled');
  });

  console.log('🌐 AI Translation feature loaded and ready!');

  // ============================================================================
  // 🎯 ORIGINAL FORM FILLING FEATURE
  // ============================================================================

  const aiButton = document.createElement('img');
  aiButton.src = AI_ICON_URL;
  aiButton.style.cssText = `
    position: absolute;
    z-index: 999999;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: none;
    background: transparent;
    border: none;
    outline: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    border-radius: 50%;
    transition: all 0.2s ease;
  `;
  
  // Add hover effect
  aiButton.addEventListener('mouseenter', () => {
    aiButton.style.transform = 'scale(1.1)';
    aiButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  });
  
  aiButton.addEventListener('mouseleave', () => {
    aiButton.style.transform = 'scale(1)';
    aiButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  });
  
  document.body.appendChild(aiButton);

  let currentInput = null;

  // Show AI button when focusing on input fields
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      currentInput = target;
      const rect = target.getBoundingClientRect();
      // Position LEFT side of the input field
      aiButton.style.top = (window.scrollY + rect.top + (rect.height - 32) / 2) + 'px';
      aiButton.style.left = (window.scrollX + rect.left - 40) + 'px';
      aiButton.style.display = 'block';
    } else {
      aiButton.style.display = 'none';
    }
  });

  // Hide AI button when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (e.target !== aiButton && e.target !== currentInput) {
      aiButton.style.display = 'none';
    }
  });

  // Main AI button click handler
  aiButton.addEventListener('click', async () => {
    console.log("🚀 AI Form Assistant - Button clicked!");
    
    if (!currentInput) {
      console.log("❌ No current input found");
      return;
    }

    console.log("✅ Current input found:", currentInput);
    
    // Show loading state
    const originalValue = currentInput.value;
    currentInput.value = "🧠 AI is thinking...";
    currentInput.disabled = true;

    try {
      // Get authentication data with web app sync
      const authData = await syncWithWebApp();
      
      if (!authData.sessionId || !authData.userId) {
        currentInput.value = "🔐 Please login through the extension popup or web app first";
        currentInput.disabled = false;
        aiButton.style.display = 'none';
        console.log("❌ Authentication required - user must login through extension or web app");
        return;
      }

      // Prepare field data
      const fieldData = analyzeField(currentInput);
      const requestData = {
        label: fieldData.label,
        url: window.location.href
      };

      console.log("🧠 Field analysis:", fieldData);
      console.log("📤 Request data:", requestData);
      console.log("🔑 Using session:", authData.sessionId.substring(0, 20) + '...');

      // Make API request
      const response = await fetch(`${API_BASE_URL}/api/generate-field-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authData.sessionId
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.log("🚨 API error:", response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          console.log("🔄 Session expired, attempting to refresh from web app...");
          
          // Try to refresh session from web app
          const refreshed = await refreshSessionFromWebApp();
          if (refreshed) {
            console.log("✅ Session refreshed successfully, retrying request...");
            // Retry the request with fresh session
            const newAuthData = await syncWithWebApp();
            if (newAuthData.sessionId) {
                             // Retry the API call
               const retryResponse = await fetch(`${API_BASE_URL}/api/generate-field-answer`, {
                 method: "POST",
                 headers: {
                   "Content-Type": "application/json",
                   "Authorization": newAuthData.sessionId
                 },
                 body: JSON.stringify(requestData),
               });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.answer) {
                  currentInput.value = (originalValue ? originalValue + ' ' : '') + retryData.answer;
                  console.log("✅ AI Response (after refresh):", {
                    question: fieldData.label,
                    answer: retryData.answer,
                    dataSource: retryData.data_source,
                    reasoning: retryData.reasoning
                  });
                  return;
                }
              }
            }
          }
          
          currentInput.value = "🔐 Session expired - please login again through the web app";
          // Clear invalid session
          chrome.storage.local.remove(['sessionId', 'userId']);
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      if (data.answer) {
        currentInput.value = (originalValue ? originalValue + ' ' : '') + data.answer;
        console.log("✅ AI Response:", {
          question: fieldData.label,
          answer: data.answer,
          dataSource: data.data_source,
          reasoning: data.reasoning
        });
      } else {
        currentInput.value = "⚠️ No answer generated";
      }

    } catch (error) {
      console.error("🚨 Error:", error);
      currentInput.value = "⚠️ Error: " + error.message;
    } finally {
      currentInput.disabled = false;
      aiButton.style.display = 'none';
    }
  });

  // Get authentication data from storage
  async function getAuthenticationData() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(['sessionId', 'userId', 'email'], (result) => {
          if (chrome.runtime.lastError) {
            console.warn("⚠️ Chrome storage error:", chrome.runtime.lastError);
            resolve({});
            return;
          }
          
          console.log("🔐 Auth data from storage:", {
            sessionId: result.sessionId ? '✅ Found' : '❌ Missing',
            userId: result.userId ? '✅ Found' : '❌ Missing',
            email: result.email ? '✅ Found' : '❌ Missing'
          });
          
          resolve({
            sessionId: result.sessionId,
            userId: result.userId,
            email: result.email
          });
        });
      } catch (error) {
        console.error("🚨 Error getting auth data:", error);
        resolve({});
      }
    });
  }

  // NEW: Sync session with web app
  async function syncWithWebApp() {
    console.log("🔄 Attempting to sync session with web app...");
    
    try {
      // Check if we're on the web app domain
      if (window.location.origin === 'http://localhost:5173') {
        console.log("📍 On web app domain, checking for session...");
        
        // Try to get session from web app's localStorage
        const webAppSession = localStorage.getItem('sessionId');
        const webAppUserId = localStorage.getItem('userId');
        const webAppEmail = localStorage.getItem('email');
        
        if (webAppSession && webAppUserId) {
          console.log("✅ Found web app session, syncing to extension...");
          
          // Store in extension storage
          chrome.storage.local.set({
            sessionId: webAppSession,
            userId: webAppUserId,
            email: webAppEmail
          }, () => {
            console.log("✅ Session synced to extension storage");
          });
          
          return {
            sessionId: webAppSession,
            userId: webAppUserId,
            email: webAppEmail
          };
        }
      }
      
      // If not on web app or no web app session, use extension session
      return await getAuthenticationData();
      
    } catch (error) {
      console.error("❌ Error syncing with web app:", error);
      return await getAuthenticationData();
    }
  }

  // NEW: Listen for web app login events
  function setupWebAppSync() {
    // Listen for storage events (when web app updates localStorage)
    window.addEventListener('storage', (event) => {
      if (event.key === 'sessionId' && event.newValue) {
        console.log("🔄 Web app session detected, syncing...");
        syncWithWebApp();
      }
    });
    
    // Listen for custom events from web app
    window.addEventListener('webAppLogin', (event) => {
      console.log("🔄 Web app login event received:", event.detail);
      if (event.detail && event.detail.sessionId) {
        chrome.storage.local.set({
          sessionId: event.detail.sessionId,
          userId: event.detail.userId,
          email: event.detail.email
        }, () => {
          console.log("✅ Session synced from web app event");
        });
      }
    });
    
    // Initial sync check
    syncWithWebApp();
  }

  // Refresh session from web app
  async function refreshSessionFromWebApp() {
    try {
      console.log("🔄 Attempting to refresh session from web app...");
      
      // Send message to page to get fresh session data
      return new Promise((resolve) => {
        // Send request for fresh session
        window.postMessage({
          type: 'REQUEST_FRESH_SESSION',
          source: 'ai-form-assistant-extension'
        }, '*');
        
        // Listen for response
        const handleSessionResponse = (event) => {
          if (event.data?.type === 'FRESH_SESSION_RESPONSE' && event.data?.source === 'ai-form-assistant-webapp') {
            window.removeEventListener('message', handleSessionResponse);
            
            if (event.data.sessionData && event.data.sessionData.sessionId) {
              console.log("✅ Received fresh session from web app");
              
              // Store fresh session in extension storage with correct keys
              chrome.storage.local.set({
                sessionId: event.data.sessionData.sessionId,
                userId: event.data.sessionData.userId,
                email: event.data.sessionData.email
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("❌ Failed to store fresh session:", chrome.runtime.lastError);
                  resolve(false);
                } else {
                  console.log("✅ Fresh session stored successfully");
                  resolve(true);
                }
              });
            } else {
              console.log("❌ No valid session data received from web app");
              resolve(false);
            }
          }
        };
        
        window.addEventListener('message', handleSessionResponse);
        
        // Timeout after 3 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleSessionResponse);
          console.log("⏰ Session refresh timeout - web app may not be available");
          resolve(false);
        }, 3000);
      });
      
    } catch (error) {
      console.error("❌ Session refresh error:", error);
      return false;
    }
  }

  // Enhanced field analysis
  function analyzeField(input) {
    const fieldData = {
      type: input.type || 'text',
      name: input.name || '',
      id: input.id || '',
      className: input.className || '',
      placeholder: input.placeholder || '',
      label: '',
      context: ''
    };

    // Find field label using multiple strategies
    fieldData.label = findFieldLabel(input);
    
    // Get surrounding context
    fieldData.context = getSurroundingContext(input);

    return fieldData;
  }

  // Improved label detection
  function findFieldLabel(input) {
    console.log("🔍 Analyzing field for label...");
    
    // Strategy 1: Label element with 'for' attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label?.textContent?.trim()) {
        const labelText = cleanLabelText(label.textContent);
        console.log("✅ Found label by ID:", labelText);
        return labelText;
      }
    }
    
    // Strategy 2: Parent label element
    let parent = input.parentElement;
    while (parent && parent.tagName !== 'BODY') {
      if (parent.tagName === 'LABEL') {
        const labelText = cleanLabelText(parent.textContent);
        if (labelText && labelText.length > 2) {
          console.log("✅ Found parent label:", labelText);
          return labelText;
        }
      }
      parent = parent.parentElement;
    }
    
    // Strategy 3: Adjacent label elements
    parent = input.parentElement;
    let level = 0;
    while (parent && level < 3) {
      const labels = parent.querySelectorAll('label');
      for (let label of labels) {
        const labelText = cleanLabelText(label.textContent);
        if (labelText && labelText.length > 2 && labelText.length < 100) {
          console.log(`✅ Found adjacent label at level ${level}:`, labelText);
          return labelText;
        }
      }
      parent = parent.parentElement;
      level++;
    }
    
    // Strategy 4: ARIA label
    if (input.getAttribute('aria-label')) {
      const ariaLabel = cleanLabelText(input.getAttribute('aria-label'));
      console.log("✅ Found ARIA label:", ariaLabel);
      return ariaLabel;
    }
    
    // Strategy 5: Placeholder text
    if (input.placeholder?.trim()) {
      const placeholderText = cleanLabelText(input.placeholder);
      console.log("✅ Using placeholder:", placeholderText);
      return placeholderText;
    }
    
    // Strategy 6: Name attribute (formatted)
    if (input.name?.trim()) {
      const nameText = input.name.replace(/[_-]/g, ' ').trim();
      console.log("✅ Using name attribute:", nameText);
      return nameText;
    }

    console.log("❌ No label found, using fallback");
    return 'form field';
  }

  // Get surrounding text context
  function getSurroundingContext(input) {
    const context = [];
    
    // Get text from parent elements
    let parent = input.parentElement;
    let level = 0;
    while (parent && level < 3) {
      const text = parent.textContent?.trim();
      if (text && text.length > 10 && text.length < 500) {
        // Check if text looks like a question or instruction
        if (text.includes('?') || text.includes(':') || text.match(/^[A-Z]/)) {
          context.push(text);
        }
      }
      parent = parent.parentElement;
      level++;
    }
    
    return context.join(' ').substring(0, 300);
  }

  // Clean and normalize label text
  function cleanLabelText(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[*:]+$/g, '') // Remove trailing asterisks and colons
      .trim();
  }

  // Listen for authentication updates and web app login checks
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'authenticationUpdated') {
      console.log("🔐 Authentication updated notification received");
      
      // Immediately update the global variable with current auth status
      updateGlobalAuthStatus();
      
      // Notify the page about auth change
      window.postMessage({
        type: 'EXTENSION_AUTH_UPDATED',
        source: 'ai-form-assistant',
        timestamp: Date.now()
      }, '*');
      
      // Also dispatch custom event
      document.dispatchEvent(new CustomEvent('aiExtensionAuthUpdated', {
        detail: {
          type: 'EXTENSION_AUTH_UPDATED',
          source: 'ai-form-assistant',
          timestamp: Date.now()
        },
        bubbles: true
      }));
    }
    
    if (request.action === 'checkWebAppLogin') {
      console.log("🔍 Checking web app login status...");
      
      // Check if we're on the web app domain
      const isWebApp = window.location.hostname === 'localhost' || 
                      window.location.port === '5173' ||
                      window.location.href.includes('ai-form-assistant');
      
      if (isWebApp) {
        try {
          // Try to get session data from localStorage
          const sessionId = localStorage.getItem('session_id');
          const userId = localStorage.getItem('user_id');
          const email = localStorage.getItem('user_email');
          
          if (sessionId && userId && email) {
            console.log('✅ Web app login detected:', { email, userId: userId.substring(0, 8) + '...' });
            sendResponse({
              isLoggedIn: true,
              sessionId: sessionId,
              userId: userId,
              email: email
            });
          } else {
            console.log('❌ No valid web app login found');
            sendResponse({
              isLoggedIn: false
            });
          }
        } catch (error) {
          console.error('❌ Error checking web app login:', error);
          sendResponse({
            isLoggedIn: false,
            error: error.message
          });
        }
      } else {
        console.log('❌ Not on web app domain');
        sendResponse({
          isLoggedIn: false,
          error: 'Not on web app domain'
        });
      }
      
      return true; // Keep message channel open for async response
    }
  });

  // Listen for messages from page context
  window.addEventListener('message', (event) => {
    // Handle auth check requests from page context
    if (event.data?.type === 'CHECK_EXTENSION_AUTH' && event.data?.source === 'ai-form-assistant-page') {
      console.log('🔐 Received auth check request from page context');
      
      chrome.storage.local.get(['sessionId', 'userId']).then(result => {
        window.postMessage({
          type: 'EXTENSION_AUTH_RESPONSE',
          source: 'ai-form-assistant',
          isLoggedIn: !!(result.sessionId && result.userId)
        }, '*');
      }).catch(error => {
        console.warn('Error checking auth:', error);
        window.postMessage({
          type: 'EXTENSION_AUTH_RESPONSE',
          source: 'ai-form-assistant',
          isLoggedIn: false
        }, '*');
      });
    }
    
    // Handle session refresh requests from extension
    if (event.data?.type === 'REQUEST_FRESH_SESSION' && event.data?.source === 'ai-form-assistant-extension') {
      console.log('🔄 Received session refresh request from extension');
      
      // Check if we're on the web app domain
      const isWebApp = window.location.hostname === 'localhost' || 
                      window.location.port === '5173' ||
                      window.location.href.includes('ai-form-assistant');
      
      if (isWebApp) {
        // Try to get session data from localStorage
        const sessionId = localStorage.getItem('session_id');
        const userId = localStorage.getItem('user_id');
        const email = localStorage.getItem('user_email');
        
        if (sessionId && userId) {
          console.log('✅ Found fresh session in web app localStorage');
          window.postMessage({
            type: 'FRESH_SESSION_RESPONSE',
            source: 'ai-form-assistant-webapp',
            sessionData: {
              sessionId,
              userId,
              email
            }
          }, '*');
        } else {
          console.log('❌ No valid session found in web app localStorage');
          window.postMessage({
            type: 'FRESH_SESSION_RESPONSE',
            source: 'ai-form-assistant-webapp',
            sessionData: null
          }, '*');
        }
      } else {
        console.log('❌ Session refresh request not on web app domain');
        window.postMessage({
          type: 'FRESH_SESSION_RESPONSE',
          source: 'ai-form-assistant-webapp',
          sessionData: null
        }, '*');
      }
    }
  });

  // Track if we've already notified to prevent spam
  let hasNotified = false;
  
  // Notify the web page that the extension is loaded
  const notifyExtensionLoaded = () => {
    console.log('🔍 Extension checking hostname:', window.location.hostname, 'port:', window.location.port);
    
    // Work on localhost, development URLs, and production Railway domain
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === 'aipopup-production.up.railway.app' ||
                         window.location.hostname === 'mpencil.online' ||
                         window.location.hostname === 'www.mpencil.online' ||
                         window.location.port === '5173' ||
                         window.location.port === '3000';
                         
    if (isDevelopment) {
      console.log('✅ Development environment detected - setting up extension communication');
      console.log('🔧 Setting up DOM attributes and global variables...');
      // Only send message once per page load
      if (!hasNotified) {
        // Send postMessage
        window.postMessage({
          type: 'AI_EXTENSION_LOADED',
          source: 'ai-form-assistant',
          timestamp: Date.now()
        }, '*');
        
        // Also dispatch a custom event as backup
        const event = new CustomEvent('aiExtensionLoaded', {
          detail: {
            type: 'AI_EXTENSION_LOADED',
            source: 'ai-form-assistant',
            timestamp: Date.now()
          }
        });
        document.dispatchEvent(event);
        
        hasNotified = true;
        console.log('📡 Extension notification sent via postMessage and custom event');
      }
      
      // SOLUTION: Use DOM events and custom properties instead of script injection
      // This avoids CSP issues while still communicating with page context
      
      // Set custom property on document element (accessible from page context)
      document.documentElement.setAttribute('data-ai-extension-loaded', 'true');
      document.documentElement.setAttribute('data-ai-extension-version', '2.0.0');
      document.documentElement.setAttribute('data-ai-extension-timestamp', Date.now().toString());
      
      // Create a custom event with extension data
      const extensionLoadedEvent = new CustomEvent('aiExtensionLoaded', {
        detail: {
          type: 'AI_EXTENSION_LOADED',
          source: 'ai-form-assistant',
          version: '2.0.0',
          loaded: true,
          timestamp: Date.now()
        },
        bubbles: true
      });
      
      // Dispatch on document to ensure it reaches the page
      document.dispatchEvent(extensionLoadedEvent);
      
      // Also dispatch on window as backup
      window.dispatchEvent(new CustomEvent('aiExtensionWindowLoaded', {
        detail: {
          type: 'AI_EXTENSION_LOADED',
          source: 'ai-form-assistant',
          version: '2.0.0',
          loaded: true,
          timestamp: Date.now()
        }
      }));
      
      console.log('✅ Extension presence marked via DOM attributes and events');
      console.log('📋 DOM attributes set:', {
        loaded: document.documentElement.getAttribute('data-ai-extension-loaded'),
        version: document.documentElement.getAttribute('data-ai-extension-version'),
        timestamp: document.documentElement.getAttribute('data-ai-extension-timestamp')
      });
      
      // Set a marker in storage (with error handling)
      try {
        chrome.storage.local.set({
          extensionId: 'ai-form-assistant',
          lastActivity: Date.now()
        });
      } catch (error) {
        console.warn('Could not set storage marker:', error);
      }
    }
  };

  // Function to update global auth status
  async function updateGlobalAuthStatus() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === 'aipopup-production.up.railway.app' ||
                         window.location.hostname === 'mpencil.online' ||
                         window.location.hostname === 'www.mpencil.online' ||
                         window.location.port === '5173' ||
                         window.location.port === '3000';
                         
    if (isDevelopment) {
      try {
        const result = await chrome.storage.local.get(['sessionId', 'userId', 'email']);
        const isLoggedIn = !!(result.sessionId && result.userId);
        
        console.log('🔄 Updating global auth status:', { isLoggedIn, sessionId: result.sessionId?.substring(0, 8) + '...' });
        
        window.aiFormAssistantExtension = {
          version: '2.0.0',
          loaded: true,
          timestamp: Date.now(),
          isLoggedIn: isLoggedIn,
          sessionId: result.sessionId,
          userId: result.userId,
          email: result.email,
          checkAuth: async () => {
            try {
              const freshResult = await chrome.storage.local.get(['sessionId', 'userId']);
              return !!(freshResult.sessionId && freshResult.userId);
            } catch (error) {
              console.warn('Auth check failed:', error);
              return false;
            }
          }
        };
        
        // Also set DOM attributes for backup detection
        document.documentElement.setAttribute('data-ai-extension-logged-in', isLoggedIn.toString());
        if (isLoggedIn) {
          document.documentElement.setAttribute('data-ai-extension-user-id', result.userId || '');
          document.documentElement.setAttribute('data-ai-extension-email', result.email || '');
        }
        
      } catch (error) {
        console.warn('Error updating global auth status:', error);
        window.aiFormAssistantExtension = {
          version: '2.0.0',
          loaded: true,
          timestamp: Date.now(),
          isLoggedIn: false,
          checkAuth: async () => false
        };
      }
    }
  }

  // Listen for storage changes to update auth status immediately
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && (changes.sessionId || changes.userId)) {
        console.log('🔄 Storage changed, updating auth status');
        updateGlobalAuthStatus();
      }
    });
  }

  // Notify on load and set up periodic refresh
  console.log('🎯 AI Form Assistant content script starting...');
  console.log('📍 Current URL:', window.location.href);
  console.log('🏠 Current hostname:', window.location.hostname);
  
  notifyExtensionLoaded();
  updateGlobalAuthStatus(); // Initial auth status
  
  // Fallback: Always set up basic detection for production domain
  if (window.location.hostname === 'aipopup-production.up.railway.app' || 
      window.location.hostname === 'mpencil.online' ||
      window.location.hostname === 'www.mpencil.online') {
    console.log('🚀 Production domain detected - setting up fallback detection');
    
    // Set DOM attributes immediately
    document.documentElement.setAttribute('data-ai-extension-loaded', 'true');
    document.documentElement.setAttribute('data-ai-extension-version', '2.0.0');
    document.documentElement.setAttribute('data-ai-extension-timestamp', Date.now().toString());
    
    // Set global variable
    window.aiFormAssistantExtension = {
      version: '2.0.0',
      loaded: true,
      timestamp: Date.now(),
      isLoggedIn: false,
      checkAuth: async () => {
        try {
          const result = await chrome.storage.local.get(['sessionId', 'userId']);
          return !!(result.sessionId && result.userId);
        } catch (error) {
          console.warn('Auth check failed:', error);
          return false;
        }
      }
    };
    
    console.log('✅ Fallback detection setup complete for production domain');
  }
  
  // Refresh global variable and auth status every 10 seconds
  setInterval(() => {
    updateGlobalAuthStatus();
  }, 10000);

  // NEW: Listen for web app login events
  setupWebAppSync();

  console.log("🎯 AI Form Assistant content script loaded and ready");
})();