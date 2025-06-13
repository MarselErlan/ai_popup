(function () {
    const AI_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Iconic_AI_logo.svg';
  
    const aiButton = document.createElement('img');
    aiButton.src = AI_ICON_URL;
    aiButton.style.cssText = `
      position: absolute;
      z-index: 999999;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: none;
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(aiButton);
  
    let currentInput = null;
  
    document.addEventListener('focusin', (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        currentInput = target;
        const rect = target.getBoundingClientRect();
        aiButton.style.top = window.scrollY + rect.top + 'px';
        aiButton.style.left = window.scrollX + rect.right + 10 + 'px';
        aiButton.style.display = 'block';
      } else {
        aiButton.style.display = 'none';
      }
    });
  
    aiButton.addEventListener('click', () => {
      if (!currentInput) return;
  
      const label = getFieldLabel(currentInput);
      currentInput.value = 'AI: ' + label;
      aiButton.style.display = 'none';
    });
  
    function getFieldLabel(inputEl) {
      if (inputEl.placeholder) return inputEl.placeholder;
  
      const id = inputEl.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent.trim();
      }
  
      let parent = inputEl.parentElement;
      while (parent) {
        const text = parent.innerText?.trim();
        if (text && text.length < 100) return text;
        parent = parent.parentElement;
      }
  
      return 'unknown field';
    }
  })();
  