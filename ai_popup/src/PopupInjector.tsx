import { useEffect } from 'react';

const AI_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Iconic_AI_logo.svg';

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
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(aiButton);

    let currentInput: HTMLInputElement | HTMLTextAreaElement | null = null;

    const onClickInput = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        currentInput = target as HTMLInputElement;
        const rect = currentInput.getBoundingClientRect();
        aiButton.style.top = `${window.scrollY + rect.top}px`;
        aiButton.style.left = `${window.scrollX + rect.right + 10}px`;
        aiButton.style.display = 'block';
      } else {
        aiButton.style.display = 'none';
      }
    };

    const onClickAI = async () => {
      if (!currentInput) return;

      // Show loading state
      const originalValue = currentInput.value;
      currentInput.value = "🧠 AI is thinking...";
      currentInput.disabled = true;

      try {
        const fieldLabel = getFieldLabel(currentInput);
        const pageUrl = window.location.href;

        console.log("🧠 Detected field:", fieldLabel);

        const response = await fetch("http://127.0.0.1:8000/api/generate-field-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: fieldLabel,
            url: pageUrl,
            user_id: "default", // or dynamic user ID later
          }),
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
  if (input.placeholder) return input.placeholder;

  const id = input.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || '';
  }

  let parent = input.parentElement;
  while (parent) {
    const text = parent.innerText?.trim();
    if (text && text.length < 100) return text;
    parent = parent.parentElement;
  }

  return "unknown field";
}
