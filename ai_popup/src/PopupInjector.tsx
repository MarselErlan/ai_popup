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

      const label = getInputContext(currentInput);
      console.log("🧠 Detected:", label);

      currentInput.value = `AI: ${label}`;
      aiButton.style.display = 'none';
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

function getInputContext(input: HTMLInputElement | HTMLTextAreaElement): string {
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
