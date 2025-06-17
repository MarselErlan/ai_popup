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
  
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const personalInfoFileRef = useRef<HTMLInputElement>(null);

  // Load documents status on component mount
  useEffect(() => {
    loadDocumentsStatus();
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

        {/* Extension Download Section */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
            🚀 Browser Extension
          </h2>
          
          <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            Download and install the browser extension to start using AI-powered form filling on any website.
          </p>

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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📥 Download Extension
          </button>
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
      </main>
    </div>
  );
};

export default Dashboard; 