import React, { useState, useEffect } from 'react';
import { urlTrackingService, type TrackedUrl, type UrlStatsResponse } from '../services/urlTrackingService';

interface UrlTrackerProps {
  // No props needed - user info comes from session authentication
}

const UrlTracker: React.FC<UrlTrackerProps> = () => {
  const [urls, setUrls] = useState<TrackedUrl[]>([]);
  const [stats, setStats] = useState<UrlStatsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState({ url: '', title: '', notes: '' });
  const [addingUrl, setAddingUrl] = useState(false);

  // Load URLs and stats
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [urlsResponse, statsResponse] = await Promise.all([
        urlTrackingService.getTrackedUrls(statusFilter || undefined),
        urlTrackingService.getUrlStats()
      ]);
      
      setUrls(urlsResponse.urls);
      setStats(statsResponse.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Add new URL
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.url.trim()) return;

    try {
      setAddingUrl(true);
      await urlTrackingService.saveUrl({
        url: newUrl.url,
        title: newUrl.title || undefined,
        notes: newUrl.notes || undefined
      });
      
      setNewUrl({ url: '', title: '', notes: '' });
      setShowAddForm(false);
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to add URL');
    } finally {
      setAddingUrl(false);
    }
  };

  // Update URL status
  const handleStatusUpdate = async (urlId: string, newStatus: 'not_applied' | 'applied' | 'in_progress') => {
    try {
      await urlTrackingService.updateUrlStatus(urlId, { status: newStatus });
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  // Delete URL
  const handleDeleteUrl = async (urlId: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;
    
    try {
      await urlTrackingService.deleteUrl(urlId);
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to delete URL');
    }
  };

  // Auto-save current page URL
  const handleSaveCurrentPage = async () => {
    const pageInfo = urlTrackingService.getCurrentPageInfo();
    if (!pageInfo.url) {
      setError('Could not get current page URL');
      return;
    }

    try {
      await urlTrackingService.saveUrl({
        url: pageInfo.url,
        title: pageInfo.title
      });
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to save current page');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading URL tracker...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Job Application Tracker</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSaveCurrentPage}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📌 Save Current Page
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ➕ Add URL
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              float: 'right', 
              background: 'none', 
              border: 'none', 
              fontSize: '16px', 
              cursor: 'pointer' 
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '15px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {stats.total_urls}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total URLs</div>
          </div>
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            padding: '15px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {stats.applied}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Applied</div>
          </div>
          <div style={{ 
            backgroundColor: '#fffbeb', 
            padding: '15px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #fed7aa'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.in_progress}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>In Progress</div>
          </div>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '15px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>
              {stats.application_rate}%
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Application Rate</div>
          </div>
        </div>
      )}

      {/* Add URL Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Add New URL</h3>
          <form onSubmit={handleAddUrl} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="url"
              placeholder="Job URL (required)"
              value={newUrl.url}
              onChange={(e) => setNewUrl({ ...newUrl, url: e.target.value })}
              required
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Job title (optional)"
              value={newUrl.title}
              onChange={(e) => setNewUrl({ ...newUrl, title: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <textarea
              placeholder="Notes (optional)"
              value={newUrl.notes}
              onChange={(e) => setNewUrl({ ...newUrl, notes: e.target.value })}
              rows={3}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={addingUrl}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: addingUrl ? 'not-allowed' : 'pointer',
                  opacity: addingUrl ? 0.5 : 1
                }}
              >
                {addingUrl ? 'Adding...' : 'Add URL'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', color: '#374151' }}>Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="">All</option>
          <option value="not_applied">Not Applied</option>
          <option value="in_progress">In Progress</option>
          <option value="applied">Applied</option>
        </select>
      </div>

      {/* URLs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {urls.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#6b7280',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {statusFilter ? 
              `No URLs found with status "${urlTrackingService.getStatusText(statusFilter)}"` : 
              'No URLs tracked yet. Add your first job application URL above!'
            }
          </div>
        ) : (
          urls.map((url) => (
            <div
              key={url.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>
                    {url.title || 'Untitled'}
                  </h4>
                  <a 
                    href={url.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'none', 
                      fontSize: '14px',
                      wordBreak: 'break-all'
                    }}
                  >
                    {url.url}
                  </a>
                  {url.domain && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      📍 {url.domain}
                    </div>
                  )}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginLeft: '15px'
                }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: urlTrackingService.getStatusColor(url.status) + '20',
                      color: urlTrackingService.getStatusColor(url.status),
                      border: `1px solid ${urlTrackingService.getStatusColor(url.status)}40`
                    }}
                  >
                    {urlTrackingService.getStatusText(url.status)}
                  </span>
                </div>
              </div>
              
              {url.notes && (
                <div style={{ 
                  fontSize: '14px', 
                  color: '#4b5563', 
                  marginBottom: '10px',
                  fontStyle: 'italic'
                }}>
                  "{url.notes}"
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <div>
                  Added: {urlTrackingService.formatDate(url.created_at)}
                  {url.applied_at && (
                    <span style={{ marginLeft: '15px' }}>
                      Applied: {urlTrackingService.formatDate(url.applied_at)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={url.status}
                    onChange={(e) => handleStatusUpdate(url.id, e.target.value as any)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="not_applied">Not Applied</option>
                    <option value="in_progress">In Progress</option>
                    <option value="applied">Applied</option>
                  </select>
                  <button
                    onClick={() => handleDeleteUrl(url.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UrlTracker; 