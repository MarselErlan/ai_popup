import { useEffect } from 'react';

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
      
      // Show loading state
      currentInput.value = "🧠 AI is thinking...";
      currentInput.disabled = true;

      try {
        const fieldLabel = getFieldLabel(currentInput);
        const pageUrl = window.location.href;

        const requestData = {
          label: fieldLabel,
          url: pageUrl,
          user_id: "default", // or dynamic user ID later
        };

        console.log("🧠 Detected field:", fieldLabel);
        console.log("📤 SENDING TO BACKEND:", requestData);
        console.log("📤 Question being sent:", `"${fieldLabel}"`);
        console.log("📤 URL:", pageUrl);

        const response = await fetch("http://127.0.0.1:8000/api/generate-field-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
