import React, { useEffect } from 'react';

const PopupInjector: React.FC = () => {
  useEffect(() => {
    const injectPopup = async () => {
      try {
        // Get session data
        const sessionId = localStorage.getItem('session_id');
        const userId = localStorage.getItem('user_id');
        
        if (!sessionId || !userId) {
          console.warn('No session data found');
          return;
        }

        // Create popup button
        const button = document.createElement('button');
        button.innerHTML = '🤖';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.padding = '10px';
        button.style.fontSize = '24px';
        button.style.borderRadius = '50%';
        button.style.border = 'none';
        button.style.backgroundColor = '#4f46e5';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.transition = 'transform 0.2s';
        button.title = 'AI Form Assistant';

        // Add hover effect
        button.addEventListener('mouseover', () => {
          button.style.transform = 'scale(1.1)';
        });
        button.addEventListener('mouseout', () => {
          button.style.transform = 'scale(1)';
        });

        // Add click handler
        button.addEventListener('click', async () => {
          try {
            const response = await fetch('https://backendaipopup-production.up.railway.app/api/generate-field-answer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Session ${sessionId}`
              },
              body: JSON.stringify({
                user_id: userId,
                url: window.location.href,
                label: 'Test field'
              })
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('AI response:', data);
          } catch (error) {
            console.error('Error calling AI service:', error);
          }
        });

        // Add to page
        document.body.appendChild(button);

        return () => {
          document.body.removeChild(button);
        };
      } catch (error) {
        console.error('Error injecting popup:', error);
      }
    };

    injectPopup();
  }, []);

  return null;
};

export default PopupInjector;
