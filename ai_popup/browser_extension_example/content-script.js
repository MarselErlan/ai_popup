/**
 * 🎯 AI Form Assistant - Content Script
 * Matches the functionality of PopupInjector.tsx with authentication
 */

(function () {
  // Use extension icon URL
  const AI_ICON_URL = chrome.runtime.getURL('ai_popup.png');

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
    box-shadow: none;
  `;
  document.body.appendChild(aiButton);

  let currentInput = null;

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

  aiButton.addEventListener('click', async () => {
    console.log("🚀 AI button clicked!");
    if (!currentInput) {
      console.log("❌ No current input found");
      return;
    }

    console.log("✅ Current input found:", currentInput);
    
    // Show loading state
    currentInput.value = "🧠 AI is thinking...";
    currentInput.disabled = true;

    try {
      const fieldLabel = getFieldLabel(currentInput);
      const pageUrl = window.location.href;

      // Get authentication token from extension storage
      let token = null;
      try {
        const result = await chrome.storage.local.get('token');
        token = result.token;
        console.log("🔐 Token from storage:", token ? "✅ Found" : "❌ Not found");
      } catch (err) {
        console.log("⚠️ Could not access extension storage:", err);
      }

      const requestData = {
        label: fieldLabel,
        url: pageUrl,
        user_id: "default", // Will be extracted from token by backend
      };

      console.log("🧠 Detected field:", fieldLabel);
      console.log("📤 SENDING TO BACKEND:", requestData);
      console.log("📤 Question being sent:", `"${fieldLabel}"`);
      console.log("📤 URL:", pageUrl);
      console.log("🔑 Token being sent:", token ? `${token.substring(0, 30)}...` : "❌ NO TOKEN");

      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("✅ Authorization header added");
      } else {
        console.log("❌ No token found - request may fail with 403");
      }

      const response = await fetch("http://localhost:8000/api/generate-field-answer", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.log("🚨 Backend error response:", errorText);
        console.log("🚨 Response status:", response.status);
        
        if (response.status === 403) {
          currentInput.value = "🔐 Please login to use AI assistant";
          console.log("🔐 Authentication required - please login through extension popup");
        } else {
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      currentInput.value = data.answer || "⚠️ No answer returned";
      
      console.log("✅ AI Response received:", data);
      console.log("🎯 Question asked:", `"${fieldLabel}"`);
      console.log("💡 Answer provided:", `"${data.answer}"`);
      console.log("📊 Data source:", data.data_source);
      console.log("🤔 AI reasoning:", data.reasoning);
    } catch (err) {
      console.error("🚨 Backend call failed:", err);
      currentInput.value = "⚠️ Error getting answer";
    } finally {
      currentInput.disabled = false;
      aiButton.style.display = 'none';
    }
  });

  function getFieldLabel(input) {
    console.log("🔍 Looking for closest label...");
    
    // 1. First try to find label by ID association
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label && label.textContent?.trim()) {
        const labelText = label.textContent.trim().replace(/\s+/g, ' ');
        console.log("✅ Found label by ID:", labelText);
        return labelText;
      }
    }
    
    // 2. Search for closest label element in parent hierarchy
    let parent = input.parentElement;
    let level = 0;
    while (parent && level < 10) {
      // Look for any label element within this parent
      const labels = parent.querySelectorAll('label');
      if (labels.length > 0) {
        for (let label of labels) {
          const labelText = label.textContent?.trim().replace(/\s+/g, ' ');
          if (labelText && labelText.length > 3 && labelText.length < 500) {
            console.log(`✅ Found label at level ${level}:`, labelText);
            return labelText;
          }
        }
      }
      
      parent = parent.parentElement;
      level++;
    }
    
    // 3. Look for text content in immediate parent that looks like a question
    parent = input.parentElement;
    level = 0;
    while (parent && level < 5) {
      const text = parent.textContent?.trim();
      if (text) {
        const cleanText = text.replace(/\s+/g, ' ').trim();
        // Check if it looks like a question or form field label
        if (cleanText.includes('?') || cleanText.match(/^[A-Z][^.]*:?\s*$/)) {
          if (cleanText.length > 10 && cleanText.length < 300) {
            console.log(`✅ Found question-like text at level ${level}:`, cleanText);
            return cleanText;
          }
        }
      }
      parent = parent.parentElement;
      level++;
    }
    
    // 4. Check for aria-label
    if (input.getAttribute('aria-label')) {
      const ariaLabel = input.getAttribute('aria-label').trim();
      console.log("✅ Found aria-label:", ariaLabel);
      return ariaLabel;
    }
    
    // 5. Check name attribute
    if (input.name && input.name.trim()) {
      const nameLabel = input.name.replace(/[_-]/g, ' ').trim();
      console.log("✅ Found name attribute:", nameLabel);
      return nameLabel;
    }
    
    console.log("❌ No label found, using placeholder:", input.placeholder);
    return input.placeholder || "unknown field";
  }

  // Listen for authentication updates from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'authenticationUpdated') {
      console.log("🔐 Authentication updated, token available for future requests");
    }
  });

  console.log("🎯 AI Form Assistant content script loaded");
  console.log("🔧 Ready to assist with form filling");
})();