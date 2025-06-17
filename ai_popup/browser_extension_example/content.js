class AIFormFiller {
  constructor() {
    this.API_BASE_URL = 'http://localhost:8000';
    this.initialize();
  }

  async initialize() {
    // Get session ID from storage
    const { sessionId } = await chrome.storage.local.get(['sessionId']);
    if (!sessionId) {
      console.warn('No session ID found. Please log in.');
      return;
    }

    this.sessionId = sessionId;
    this.setupFieldDetection();
  }

  setupFieldDetection() {
    // Watch for input field focus
    document.addEventListener('focus', (event) => {
      const target = event.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        this.handleFieldFocus(target);
      }
    }, true);
  }

  async handleFieldFocus(field) {
    // Create AI button if not exists
    if (!field.aiButton) {
      const button = document.createElement('button');
      button.innerHTML = '🤖';
      button.className = 'ai-form-assistant-button';
      button.style.cssText = `
        position: absolute;
        left: -30px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        z-index: 10000;
      `;

      // Position the button
      const fieldRect = field.getBoundingClientRect();
      const fieldStyle = window.getComputedStyle(field);
      if (fieldStyle.position === 'static') {
        field.style.position = 'relative';
      }

      // Add click handler
      button.addEventListener('click', () => this.generateFieldAnswer(field));

      // Add button to field
      field.parentNode.insertBefore(button, field);
      field.aiButton = button;
    }
  }

  async generateFieldAnswer(field) {
    try {
      // Get field context
      const context = this.getFieldContext(field);

      // Call API with session authentication
      const response = await fetch(`${this.API_BASE_URL}/api/generate-field-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Session ${this.sessionId}`
        },
        body: JSON.stringify({
          field_type: field.type,
          field_name: field.name,
          field_id: field.id,
          field_class: field.className,
          field_label: context.label,
          field_placeholder: field.placeholder,
          surrounding_text: context.surroundingText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate answer');
      }

      const data = await response.json();
      field.value = data.answer;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));

    } catch (error) {
      console.error('Error generating field answer:', error);
      alert('Failed to generate answer. Please make sure you are logged in and have uploaded your documents.');
    }
  }

  getFieldContext(field) {
    // Get label
    let label = '';
    const labelElement = document.querySelector(`label[for="${field.id}"]`);
    if (labelElement) {
      label = labelElement.textContent.trim();
    }

    // Get surrounding text (within parent container)
    let surroundingText = '';
    const container = field.closest('form') || field.parentElement;
    if (container) {
      surroundingText = container.textContent.trim();
    }

    return {
      label,
      surroundingText
    };
  }
}

// Initialize the form filler
new AIFormFiller(); 