# 🔄 Unified Session Sync Guide

## Overview

We've combined all session sync functionality into **ONE** script: `web-app-sync.js`

No more confusion with multiple files! This single script does everything.

## Quick Setup

### 1. Include the Script

Add this to your web app HTML:

```html
<script src="web-app-sync.js"></script>
```

### 2. Call After Login

After successful login in your web app, call:

```javascript
window.notifyExtensionOfLogin({
  sessionId: "your-session-token",
  userId: "user-123",
  email: "user@example.com",
});
```

### 3. Call After Logout

After logout:

```javascript
window.notifyExtensionOfLogout();
```

## Framework Examples

### React

```javascript
// After login success
window.webAppIntegration.react(user, authToken);
```

### Vue

```javascript
// After login success
window.webAppIntegration.vue(this.$store.state.auth);
```

### Generic API Response

```javascript
// If your login API returns session data
window.autoSyncFromLogin(loginApiResponse);
```

## What It Does Automatically

✅ **Auto-detects** login from `/login`, `/auth`, `/signin` API calls  
✅ **Monitors** localStorage for session changes  
✅ **Syncs** with browser extension in real-time  
✅ **Handles** multiple localStorage key formats  
✅ **Works** across browser tabs

## Debugging

Check browser console for these messages:

- `🔄 Unified Web App Session Sync loaded` - Script loaded
- `✅ Extension notified of login` - Sync successful
- `📱 Extension not available` - Extension not installed

## Manual Sync Button

If automatic sync isn't working, users can click the "🔄 Sync with Extension" button in the debug tool.

## That's It!

One script, simple setup, automatic sync. No more multiple files to manage!
