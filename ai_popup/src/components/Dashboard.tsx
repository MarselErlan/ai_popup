import { useState, useRef, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
}

interface DocumentStatus {
  resume_uploaded: boolean;
  personal_info_uploaded: boolean;
}

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [resumeLoading, setResumeLoading] = useState(false);
  const [personalInfoLoading, setPersonalInfoLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState({ resume: false, personalInfo: false });
  const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [documentsStatus, setDocumentsStatus] = useState<DocumentStatus | null>(null);
  const [extensionInstalled, setExtensionInstalled] = useState<boolean>(false);
  const [extensionLoggedIn, setExtensionLoggedIn] = useState<boolean>(false);
  const [extensionLoginLoading, setExtensionLoginLoading] = useState<boolean>(false);
  const [extensionDetectedOnce, setExtensionDetectedOnce] = useState<boolean>(false);
  
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const personalInfoFileRef = useRef<HTMLInputElement>(null);

  // Load documents status and check extension on component mount
  useEffect(() => {
    loadDocumentsStatus();
    
    // Initial check - but don't be too eager
    setTimeout(checkExtensionStatus, 1000);
    
    // Listen for extension messages (but only act on first one)
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AI_EXTENSION_LOADED' && event.data?.source === 'ai-form-assistant') {
        console.log('🎉 Extension detected via postMessage!', event.data);
        if (!extensionDetectedOnce) {
          setExtensionInstalled(true);
          setExtensionDetectedOnce(true);
          console.log('📱 Extension status updated via postMessage');
          checkExtensionAuthStatus();
        }
      }
    };
    
    // Listen for custom events as backup
    const handleExtensionEvent = (event: CustomEvent) => {
      if (event.detail?.type === 'AI_EXTENSION_LOADED' && event.detail?.source === 'ai-form-assistant') {
        console.log('🎉 Extension detected via custom event!', event.detail);
        if (!extensionDetectedOnce) {
          setExtensionInstalled(true);
          setExtensionDetectedOnce(true);
          console.log('📱 Extension status updated via custom event');
          checkExtensionAuthStatus();
        }
      }
    };
    
    window.addEventListener('message', handleExtensionMessage);
    document.addEventListener('aiExtensionLoaded', handleExtensionEvent as EventListener);
    
    // Check periodically for extension (very infrequently to avoid loops)
    const intervalId = setInterval(() => {
      // Only check if we haven't detected the extension yet
      if (!extensionDetectedOnce) {
        checkExtensionStatus();
      } else if (extensionInstalled) {
        // If extension is detected, just check auth status occasionally
        checkExtensionAuthStatus();
      }
    }, 15000); // Very infrequent checks to avoid loops
    
    return () => {
      window.removeEventListener('message', handleExtensionMessage);
      document.removeEventListener('aiExtensionLoaded', handleExtensionEvent as EventListener);
      clearInterval(intervalId);
    };
  }, [user]);

  const loadDocumentsStatus = async () => {
    setStatusLoading(true);
    try {
      const status = await authService.getDocumentsStatus();
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

  const handleFileUpload = async (file: File, type: 'resume' | 'personalInfo') => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      setActionStatus({
        type: 'error',
        message: 'Please upload a PDF, DOC, DOCX, or TXT file'
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setActionStatus({
        type: 'error',
        message: 'File size must be less than 10MB'
      });
      return;
    }

    setUploadLoading(prev => ({ ...prev, [type]: true }));
    setActionStatus(null);

    try {
      if (type === 'resume') {
        await authService.uploadResume(file);
        setActionStatus({
          type: 'success',
          message: 'Resume uploaded successfully!'
        });
      } else {
        await authService.uploadPersonalInfo(file);
        setActionStatus({
          type: 'success',
          message: 'Personal info uploaded successfully!'
        });
      }
      
      // Reload status after successful upload
      await loadDocumentsStatus();
    } catch (error: any) {
      setActionStatus({
        type: 'error',
        message: error.message || `Failed to upload ${type === 'resume' ? 'resume' : 'personal info'}`
      });
    } finally {
      setUploadLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleResumeReembed = async () => {
    setResumeLoading(true);
    setActionStatus(null);

    try {
      const response = await authService.reembedResume();
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
      const response = await authService.reembedPersonalInfo();
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

  const handleDownload = async (type: 'resume' | 'personalInfo') => {
    try {
      const blob = type === 'resume' 
        ? await authService.downloadResume()
        : await authService.downloadPersonalInfo();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type === 'resume' ? 'resume' : 'personal-info'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setActionStatus({
        type: 'error',
        message: error.message || `Failed to download ${type === 'resume' ? 'resume' : 'personal info'}`
      });
    }
  };

  const handleDelete = async (type: 'resume' | 'personalInfo') => {
    if (!confirm(`Are you sure you want to delete your ${type === 'resume' ? 'resume' : 'personal info'}?`)) {
      return;
    }

    try {
      if (type === 'resume') {
        await authService.deleteResume();
      } else {
        await authService.deletePersonalInfo();
      }
      
      setActionStatus({
        type: 'success',
        message: `${type === 'resume' ? 'Resume' : 'Personal info'} deleted successfully!`
      });
      
      // Reload status after deletion
      await loadDocumentsStatus();
    } catch (error: any) {
      setActionStatus({
        type: 'error',
        message: error.message || `Failed to delete ${type === 'resume' ? 'resume' : 'personal info'}`
      });
    }
  };

  const downloadExtension = async () => {
    try {
      // Check if the zip file exists
      const response = await fetch('/ai-form-assistant.zip', { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error('Extension zip file not found');
      }
      
      const link = document.createElement('a');
      link.href = '/ai-form-assistant.zip';
      link.download = 'ai-form-assistant.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setActionStatus({
        type: 'success',
        message: '📥 Extension downloaded! Now extract the zip file and install it in Chrome: chrome://extensions/ → Enable Developer Mode → Load Unpacked. The status above will change to "Installed" after loading.'
      });
    } catch (error) {
      console.error('Extension download failed:', error);
      setActionStatus({
        type: 'error',
        message: '❌ Download failed. Try refreshing the page or contact support. You can also manually load the extension from the ai_popup/ai-form-assistant/ folder.'
      });
    }
  };

    const checkExtensionStatus = () => {
    console.log('🔍 Checking extension status...');
    console.log('📍 Current URL:', window.location.href);
    console.log('🏠 Current hostname:', window.location.hostname);
    
    // Method 1: Check DOM attributes set by content script (most reliable)
    const extensionLoaded = document.documentElement.getAttribute('data-ai-extension-loaded') === 'true';
    const extensionVersion = document.documentElement.getAttribute('data-ai-extension-version');
    const extensionTimestamp = document.documentElement.getAttribute('data-ai-extension-timestamp');
    
    console.log('📋 DOM attribute checks:', {
      loaded: extensionLoaded,
      version: extensionVersion,
      timestamp: extensionTimestamp
    });
    
    if (extensionLoaded && extensionVersion) {
      if (!extensionInstalled) {
        console.log('✅ Extension detected via DOM attributes', {
          version: extensionVersion,
          timestamp: extensionTimestamp
        });
        setExtensionInstalled(true);
        setExtensionDetectedOnce(true);
        console.log('🎉 Extension status set to installed');
      }
      checkExtensionAuthStatus();
      return;
    }
    
    // Method 2: Check for global variable in multiple contexts (fallback)
    const windowVar = (window as any).aiFormAssistantExtension;
    const documentVar = (document as any).aiFormAssistantExtension;
    const parentVar = (window.parent as any)?.aiFormAssistantExtension;
    const topVar = (window.top as any)?.aiFormAssistantExtension;
    
    console.log('🌐 Global variable checks:', {
      window: windowVar?.loaded,
      document: documentVar?.loaded,
      parent: parentVar?.loaded,
      top: topVar?.loaded,
      currentURL: window.location.href
    });
    
    const hasGlobalVar = !!(windowVar?.loaded || documentVar?.loaded || parentVar?.loaded || topVar?.loaded);
    
    if (hasGlobalVar) {
      if (!extensionInstalled) {
        console.log('✅ Extension detected via global variable');
        setExtensionInstalled(true);
        setExtensionDetectedOnce(true);
        console.log('🎉 Extension status set to installed');
      }
      checkExtensionAuthStatus();
      return;
    }
    
    // If we've detected it before, keep it as installed (don't flip-flop)
    if (extensionDetectedOnce) {
      if (!extensionInstalled) {
        console.log('🔄 Extension was detected before, keeping as installed');
        setExtensionInstalled(true);
      }
      return;
    }
    
    // Only mark as not installed if we've never detected it
    if (!extensionDetectedOnce && extensionInstalled) {
      console.log('❌ Extension not detected - marking as not installed');
      setExtensionInstalled(false);
      setExtensionLoggedIn(false);
    }
    
    // Additional check: If we're on the custom domain and extension popup is visible, assume it's installed
    if (window.location.hostname === 'mpencil.online' || window.location.hostname === 'www.mpencil.online') {
      // Check if extension popup exists in DOM
      const extensionPopup = document.querySelector('[id*="ai-"], [class*="ai-"]');
      if (extensionPopup && !extensionInstalled) {
        console.log('🎯 Extension popup detected on custom domain - assuming installed');
        setExtensionInstalled(true);
        setExtensionDetectedOnce(true);
        checkExtensionAuthStatus();
      }
    }
  };

  const checkExtensionAuthStatus = async () => {
    try {
      // Method 1: Check DOM attributes (most reliable)
      const domLoggedIn = document.documentElement.getAttribute('data-ai-extension-logged-in') === 'true';
      
      if (domLoggedIn) {
        setExtensionLoggedIn(true);
        console.log('🔐 Extension auth status (DOM):', 'Logged in');
        return;
      }
      
      // Method 2: Check global variable and call checkAuth
      const extensionObj = (window as any).aiFormAssistantExtension;
      if (extensionObj?.checkAuth) {
        const isLoggedIn = await extensionObj.checkAuth();
        setExtensionLoggedIn(isLoggedIn);
        console.log('🔐 Extension auth status (checkAuth):', isLoggedIn ? 'Logged in' : 'Not logged in');
        return;
      }
      
      // Method 3: Check global variable directly
      if (extensionObj?.isLoggedIn !== undefined) {
        setExtensionLoggedIn(extensionObj.isLoggedIn);
        console.log('🔐 Extension auth status (direct):', extensionObj.isLoggedIn ? 'Logged in' : 'Not logged in');
        return;
      }
      
      // Fallback: assume not logged in
      setExtensionLoggedIn(false);
      console.log('🔐 Extension auth status (fallback):', 'Not logged in');
      
    } catch (error) {
      console.error('Error checking extension auth:', error);
      setExtensionLoggedIn(false);
    }
  };

  const loginToExtension = async () => {
    if (!user?.email) {
      setActionStatus({
        type: 'error',
        message: 'Please make sure you are logged into the web app first'
      });
      return;
    }

    setExtensionLoginLoading(true);
    setActionStatus(null);

    try {
      // Get current session data from localStorage (web app)
      const sessionId = localStorage.getItem('session_id');
      const userId = localStorage.getItem('user_id');
      const email = localStorage.getItem('user_email');

      if (!sessionId || !userId) {
        throw new Error('No active web app session found');
      }

      // Store session data in extension storage - only if extension is properly detected
      if ((window as any).aiFormAssistantExtension?.loaded && (window as any).chrome?.storage) {
        await new Promise<void>((resolve, reject) => {
          (window as any).chrome.storage.local.set({
            sessionId: sessionId,
            userId: userId,
            email: email
          }, () => {
            if ((window as any).chrome.runtime.lastError) {
              reject(new Error((window as any).chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });

        setExtensionLoggedIn(true);
        setActionStatus({
          type: 'success',
          message: 'Successfully logged into browser extension! 🎉 You can now use AI form filling on any website.'
        });
        
        // Recheck extension status to update UI
        setTimeout(checkExtensionAuthStatus, 1000);
      } else {
        throw new Error('Extension not properly installed or not accessible. Please make sure the extension is loaded and refresh this page.');
      }

    } catch (error: any) {
      console.error('Extension login failed:', error);
      setActionStatus({
        type: 'error',
        message: error.message || 'Failed to login to extension. Make sure the extension is installed.'
      });
    } finally {
      setExtensionLoginLoading(false);
    }
  };



  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src="/ai_popup.png" 
            alt="AI Logo" 
            style={{ width: '28px', height: '28px' }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
              AI Form Assistant
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
              {user ? `Welcome back, ${user.email}` : 'Please sign in to get started'}
            </p>
          </div>
        </div>
        
        {user && (
          <button
            onClick={onLogout}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Logout
          </button>
        )}
      </header>

      {/* Main content */}
      {user ? (
        <main style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Status Message */}
        {actionStatus && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            background: actionStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${actionStatus.type === 'success' ? '#d1fae5' : '#fecaca'}`,
            color: actionStatus.type === 'success' ? '#065f46' : '#dc2626',
            fontSize: '0.875rem'
          }}>
            {actionStatus.message}
          </div>
        )}

        {/* Document Status Overview */}
        <section style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.25rem' }}>
            📊 Document Status
          </h2>
          
          {statusLoading ? (
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading status...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '6px',
                background: documentsStatus?.resume_uploaded ? '#f0fdf4' : '#fef2f2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1rem' }}>📄</span>
                  <strong style={{ fontSize: '0.875rem' }}>Resume</strong>
                </div>
                <p style={{ 
                  margin: 0,
                  color: documentsStatus?.resume_uploaded ? '#16a34a' : '#dc2626',
                  fontWeight: '500',
                  fontSize: '0.8rem'
                }}>
                  {documentsStatus?.resume_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}
                </p>
              </div>
              
              <div style={{ 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '6px',
                background: documentsStatus?.personal_info_uploaded ? '#f0fdf4' : '#fef2f2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1rem' }}>👤</span>
                  <strong style={{ fontSize: '0.875rem' }}>Personal Info</strong>
                </div>
                <p style={{ 
                  margin: 0,
                  color: documentsStatus?.personal_info_uploaded ? '#16a34a' : '#dc2626',
                  fontWeight: '500',
                  fontSize: '0.8rem'
                }}>
                  {documentsStatus?.personal_info_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}
                </p>
              </div>
            </div>
          )}
        </section>

          {/* File Upload Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Resume Upload */}
            <section style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.25rem' }}>
                📄 Resume Management
              </h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'resume');
                  }}
                  style={{ display: 'none' }}
                />
                
                <button
                  onClick={() => resumeFileRef.current?.click()}
                  disabled={uploadLoading.resume}
                  style={{
                    width: '100%',
                    background: uploadLoading.resume ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: uploadLoading.resume ? 'not-allowed' : 'pointer',
                    marginBottom: '0.75rem'
                  }}
                >
                  {uploadLoading.resume ? '⏳ Uploading...' : '📤 Upload Resume'}
                </button>
              </div>

              {documentsStatus?.resume_uploaded && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    onClick={() => handleDownload('resume')}
                    style={{
                      flex: 1,
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      padding: '0.4rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => handleDelete('resume')}
                    style={{
                      flex: 1,
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '0.4rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
              
              <button
                onClick={handleResumeReembed}
                disabled={resumeLoading || !documentsStatus?.resume_uploaded}
                style={{
                  width: '100%',
                  background: resumeLoading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (resumeLoading || !documentsStatus?.resume_uploaded) ? 'not-allowed' : 'pointer',
                  opacity: !documentsStatus?.resume_uploaded ? 0.5 : 1
                }}
              >
                {resumeLoading ? '⏳ Re-embedding...' : '🔄 Re-embed Resume'}
              </button>
            </section>

            {/* Personal Info Upload */}
            <section style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.25rem' }}>
                👤 Personal Info Management
              </h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <input
                  ref={personalInfoFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'personalInfo');
                  }}
                  style={{ display: 'none' }}
                />
                
                <button
                  onClick={() => personalInfoFileRef.current?.click()}
                  disabled={uploadLoading.personalInfo}
                  style={{
                    width: '100%',
                    background: uploadLoading.personalInfo ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: uploadLoading.personalInfo ? 'not-allowed' : 'pointer',
                    marginBottom: '0.75rem'
                  }}
                >
                  {uploadLoading.personalInfo ? '⏳ Uploading...' : '📤 Upload Personal Info'}
                </button>
              </div>

              {documentsStatus?.personal_info_uploaded && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    onClick={() => handleDownload('personalInfo')}
                    style={{
                      flex: 1,
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      padding: '0.4rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => handleDelete('personalInfo')}
                    style={{
                      flex: 1,
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '0.4rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
              
              <button
                onClick={handlePersonalInfoReembed}
                disabled={personalInfoLoading || !documentsStatus?.personal_info_uploaded}
                style={{
                  width: '100%',
                  background: personalInfoLoading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (personalInfoLoading || !documentsStatus?.personal_info_uploaded) ? 'not-allowed' : 'pointer',
                  opacity: !documentsStatus?.personal_info_uploaded ? 0.5 : 1
                }}
              >
                {personalInfoLoading ? '⏳ Re-embedding...' : '🔄 Re-embed Personal Info'}
              </button>
            </section>
          </div>

          {/* Extension Status & Login Section */}
          <section style={{
            background: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.25rem' }}>
              🚀 Browser Extension Setup
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {/* Extension Status */}
                         <div style={{ 
               padding: '0.75rem', 
               border: '1px solid #e5e7eb', 
               borderRadius: '6px',
               background: extensionInstalled ? '#f0fdf4' : '#fef2f2'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                 <span style={{ fontSize: '1rem' }}>🔧</span>
                 <strong style={{ fontSize: '0.875rem' }}>Extension Status</strong>
               </div>
               <p style={{ 
                 margin: 0,
                 color: extensionInstalled ? '#16a34a' : '#dc2626',
                 fontWeight: '500',
                 fontSize: '0.8rem'
               }}>
                 {extensionInstalled ? '✅ Installed' : '❌ Not installed'}
                 {extensionDetectedOnce && extensionInstalled && (
                   <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                     (Stable)
                   </span>
                 )}
               </p>
             </div>
            
            {/* Login Status */}
            <div style={{ 
              padding: '0.75rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              background: extensionLoggedIn ? '#f0fdf4' : '#fef2f2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1rem' }}>🔐</span>
                <strong style={{ fontSize: '0.875rem' }}>Extension Login</strong>
              </div>
              <p style={{ 
                margin: 0,
                color: extensionLoggedIn ? '#16a34a' : '#dc2626',
                fontWeight: '500',
                fontSize: '0.8rem'
              }}>
                {extensionLoggedIn ? '✅ Logged in' : '❌ Not logged in'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {!extensionInstalled && (
              <button
                onClick={downloadExtension}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📥 Download Extension
              </button>
            )}
            
            {extensionInstalled && !extensionLoggedIn && (
              <button
                onClick={loginToExtension}
                disabled={extensionLoginLoading}
                style={{
                  background: extensionLoginLoading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: extensionLoginLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {extensionLoginLoading ? '⏳ Logging in...' : '🔐 Login to Extension'}
              </button>
            )}
            
            {extensionInstalled && extensionLoggedIn && (
              <div style={{
                padding: '1rem 2rem',
                background: '#f0fdf4',
                color: '#16a34a',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ✅ Extension ready for use!
              </div>
            )}
            
                         <button
               onClick={() => {
                 console.log('🔄 Manual refresh clicked');
                 console.log('Current state:', { extensionInstalled, extensionLoggedIn, extensionDetectedOnce });
                 
                 // Method 1: Check DOM attributes (most reliable)
                 const extensionLoaded = document.documentElement.getAttribute('data-ai-extension-loaded') === 'true';
                 const extensionVersion = document.documentElement.getAttribute('data-ai-extension-version');
                 const extensionLoggedInDOM = document.documentElement.getAttribute('data-ai-extension-logged-in') === 'true';
                 
                 console.log('DOM attribute checks:', {
                   loaded: extensionLoaded,
                   version: extensionVersion,
                   loggedIn: extensionLoggedInDOM,
                   timestamp: document.documentElement.getAttribute('data-ai-extension-timestamp')
                 });
                 
                 // Method 2: Check for global variable in multiple contexts
                 const windowVar = (window as any).aiFormAssistantExtension;
                 const documentVar = (document as any).aiFormAssistantExtension;
                 const parentVar = (window.parent as any)?.aiFormAssistantExtension;
                 const topVar = (window.top as any)?.aiFormAssistantExtension;
                 
                 console.log('Global variable checks:', {
                   window: windowVar,
                   document: documentVar,
                   parent: parentVar,
                   top: topVar,
                   currentURL: window.location.href,
                   inFrame: window !== window.parent
                 });
                 
                 // Check if extension is detected by any method
                 const hasGlobalVar = !!(windowVar?.loaded || documentVar?.loaded || parentVar?.loaded || topVar?.loaded);
                 const extensionDetected = extensionLoaded || hasGlobalVar;
                 
                 if (extensionDetected) {
                   setExtensionInstalled(true);
                   setExtensionDetectedOnce(true);
                   console.log('✅ Manual detection successful');
                   
                   // Update auth status
                   if (extensionLoggedInDOM) {
                     setExtensionLoggedIn(true);
                     console.log('✅ Extension login status updated from DOM');
                   } else {
                     checkExtensionAuthStatus();
                   }
                 } else {
                   // Fallback: try chrome storage check
                   if ((window as any).chrome?.storage) {
                     console.log('🔍 Trying fallback chrome.storage check...');
                     try {
                       (window as any).chrome.storage.local.get(['extensionId'], (result: any) => {
                         if (result.extensionId === 'ai-form-assistant') {
                           console.log('✅ Manual detection successful via chrome.storage');
                           setExtensionInstalled(true);
                           setExtensionDetectedOnce(true);
                           checkExtensionAuthStatus();
                         } else {
                           console.log('❌ Extension not found in storage');
                         }
                       });
                     } catch (error) {
                       console.log('❌ Chrome storage check failed:', error);
                     }
                   } else {
                     console.log('❌ No extension detected by any method');
                   }
                 }
                 
                 // Update message after all checks complete
                 setTimeout(() => {
                   const finalCheck = extensionDetected || extensionInstalled;
                   setActionStatus({
                     type: finalCheck ? 'success' : 'error',
                     message: finalCheck ? 
                       '✅ Extension detected! Status updated.' : 
                       '❌ Extension not detected. Make sure it\'s installed, enabled, and reload this page.'
                   });
                 }, 500);
               }}
               style={{
                 background: '#f3f4f6',
                 color: '#374151',
                 border: '1px solid #d1d5db',
                 padding: '0.75rem',
                 borderRadius: '6px',
                 fontSize: '0.8rem',
                 cursor: 'pointer'
               }}
             >
               🔄 Refresh Status
             </button>
          </div>
          
                     <p style={{ color: '#6b7280', marginTop: '0.75rem', fontSize: '0.8rem' }}>
             The browser extension enables AI form filling on any website. Once installed and logged in, 
             you can click on form fields and use the AI button to automatically fill them.
           </p>
           
           {/* Debug Info */}
           {!extensionInstalled && (
             <div style={{ 
               marginTop: '0.75rem', 
               padding: '0.5rem', 
               background: '#fef3c7', 
               borderRadius: '4px',
               fontSize: '0.75rem',
               color: '#92400e'
             }}>
               <strong>💡 Not detecting extension?</strong> After installing:
               <br />• Refresh this page (F5)
               <br />• Click "Refresh Status" button
               <br />• Make sure you extracted the zip file properly
               <br />• Check that the extension shows as "Enabled" in chrome://extensions/
               <br />• Open browser console (F12) and check for error messages
             </div>
           )}
           
           {/* Debug Section for Development */}
           <details style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
             <summary style={{ cursor: 'pointer', fontWeight: '500' }}>🔍 Debug Info (Click to expand)</summary>
             <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', background: '#f8fafc', padding: '0.4rem', borderRadius: '4px' }}>
               <div>Extension Installed: {extensionInstalled ? '✅ Yes' : '❌ No'}</div>
               <div>Extension Detected Once: {extensionDetectedOnce ? '✅ Yes' : '❌ No'}</div>
               <div>Extension Logged In: {extensionLoggedIn ? '✅ Yes' : '❌ No'}</div>
               <div>DOM Loaded Attribute: {document.documentElement.getAttribute('data-ai-extension-loaded') === 'true' ? '✅ Present' : '❌ Missing'}</div>
               <div>DOM Version Attribute: {document.documentElement.getAttribute('data-ai-extension-version') || '❌ Missing'}</div>
               <div>DOM Auth Attribute: {document.documentElement.getAttribute('data-ai-extension-logged-in') === 'true' ? '✅ Logged In' : '❌ Not Logged In'}</div>
               <div>Global Variable (window): {(window as any).aiFormAssistantExtension?.loaded ? '✅ Present' : '❌ Missing'}</div>
               <div>Global Variable (document): {(document as any).aiFormAssistantExtension?.loaded ? '✅ Present' : '❌ Missing'}</div>
               <div>Global Variable (parent): {(window.parent as any)?.aiFormAssistantExtension?.loaded ? '✅ Present' : '❌ Missing'}</div>
               <div>Global Variable (top): {(window.top as any)?.aiFormAssistantExtension?.loaded ? '✅ Present' : '❌ Missing'}</div>
               <div>Chrome Runtime: {(window as any).chrome?.runtime ? '✅ Available' : '❌ Missing'}</div>
               <div>In Frame: {window !== window.parent ? '✅ Yes' : '❌ No'}</div>
               <div>Current URL: {window.location.href}</div>
             </div>
           </details>
           
           {/* Installation Instructions */}
           <div style={{ 
             marginTop: '0.75rem', 
             padding: '0.75rem', 
             background: '#f8fafc', 
             borderRadius: '6px',
             fontSize: '0.8rem'
           }}>
             <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.8rem' }}>
               📋 Installation Steps:
             </h4>
             <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#6b7280' }}>
               <li>Download the extension zip file above</li>
               <li>Extract/unzip the downloaded file to a folder</li>
               <li>Open Chrome/Edge and go to <code style={{background: '#e5e7eb', padding: '0.125rem 0.25rem', borderRadius: '4px'}}>chrome://extensions/</code></li>
               <li>Enable "Developer mode" (toggle in top right)</li>
               <li>Click "Load unpacked" and select the extracted folder</li>
               <li>Extension icon should appear in your browser toolbar</li>
               <li>Click "Login to Extension" button above to sync your account</li>
             </ol>
           </div>
        </section>

        {/* Usage Instructions */}
        <section style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.25rem' }}>
            💡 How It Works
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Upload Documents</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Upload your resume and personal information to train the AI
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔧</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Install Extension</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Download and install the browser extension in Chrome or Firefox
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>AI-Powered Filling</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Click form fields and let AI fill them with your information
              </p>
            </div>
          </div>
        </section>


      </main>
      ) : (
        <main style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
              🤖 AI Form Assistant
            </h2>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '1rem' }}>
              Please sign in to access your dashboard and manage your documents.
            </p>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
          </div>
        </main>
      )}
    </div>
  );
};

export default Dashboard; 