/**
 * 🎯 AI Form Assistant - Background Script
 * Handles extension lifecycle and basic communication
 */

console.log('🎯 AI Form Assistant background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🎯 Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('✅ First time installation');
    // Could open welcome page or setup instructions
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated');
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received message:', request.action);
  
  switch (request.action) {
    case 'getAuthStatus':
      handleGetAuthStatus(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'clearStorage':
      handleClearStorage(sendResponse);
      return true;
      
    default:
      console.log('❓ Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Get current authentication status
async function handleGetAuthStatus(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['sessionId', 'userId', 'email']);
    const isAuthenticated = !!(result.sessionId && result.userId);
    
    sendResponse({
      success: true,
      isAuthenticated: isAuthenticated,
      user: result.email ? { 
        user_id: result.userId, 
        email: result.email,
        session_id: result.sessionId 
      } : null
    });
  } catch (error) {
    console.error('❌ Error getting auth status:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Clear all stored data
async function handleClearStorage(sendResponse) {
  try {
    await chrome.storage.local.clear();
    console.log('✅ Storage cleared');
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Extension started');
});

// Handle tab updates (optional - for future features)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could inject content script or check if AI assistant should be active
    console.log('📄 Tab updated:', tab.url);
  }
});

console.log('🎯 Background script ready');
console.log('🔑 Background service worker loaded!'); 