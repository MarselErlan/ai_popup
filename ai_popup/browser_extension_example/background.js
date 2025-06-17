/**
 * 🔑 Smart Form Filler - Background Service Worker
 * Handles session management and API communication
 */

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Simple session storage
let currentSession = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 AI Popup - Google Helper installed');
  loadStoredSession();
});

// Load stored session on startup
chrome.runtime.onStartup.addListener(() => {
  loadStoredSession();
});

// Load session from storage
async function loadStoredSession() {
  try {
    const result = await chrome.storage.local.get(['userSession']);
    if (result.userSession) {
      currentSession = result.userSession;
      console.log('📱 Session loaded:', currentSession.session_id);
    }
  } catch (error) {
    console.error('❌ Error loading session:', error);
  }
}

// Save session to storage
async function saveSession(sessionData) {
  try {
    await chrome.storage.local.set({ userSession: sessionData });
    currentSession = sessionData;
    console.log('💾 Session saved:', sessionData.session_id);
  } catch (error) {
    console.error('❌ Error saving session:', error);
  }
}

// Clear session
async function clearSession() {
  try {
    await chrome.storage.local.remove(['userSession']);
    currentSession = null;
    console.log('🗑️ Session cleared');
  } catch (error) {
    console.error('❌ Error clearing session:', error);
  }
}

// Register new user
async function registerUser(email, name) {
  try {
    const response = await fetch(`${API_BASE_URL}/simple/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        name: name,
        password: 'simple-session' // Simple password for demo
      })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✅ User registered:', data.user_id);
      return data;
    } else {
      throw new Error(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
}

// Create session after registration
async function createSession(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        device_info: 'Chrome Extension - Google Helper'
      })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      const sessionData = {
        session_id: data.session_id,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      await saveSession(sessionData);
      console.log('✅ Session created:', data.session_id);
      return sessionData;
    } else {
      throw new Error(data.message || 'Session creation failed');
    }
  } catch (error) {
    console.error('❌ Session creation error:', error);
    throw error;
  }
}

// Validate current session
async function validateSession() {
  if (!currentSession) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/session/current/${currentSession.user_id}`);
    const data = await response.json();
    
    return data.status === 'success' && data.active_sessions > 0;
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return false;
  }
}

// Fill form field with AI
async function fillFormField(fieldInfo) {
  if (!currentSession) {
    throw new Error('No active session');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/generate-field-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field_name: fieldInfo.name,
        field_type: fieldInfo.type,
        field_label: fieldInfo.label,
        field_placeholder: fieldInfo.placeholder,
        page_context: fieldInfo.context,
        user_id: currentSession.user_id
      })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✅ Field filled:', fieldInfo.name);
      return {
        answer: data.answer,
        source: data.source || 'ai'
      };
    } else {
      throw new Error(data.message || 'Field filling failed');
    }
  } catch (error) {
    console.error('❌ Field filling error:', error);
    throw error;
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSession':
      sendResponse({ session: currentSession });
      break;
      
    case 'register':
      registerUser(request.email, request.name)
        .then(userData => createSession(userData.user_id))
        .then(sessionData => sendResponse({ success: true, session: sessionData }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'logout':
      clearSession()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'fillField':
      fillFormField(request.fieldInfo)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'validateSession':
      validateSession()
        .then(isValid => sendResponse({ valid: isValid }))
        .catch(error => sendResponse({ valid: false, error: error.message }));
      return true;
  }
});

// Handle Google site activation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isGoogleSite = tab.url.includes('google.com') || 
                        tab.url.includes('docs.google.com') || 
                        tab.url.includes('forms.google.com');
    
    if (isGoogleSite && currentSession) {
      console.log('🌐 Google site detected, session ready');
    }
  }
});

console.log('🔑 Background service worker loaded!'); 