import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [resumeLoading, setResumeLoading] = useState(false);
  const [personalInfoLoading, setPersonalInfoLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [documentsStatus, setDocumentsStatus] = useState<any>(null);

  // Load documents status on component mount
  useEffect(() => {
    loadDocumentsStatus();
  }, [user]);

  const loadDocumentsStatus = async () => {
    setStatusLoading(true);
    try {
      const status = await authService.getDocumentsStatus(user?.id || 'default');
      setDocumentsStatus(status);
    } catch (error: any) {
      console.error('Failed to load documents status:', error);
      setActionStatus({ 
        type: 'error', 
        message: 'Failed to load documents status' 
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResumeReembed = async () => {
    setResumeLoading(true);
    setActionStatus(null);

    try {
      const response = await authService.reembedResume(user?.id || 'default');
      setActionStatus({ 
        type: 'success', 
        message: response.message || 'Resume re-embedded successfully!' 
      });
      // Reload status after successful reembed
      await loadDocumentsStatus();
    } catch (error: any) {
      setActionStatus({ 
        type: 'error', 
        message: error.message || 'Failed to re-embed resume' 
      });
    } finally {
      setResumeLoading(false);
    }
  };

  const handlePersonalInfoReembed = async () => {
    setPersonalInfoLoading(true);
    setActionStatus(null);

    try {
      const response = await authService.reembedPersonalInfo(user?.id || 'default');
      setActionStatus({ 
        type: 'success', 
        message: response.message || 'Personal info re-embedded successfully!' 
      });
      // Reload status after successful reembed
      await loadDocumentsStatus();
    } catch (error: any) {
      setActionStatus({ 
        type: 'error', 
        message: error.message || 'Failed to re-embed personal info' 
      });
    } finally {
      setPersonalInfoLoading(false);
    }
  };

  const downloadExtension = () => {
    // Create a zip file download or redirect to extension files
    const link = document.createElement('a');
    link.href = '/ai-popup-extension.zip'; // You'll need to create this zip file
    link.download = 'ai-popup-extension.zip';
    link.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1rem 2rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/ai_popup.png" alt="AI Logo" style={{ width: '40px', height: '40px' }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>AI Form Assistant</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280' }}>Welcome, {user?.email || 'User'}</span>
            <button
              onClick={onLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Status Messages */}
        {actionStatus && (
          <div style={{
            background: actionStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: actionStatus.type === 'success' ? '#166534' : '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: `1px solid ${actionStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {actionStatus.message}
          </div>
        )}

        {/* Documents Status Section */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>
              📊 Documents Status
            </h2>
            <button
              onClick={loadDocumentsStatus}
              disabled={statusLoading}
              style={{
                padding: '0.5rem 1rem',
                background: statusLoading ? '#9ca3af' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: statusLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {statusLoading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>
          
          {documentsStatus ? (
            <div style={{ 
              background: '#f9fafb', 
              padding: '1.5rem', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(documentsStatus, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
              {statusLoading ? 'Loading documents status...' : 'Click refresh to load documents status'}
            </div>
          )}
        </section>

        {/* Extension Setup Section */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
            🚀 Extension Setup
          </h2>
          
          <div style={{ 
            background: '#f3f4f6', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>How to Install:</h3>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
              <li style={{ marginBottom: '0.5rem' }}>Download the extension file below</li>
              <li style={{ marginBottom: '0.5rem' }}>Open Chrome and go to chrome://extensions/</li>
              <li style={{ marginBottom: '0.5rem' }}>Enable "Developer mode" (top right toggle)</li>
              <li style={{ marginBottom: '0.5rem' }}>Click "Load unpacked" and select the extracted folder</li>
              <li style={{ marginBottom: '0.5rem' }}>The AI brain icon will appear next to form fields!</li>
            </ol>
          </div>

          <button
            onClick={downloadExtension}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1rem 2rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📥 Download Extension
          </button>
        </section>

        {/* Vector Database Management Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Resume Re-embed */}
          <section style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
              📄 Resume Vector Database
            </h2>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Re-embed your resume data from the database to update the AI's knowledge base.
            </p>
            
            <button
              onClick={handleResumeReembed}
              disabled={resumeLoading}
              style={{
                width: '100%',
                background: resumeLoading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '1rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: resumeLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {resumeLoading ? (
                <>⏳ Re-embedding Resume...</>
              ) : (
                <>🔄 Re-embed Resume</>
              )}
            </button>
          </section>

          {/* Personal Info Re-embed */}
          <section style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
              👤 Personal Info Vector Database
            </h2>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Re-embed your personal information from the database to update the AI's knowledge base.
            </p>
            
            <button
              onClick={handlePersonalInfoReembed}
              disabled={personalInfoLoading}
              style={{
                width: '100%',
                background: personalInfoLoading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: personalInfoLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {personalInfoLoading ? (
                <>⏳ Re-embedding Personal Info...</>
              ) : (
                <>🔄 Re-embed Personal Info</>
              )}
            </button>
          </section>
        </div>

        {/* Usage Instructions */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginTop: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
            💡 How It Works
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>AI-Powered</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Uses your resume and personal info to intelligently fill form fields
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Fast & Accurate</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Vector database ensures quick and contextually relevant answers
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Secure</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Your data stays in your database and is processed locally
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard; 