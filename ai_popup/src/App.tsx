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

  // Show login/signup page when user is not authenticated
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {showSignup ? (
            <Signup onSignup={handleSignup} onSwitchToLogin={switchToLogin} />
          ) : (
            <Login onLogin={handleLogin} onSwitchToSignup={switchToSignup} />
          )}
        </div>
      </div>
    );
  }

  // Show dashboard when user is authenticated
  return (
    <>
      <Dashboard user={user} onLogout={handleLogout} />
      <PopupInjector />
    </>
  );
};

export default App;
