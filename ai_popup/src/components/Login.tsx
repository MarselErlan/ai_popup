import React, { useState } from 'react';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (userData: { userId: string; email: string }) => void;
  onSwitchToSignup: () => void;
}

const Login = ({ onLogin, onSwitchToSignup }: LoginProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Secure demo login function - uses environment variables from Railway
  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Get demo credentials from Railway environment variables
      const demoEmail = import.meta.env.VITE_DEMO_EMAIL || 'ethanabduraimov@gmail.com';
      const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
      
      if (!demoPassword) {
        setError('Demo credentials not configured. Please contact administrator.');
        setLoading(false);
        return;
      }

      const { userId, email, sessionId } = await authService.login({
        email: demoEmail,
        password: demoPassword
      });
      
      // Store authentication data
      localStorage.setItem('session_id', sessionId);
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_email', email);
      
      // Also store in browser extension storage if available
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          await (window as any).chrome.storage.local.set({
            session_id: sessionId,
            user_id: userId,
            user_email: email
          });
        } catch (e) {
          console.log('Chrome storage not available:', e);
        }
      }
      
      onLogin({ userId, email });
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { userId, email, sessionId } = await authService.login({
        email: formData.email,
        password: formData.password
      });
      
      // Store authentication data
      localStorage.setItem('session_id', sessionId);
      localStorage.setItem('user_id', userId);
      localStorage.setItem('user_email', email);
      
      // Also store in browser extension storage if available
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          await (window as any).chrome.storage.local.set({
            session_id: sessionId,
            user_id: userId,
            user_email: email
          });
        } catch (e) {
          console.log('Chrome storage not available:', e);
        }
      }
      
      onLogin({ userId, email });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="./ai_popup.png" 
            alt="AI Logo" 
            style={{ width: '64px', height: '64px', marginBottom: '1rem' }} 
          />
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '2rem', 
            color: '#1f2937',
            fontWeight: 'bold'
          }}>
            AI Form Assistant
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: '1rem'
          }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '0.875rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '0.875rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Signing in...' : '🚀 Demo Login'}
          </button>

          <button
            type="button"
            onClick={onSwitchToSignup}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#667eea',
              padding: '0.5rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Don't have an account? Sign up
          </button>
        </form>

        {/* Demo credentials info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>Demo Account:</p>
          <p style={{ margin: 0 }}>Email: {import.meta.env.VITE_DEMO_EMAIL || 'ethanabduraimov@gmail.com'}</p>
          <p style={{ margin: 0 }}>Password: [Securely stored in Railway variables]</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            Click "Demo Login" button above to sign in automatically
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 