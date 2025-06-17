/**
 * 🔑 Smart Form Filler - Popup Interface
 * Handles user registration, login, and extension management
 */

// Simple Google Helper Popup Script
// Focus on user_sessions table only

document.addEventListener('DOMContentLoaded', initializePopup);

// DOM elements
let loginForm, userSession, errorMessage;
let emailInput, nameInput, registerBtn, registerText, registerLoading;
let userEmail, sessionInfo, logoutBtn, errorText;

function initializePopup() {
  console.log('🚀 Popup initializing...');
  
  // Get DOM elements
  loginForm = document.getElementById('loginForm');
  userSession = document.getElementById('userSession');
  errorMessage = document.getElementById('errorMessage');
  
  emailInput = document.getElementById('email');
  nameInput = document.getElementById('name');
  registerBtn = document.getElementById('registerBtn');
  registerText = document.getElementById('registerText');
  registerLoading = document.getElementById('registerLoading');
  
  userEmail = document.getElementById('userEmail');
  sessionInfo = document.getElementById('sessionInfo');
  logoutBtn = document.getElementById('logoutBtn');
  errorText = document.getElementById('errorText');
  
  // Set up event listeners
  registerBtn.addEventListener('click', handleRegister);
  logoutBtn.addEventListener('click', handleLogout);
  
  // Check current session status
  checkSessionStatus();
  
  console.log('✅ Popup initialized');
}

// Check if user has active session
async function checkSessionStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSession' });
    
    if (response.session) {
      showUserSession(response.session);
    } else {
      showLoginForm();
    }
  } catch (error) {
    console.error('❌ Session check failed:', error);
    showError('Failed to check session status');
  }
}

// Show login form
function showLoginForm() {
  loginForm.classList.remove('hidden');
  userSession.classList.add('hidden');
  errorMessage.classList.add('hidden');
  
  // Pre-fill email if available
  const email = localStorage.getItem('lastEmail') || '';
  if (email) {
    emailInput.value = email;
  }
}

// Show user session info
function showUserSession(session) {
  loginForm.classList.add('hidden');
  userSession.classList.remove('hidden');
  errorMessage.classList.add('hidden');
  
  // Display user info
  userEmail.textContent = localStorage.getItem('userEmail') || 'User';
  
  // Format session info
  const createdDate = new Date(session.created_at);
  const timeAgo = getTimeAgo(createdDate);
  sessionInfo.textContent = `Session started ${timeAgo}`;
  
  console.log('✅ User session displayed');
}

// Show error message
function showError(message) {
  errorMessage.classList.remove('hidden');
  errorText.textContent = message;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 5000);
}

// Handle user registration
async function handleRegister() {
  const email = emailInput.value.trim();
  const name = nameInput.value.trim();
  
  // Basic validation
  if (!email || !name) {
    showError('Please fill in all fields');
    return;
  }
  
  if (!isValidEmail(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Show loading state
  setLoadingState(true);
  
  try {
    console.log('📝 Registering user:', email);
    
    // Send registration request to background script
    const response = await chrome.runtime.sendMessage({
      action: 'register',
      email: email,
      name: name
    });
    
    if (response.success) {
      // Store user info for display
      localStorage.setItem('userEmail', email);
      localStorage.setItem('lastEmail', email);
      
      console.log('✅ Registration successful');
      showUserSession(response.session);
      
      // Notify content scripts of session update
      notifyContentScripts(true);
      
    } else {
      throw new Error(response.error || 'Registration failed');
    }
    
  } catch (error) {
    console.error('❌ Registration failed:', error);
    showError(error.message || 'Registration failed. Please try again.');
  } finally {
    setLoadingState(false);
  }
}

// Handle logout
async function handleLogout() {
  try {
    console.log('🚪 Logging out...');
    
    const response = await chrome.runtime.sendMessage({ action: 'logout' });
    
    if (response.success) {
      // Clear stored data
      localStorage.removeItem('userEmail');
      
      console.log('✅ Logout successful');
      showLoginForm();
      
      // Notify content scripts of session update
      notifyContentScripts(false);
      
    } else {
      throw new Error(response.error || 'Logout failed');
    }
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    showError(error.message || 'Logout failed');
  }
}

// Set loading state for register button
function setLoadingState(loading) {
  if (loading) {
    registerBtn.disabled = true;
    registerText.classList.add('hidden');
    registerLoading.classList.remove('hidden');
  } else {
    registerBtn.disabled = false;
    registerText.classList.remove('hidden');
    registerLoading.classList.add('hidden');
  }
}

// Notify content scripts of session changes
async function notifyContentScripts(hasSession) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'sessionUpdated',
        hasSession: hasSession
      });
    }
  } catch (error) {
    // Content script might not be loaded, ignore error
    console.log('Content script not available on this page');
  }
}

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    if (!userSession.classList.contains('hidden')) {
      // Already logged in, do nothing
      return;
    }
    
    // Trigger registration on Enter
    event.preventDefault();
    handleRegister();
  }
});

console.log('🎯 Popup script ready'); 