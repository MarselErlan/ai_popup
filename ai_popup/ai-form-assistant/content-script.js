/**
 * 🎯 AI Form Assistant - Content Script
 * Enhanced version with improved authentication and field detection
 */

(function () {
  // Use extension icon URL
  const AI_ICON_URL = chrome.runtime.getURL('ai_popup.png');
  const API_BASE_URL = 'http://localhost:8000';

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
      // Get authentication data from extension storage
      const authData = await getAuthenticationData();
      
      if (!authData.sessionId || !authData.userId) {
        currentInput.value = "🔐 Please login through the extension popup first";
        currentInput.disabled = false;
        aiButton.style.display = 'none';
        console.log("❌ Authentication required - user must login through extension");
        return;
      }

      // Prepare field data
      const fieldData = analyzeField(currentInput);
      const requestData = {
        field_type: fieldData.type,
        field_name: fieldData.name,
        field_id: fieldData.id,
        field_class: fieldData.className,
        field_label: fieldData.label,
        field_placeholder: fieldData.placeholder,
        surrounding_text: fieldData.context,
        page_url: window.location.href
      };

      console.log("🧠 Field analysis:", fieldData);
      console.log("📤 Request data:", requestData);
      console.log("🔑 Using session:", authData.sessionId.substring(0, 20) + '...');

      // Make API request
      const response = await fetch(`${API_BASE_URL}/api/generate-field-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Session ${authData.sessionId}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.log("🚨 API error:", response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          currentInput.value = "🔐 Session expired - please login again";
          // Clear invalid session
          chrome.storage.local.remove(['sessionId', 'userId']);
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      if (data.answer) {
        currentInput.value = data.answer;
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
      chrome.storage.local.get(['sessionId', 'userId', 'email'], (result) => {
        console.log("🔐 Auth data from storage:", {
          sessionId: result.sessionId ? '✅ Found' : '❌ Missing',
          userId: result.userId ? '✅ Found' : '❌ Missing',
          email: result.email ? '✅ Found' : '❌ Missing'
        });
        resolve(result);
      });
    });
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

  // Listen for authentication updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'authenticationUpdated') {
      console.log("🔐 Authentication updated notification received");
    }
  });

  // Notify the web page that the extension is loaded
  const notifyExtensionLoaded = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.postMessage({
        type: 'AI_EXTENSION_LOADED',
        source: 'ai-form-assistant'
      }, '*');
      
      // Also set a global variable that the web app can check
      window.aiFormAssistantExtension = {
        version: '2.0.0',
        loaded: true,
        checkAuth: async () => {
          const result = await chrome.storage.local.get(['sessionId', 'userId']);
          return !!(result.sessionId && result.userId);
        }
      };
    }
  };

  // Notify on load and periodically
  notifyExtensionLoaded();
  setInterval(notifyExtensionLoaded, 5000); // Notify every 5 seconds

  console.log("🎯 AI Form Assistant content script loaded and ready");
})();