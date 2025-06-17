import { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import PopupInjector from './PopupInjector';
import { authService } from './services/authService';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('user_id');
    const email = localStorage.getItem('user_email');
    
    if (sessionId && userId) {
      setUser({ id: userId, email });
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
