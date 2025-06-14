(function () {
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
      console.log("🚀 NEW CODE RUNNING - Button clicked!"); // Test if new code is loaded
      if (!currentInput) return;
  
      // Show loading state
      const originalValue = currentInput.value;
      currentInput.value = "🧠 AI is thinking...";
      currentInput.disabled = true;

      try {
        const fieldLabel = getFieldLabel(currentInput);
        const pageUrl = window.location.href;

                console.log("🧠 Detected field:", fieldLabel);
        
        const requestData = {
          label: fieldLabel,
          url: pageUrl,
          user_id: "default", // or dynamic user ID later
        };
        
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
        console.log("🧠 Filled with:", data);
      } catch (err) {
        console.error("🚨 Backend call failed:", err);
        currentInput.value = "⚠️ Error getting answer";
      } finally {
        currentInput.disabled = false;
        aiButton.style.display = 'none';
      }
    });
  
        function getFieldLabel(inputEl) {
      console.log("🔍 Looking for closest <label> element...");
      
      // 1. First try to find label by ID association
      const id = inputEl.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) {
          const labelContent = label.innerHTML.trim();
          const labelText = label.textContent.trim().replace(/\s+/g, ' ');
          console.log("✅ Found label by ID - HTML:", labelContent);
          console.log("✅ Found label by ID - Text:", labelText);
          return labelText;
        }
      }
      
      // 2. Search UP the DOM tree to find closest label element
      let current = inputEl;
      let level = 0;
      while (current && level < 15) {
        // Check if current element has any label elements
        const labels = current.querySelectorAll('label');
        if (labels.length > 0) {
          // Get the closest/first label
          const closestLabel = labels[0];
          const labelContent = closestLabel.innerHTML.trim();
          const labelText = closestLabel.textContent.trim().replace(/\s+/g, ' ');
          console.log(`✅ Found closest label at level ${level} - HTML:`, labelContent);
          console.log(`✅ Found closest label at level ${level} - Text:`, labelText);
          return labelText;
        }
        
        // Move to parent element
        current = current.parentElement;
        level++;
      }
      
      // 3. Search for any label in nearby DOM structure
      let parent = inputEl.parentElement;
      while (parent) {
        const allLabels = parent.getElementsByTagName('label');
        if (allLabels.length > 0) {
          for (let label of allLabels) {
            const labelText = label.textContent.trim().replace(/\s+/g, ' ');
            if (labelText && labelText.length > 3) {
              console.log("✅ Found nearby label:", labelText);
              return labelText;
            }
          }
        }
        parent = parent.parentElement;
      }
      
      console.log("❌ No <label> element found, using placeholder:", inputEl.placeholder);
      return inputEl.placeholder || 'unknown field';
    }
  })();
  