import { useEffect } from 'react';
import { authService } from './services/authService';

const AI_ICON_URL = '/ai_popup.png';

export default function PopupInjector() {
  useEffect(() => {
    const aiButton = document.createElement('img');
    aiButton.src = AI_ICON_URL;
    aiButton.style.cssText = `
      position: absolute;
      z-index: 9999;
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

    let currentInput: HTMLInputElement | HTMLTextAreaElement | null = null;

    const onClickInput = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        currentInput = target as HTMLInputElement;
        const rect = currentInput.getBoundingClientRect();
        // Position LEFT side of the input field
        aiButton.style.top = `${window.scrollY + rect.top + (rect.height - 32) / 2}px`;
        aiButton.style.left = `${window.scrollX + rect.left - 40}px`;
        aiButton.style.display = 'block';
      } else {
        aiButton.style.display = 'none';
      }
    };

    const onClickAI = async () => {
      console.log("🚀 AI button clicked!"); // Test log
      if (!currentInput) {
        console.log("❌ No current input found");
        return;
      }

      console.log("✅ Current input found:", currentInput);
      
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        currentInput.value = "⚠️ Please login first";
        console.log("❌ User not authenticated");
        return;
      }

      const user = authService.getCurrentUser();
      if (!user) {
        currentInput.value = "⚠️ User information not found";
        console.log("❌ User information not found");
        return;
      }
      
      // Show loading state
      currentInput.value = "🧠 AI is thinking...";
      currentInput.disabled = true;

      try {
        const fieldLabel = getFieldLabel(currentInput);
        const pageUrl = window.location.href;

        console.log("🧠 Detected field:", fieldLabel);
        console.log("📤 Question being sent:", `"${fieldLabel}"`);
        console.log("📤 URL:", pageUrl);
        console.log("👤 User ID:", user.id);

        // Use the authService method which handles authentication automatically
        const data = await authService.generateFieldAnswer(fieldLabel, pageUrl, user.id);
        
        currentInput.value = data.answer || "⚠️ No answer returned";
        
        console.log("✅ AI Response received:", data);
        console.log("🎯 Question asked:", `"${fieldLabel}"`);
        console.log("💡 Answer provided:", `"${data.answer}"`);
        console.log("📊 Data source:", data.data_source);
        console.log("🤔 AI reasoning:", data.reasoning);
        
      } catch (err: any) {
        console.error("🚨 Backend call failed:", err);
        
        // Handle specific error cases
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          currentInput.value = "⚠️ Authentication expired - please login";
        } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
          currentInput.value = "⚠️ Access denied - check permissions";
        } else if (err.message?.includes('404')) {
          currentInput.value = "⚠️ API endpoint not found";
        } else if (err.message?.includes('500')) {
          currentInput.value = "⚠️ Server error - try again later";
        } else {
          currentInput.value = "⚠️ Error getting answer";
        }
        
      } finally {
        currentInput.disabled = false;
        aiButton.style.display = 'none';
      }
    };

    document.addEventListener('focusin', onClickInput);
    aiButton.addEventListener('click', onClickAI);

    return () => {
      aiButton.remove();
      document.removeEventListener('focusin', onClickInput);
    };
  }, []);

  return null;
}

function getFieldLabel(input: HTMLInputElement | HTMLTextAreaElement): string {
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
  
  console.log("❌ No label found, using placeholder:", input.placeholder);
  return input.placeholder || "unknown field";
}
