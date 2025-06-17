import { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import PopupInjector from './PopupInjector';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setShowSignup(false); // Reset to login view
  };

  const handleSignup = (userData: any) => {
    setUser(userData);
    setShowSignup(false); // Reset to login view
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Also clear browser extension storage if available
    if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
      try {
        (window as any).chrome.storage.local.remove(['token', 'user']);
      } catch (e) {
        console.log('Chrome storage not available:', e);
      }
    }
    
    setUser(null);
    setShowSignup(false);
  };

  const switchToSignup = () => {
    setShowSignup(true);
  };

  const switchToLogin = () => {
    setShowSignup(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/ai_popup.png" 
            alt="AI Logo" 
            style={{ width: '48px', height: '48px', marginBottom: '1rem' }} 
          />
          <div style={{ color: '#6b7280' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <Dashboard user={user} onLogout={handleLogout} />
        <PopupInjector />
      </>
    );
  }

  if (showSignup) {
    return (
      <Signup 
        onSignup={handleSignup} 
        onSwitchToLogin={switchToLogin} 
      />
    );
  }

  return (
    <Login 
      onLogin={handleLogin} 
      onSwitchToSignup={switchToSignup} 
    />
  );
}

export default App;
