import React, { useState, useRef, useEffect } from 'react';
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
  const [fullName, setFullName] = useState<string>('');
  const [llmTesting, setLlmTesting] = useState<boolean>(false);
  const [llmResponse, setLlmResponse] = useState<{answer: string; data_source: string; reasoning: string} | null>(null);
  const [extensionInstalled, setExtensionInstalled] = useState<boolean>(false);
  const [extensionLoggedIn, setExtensionLoggedIn] = useState<boolean>(false);
  const [extensionLoginLoading, setExtensionLoginLoading] = useState<boolean>(false);
  
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const personalInfoFileRef = useRef<HTMLInputElement>(null);

  // Load documents status and check extension on component mount
  useEffect(() => {
    loadDocumentsStatus();
    checkExtensionStatus();
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
        : await authService.downloadPersonalInfo(user?.id || '');
      
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
        await authService.deletePersonalInfo(user?.id || '');
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
        message: '🎉 Extension downloaded successfully! Extract the zip file and load it in Chrome/Edge: chrome://extensions/ → Enable Developer Mode → Load Unpacked'
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
    // Check if extension is installed
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      setExtensionInstalled(true);
      
      // Check if extension has authentication data
      try {
        (window as any).chrome.storage.local.get(['sessionId', 'userId'], (result: any) => {
          setExtensionLoggedIn(!!(result.sessionId && result.userId));
        });
      } catch (error) {
        console.log('Extension storage not accessible');
        setExtensionLoggedIn(false);
      }
    } else {
      setExtensionInstalled(false);
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

      // Store session data in extension storage
      if ((window as any).chrome?.storage) {
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
          message: 'Successfully logged into browser extension!'
        });
      } else {
        throw new Error('Extension not installed or not accessible');
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

  const testLLMFunction = async () => {
    if (!fullName.trim()) {
      setActionStatus({
        type: 'error',
        message: 'Please enter a full name to test'
      });
      return;
    }

    setLlmTesting(true);
    setLlmResponse(null);
    setActionStatus(null);

    try {
      // Test the LLM function with the generate-field-answer API
      const response = await authService.generateFieldAnswer({
        field_type: 'text',
        field_name: 'fullName',
        field_id: 'test-full-name',
        field_class: 'form-input',
        field_label: 'Full Name',
        field_placeholder: 'Enter your full name',
        surrounding_text: `Testing LLM function with input: ${fullName}`
      });

      setLlmResponse({
        answer: response,
        data_source: 'LLM API Test',
        reasoning: 'Generated from your uploaded documents and AI processing'
      });

      setActionStatus({
        type: 'success',
        message: 'LLM function tested successfully!'
      });

    } catch (error: any) {
      console.error('LLM test failed:', error);
      setActionStatus({
        type: 'error',
        message: error.message || 'LLM test failed. Make sure you have uploaded documents and are logged in.'
      });
    } finally {
      setLlmTesting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="/ai_popup.png" 
            alt="AI Logo" 
            style={{ width: '32px', height: '32px' }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>
              AI Form Assistant
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              Welcome back, {user?.email || 'User'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Logout
        </button>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Status Message */}
        {actionStatus && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            background: actionStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${actionStatus.type === 'success' ? '#d1fae5' : '#fecaca'}`,
            color: actionStatus.type === 'success' ? '#065f46' : '#dc2626'
          }}>
            {actionStatus.message}
          </div>
        )}

        {/* Document Status Overview */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
            📊 Document Status
          </h2>
          
          {statusLoading ? (
            <p style={{ color: '#6b7280' }}>Loading status...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ 
                padding: '1rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                background: documentsStatus?.resume_uploaded ? '#f0fdf4' : '#fef2f2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📄</span>
                  <strong>Resume</strong>
                </div>
                <p style={{ 
                  margin: 0,
                  color: documentsStatus?.resume_uploaded ? '#16a34a' : '#dc2626',
                  fontWeight: '500'
                }}>
                  {documentsStatus?.resume_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}
                </p>
              </div>
              
              <div style={{ 
                padding: '1rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                background: documentsStatus?.personal_info_uploaded ? '#f0fdf4' : '#fef2f2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>👤</span>
                  <strong>Personal Info</strong>
                </div>
                <p style={{ 
                  margin: 0,
                  color: documentsStatus?.personal_info_uploaded ? '#16a34a' : '#dc2626',
                  fontWeight: '500'
                }}>
                  {documentsStatus?.personal_info_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* File Upload Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Resume Upload */}
          <section style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
              📄 Resume Management
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
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
                  padding: '1rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: uploadLoading.resume ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {uploadLoading.resume ? '⏳ Uploading...' : '📤 Upload Resume'}
              </button>
            </div>

            {documentsStatus?.resume_uploaded && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => handleDownload('resume')}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
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
                    padding: '0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
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
                padding: '1rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
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
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
              👤 Personal Info Management
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
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
                  padding: '1rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: uploadLoading.personalInfo ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {uploadLoading.personalInfo ? '⏳ Uploading...' : '📤 Upload Personal Info'}
              </button>
            </div>

            {documentsStatus?.personal_info_uploaded && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => handleDownload('personalInfo')}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
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
                    padding: '0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
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
                padding: '1rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
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
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
            🚀 Browser Extension Setup
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Extension Status */}
            <div style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              background: extensionInstalled ? '#f0fdf4' : '#fef2f2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔧</span>
                <strong>Extension Status</strong>
              </div>
              <p style={{ 
                margin: 0,
                color: extensionInstalled ? '#16a34a' : '#dc2626',
                fontWeight: '500'
              }}>
                {extensionInstalled ? '✅ Installed' : '❌ Not installed'}
              </p>
            </div>
            
            {/* Login Status */}
            <div style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              background: extensionLoggedIn ? '#f0fdf4' : '#fef2f2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔐</span>
                <strong>Extension Login</strong>
              </div>
              <p style={{ 
                margin: 0,
                color: extensionLoggedIn ? '#16a34a' : '#dc2626',
                fontWeight: '500'
              }}>
                {extensionLoggedIn ? '✅ Logged in' : '❌ Not logged in'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {!extensionInstalled && (
              <button
                onClick={downloadExtension}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
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
                  padding: '1rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
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
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ✅ Extension ready for use!
              </div>
            )}
            
            <button
              onClick={checkExtensionStatus}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Status
            </button>
          </div>
          
                     <p style={{ color: '#6b7280', marginTop: '1rem', fontSize: '0.875rem' }}>
             The browser extension enables AI form filling on any website. Once installed and logged in, 
             you can click on form fields and use the AI button to automatically fill them.
           </p>
           
           {/* Installation Instructions */}
           <div style={{ 
             marginTop: '1rem', 
             padding: '1rem', 
             background: '#f8fafc', 
             borderRadius: '8px',
             fontSize: '0.875rem'
           }}>
             <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.875rem' }}>
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
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
            💡 How It Works
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
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

        {/* LLM Function Test Section */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginTop: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
            🧠 Test LLM Function
          </h2>
          
          <div style={{ maxWidth: '600px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Test Input (Full Name)
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name to test LLM"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    testLLMFunction();
                  }
                }}
              />
              <button
                onClick={testLLMFunction}
                disabled={llmTesting || !fullName.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: (llmTesting || !fullName.trim()) ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: (llmTesting || !fullName.trim()) ? 'not-allowed' : 'pointer',
                  minWidth: '120px'
                }}
              >
                {llmTesting ? '🧠 Testing...' : '🚀 Test LLM'}
              </button>
            </div>
            
            <p style={{
              margin: '0 0 1.5rem 0',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              This will test your LLM function using your uploaded documents and real authentication.
            </p>

            {/* LLM Response Display */}
            {llmResponse && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#16a34a', fontSize: '1rem' }}>
                  ✅ LLM Response:
                </h3>
                <div style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <strong>Answer:</strong> {llmResponse.answer}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong>Data Source:</strong> {llmResponse.data_source}
                  </div>
                  <div>
                    <strong>Reasoning:</strong> {llmResponse.reasoning}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard; 