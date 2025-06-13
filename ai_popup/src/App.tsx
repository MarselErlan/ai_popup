import { useState } from 'react';
import PopupInjector from './PopupInjector';

function App() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🧠 AI Form Assistant</h1>
      <p>This is a simple AI popup injector project.</p>
      <button
        onClick={() => {
          alert('clicked');
          setEnabled(true);
        }}
        style={{
          padding: '10px',
          marginTop: '10px',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Enable AI Assistant
      </button>

      <div style={{ marginTop: '2rem' }}>
        <label htmlFor="name">Your Name:</label><br />
        <input id="name" type="text" placeholder="Enter your name" style={{ padding: '8px', marginTop: '4px', width: '300px' }} />
      </div>

      {enabled && <PopupInjector />}
    </div>
  );
}

export default App;
