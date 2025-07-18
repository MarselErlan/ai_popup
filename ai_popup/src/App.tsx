import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import PopupInjector from './PopupInjector';
import { authService } from './services/authService';
import './App.css';

interface User {
  id: string;
  email: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // Redirect from root domain to www subdomain for custom domain
    const hostname = window.location.hostname;
    if (hostname === 'mpencil.online' && !window.location.hostname.startsWith('www.')) {
      const newUrl = `https://www.mpencil.online${window.location.pathname}${window.location.search}`;
      window.location.href = newUrl;
      return;
    }

    // Check if user is already logged in
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('user_id');
    const email = localStorage.getItem('user_email');
    
    if (sessionId && userId) {
      setUser({ id: userId, email: email || '' });
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: { userId: string; email: string }) => {
    setUser({ id: userData.userId, email: userData.email });
    setShowSignup(false);
  };

  const handleSignup = (userData: { userId: string; email: string }) => {
    setUser({ id: userData.userId, email: userData.email });
    setShowSignup(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout(); // This will handle both API call and storage cleanup
      setUser(null);
      setShowSignup(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, we still want to clear the local state
      setUser(null);
      setShowSignup(false);
    }
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Always render Dashboard in background */}
      <Dashboard user={user} onLogout={handleLogout} />
      <PopupInjector />

      {/* Auth Forms as Overlays when user is not authenticated */}
      {!user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            {showSignup ? (
              <Signup onSignup={handleSignup} onSwitchToLogin={switchToLogin} />
            ) : (
              <Login onLogin={handleLogin} onSwitchToSignup={switchToSignup} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default App;
