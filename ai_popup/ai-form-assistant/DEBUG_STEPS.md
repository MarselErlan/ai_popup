# 🔍 Step-by-Step Debugging Guide

## Problem: Session not syncing automatically

Let's debug this systematically:

---

## Step 1: Open Debug Tool

1. **Open the debug page:**

   ```
   http://localhost:8080/debug-sync.html
   ```

2. **Click "Check Everything"** and see what it shows

---

## Step 2: Check Your Web App Login

1. **Open your web app** (localhost:5173)
2. **Open browser console** (F12)
3. **Login to your web app**
4. **Check console logs** - look for:
   ```
   🔍 Detected login API response: {...}
   ✅ Auto-detected session data from API
   ✅ Extension notified of login
   ```

**If you DON'T see these logs, the auto-detection isn't working.**

---

## Step 3: Manual Check - What's in localStorage?

In your web app console, run:

```javascript
// Check what's actually stored
console.log("Current localStorage:", {
  sessionId: localStorage.getItem("sessionId"),
  userId: localStorage.getItem("userId"),
  email: localStorage.getItem("email"),
});

// Check all possible session keys
["sessionId", "session_id", "authToken", "token", "accessToken"].forEach(
  (key) => {
    const value = localStorage.getItem(key);
    if (value) console.log(`Found ${key}:`, value);
  }
);
```

---

## Step 4: Check Extension Storage

In console, run:

```javascript
// Check extension storage
chrome.storage.local.get(["sessionId", "userId", "email"], (result) => {
  console.log("Extension storage:", result);
});
```

---

## Step 5: Manual Sync Test

If localStorage has session data but extension doesn't:

```javascript
// Manual sync test
window.notifyExtensionOfLogin({
  sessionId: localStorage.getItem("sessionId"), // or whatever key your app uses
  userId: localStorage.getItem("userId"), // or whatever key your app uses
  email: localStorage.getItem("email"), // or whatever key your app uses
});
```

---

## Step 6: Identify the Issue

### Issue A: No session data in localStorage

**Solution:** Your web app needs to store session data after login:

```javascript
// Add this after successful login in your web app
localStorage.setItem("sessionId", loginResponse.sessionId);
localStorage.setItem("userId", loginResponse.userId);
localStorage.setItem("email", loginResponse.email);
```

### Issue B: Session data uses different keys

**Solution:** Either change your keys to standard ones, or modify the sync script:

```javascript
// If your app uses different keys, manually sync:
window.notifyExtensionOfLogin({
  sessionId: localStorage.getItem("your_session_key"),
  userId: localStorage.getItem("your_user_key"),
  email: localStorage.getItem("your_email_key"),
});
```

### Issue C: Auto-detection not working

**Solution:** Add manual call after login:

```javascript
// In your login success handler
async function onLoginSuccess(loginResponse) {
  // Your existing login code...

  // Add this line:
  if (window.notifyExtensionOfLogin) {
    window.notifyExtensionOfLogin({
      sessionId: loginResponse.sessionId,
      userId: loginResponse.userId,
      email: loginResponse.email,
    });
  }
}
```

---

## Step 7: Test Form Filling

1. **After sync is working** (extension storage has session data)
2. **Go to a job application site**
3. **Click on a form field**
4. **AI button should appear** and work

---

## Common Solutions

### Quick Fix 1: Force Standard Keys

```javascript
// After login, ensure standard format:
localStorage.setItem("sessionId", yourSessionId);
localStorage.setItem("userId", yourUserId);
localStorage.setItem("email", yourEmail);
```

### Quick Fix 2: Manual Integration

```javascript
// Add to your login function:
window.notifyExtensionOfLogin({
  sessionId: "your-session-id",
  userId: "your-user-id",
  email: "user@email.com",
});
```

### Quick Fix 3: Include Integration Script

```html
<!-- Add to your web app HTML -->
<script src="web-app-integration.js"></script>
```

---

## Debug Commands Reference

```javascript
// Check if sync functions are available
console.log("Functions available:", {
  notifyExtensionOfLogin: !!window.notifyExtensionOfLogin,
  syncSessionWithExtension: !!window.syncSessionWithExtension,
  webAppSync: !!window.webAppSync,
});

// Test sync manually
window.notifyExtensionOfLogin({
  sessionId: "test-123",
  userId: "user-456",
  email: "test@example.com",
});

// Check extension connectivity
chrome.storage.local.get(["sessionId"], console.log);
```

---

## Expected Console Output (When Working)

```
🔄 Web App Integration Script loaded
🔍 Detected login API response: {sessionId: "...", userId: "..."}
✅ Auto-detected session data from API
🔐 Notifying extension of login: {sessionId: "...", userId: "..."}
✅ Extension notified of login
🔄 Session state changed: {sessionId: "...", userId: "..."}
✅ Login detected and synced to extension
```

---

## Next Steps

1. **Run through Steps 1-6** to identify the specific issue
2. **Apply the appropriate solution**
3. **Test with Step 7**
4. **If still not working, share the console output from Step 2**

The most common issue is that the web app doesn't store session data in localStorage with the expected key names! 🎯
