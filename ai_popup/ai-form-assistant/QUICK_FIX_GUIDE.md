# 🔧 Quick Fix: Automatic Session Sync

## The Problem

You're seeing "🔄 Sync with Extension" button and having to click it manually. The session should sync automatically when you login to the web app.

## The Solution

Your web app needs to notify the extension when login happens. Here are **3 easy ways** to fix this:

---

## 🚀 Option 1: Quick Fix (2 minutes)

Add this **one line** to your web app after successful login:

```javascript
// After your login succeeds, add this line:
window.notifyExtensionOfLogin({
  sessionId: "your-session-id-here",
  userId: "your-user-id-here",
  email: "user@example.com",
});
```

**Example integration:**

```javascript
// In your login function
async function handleLogin(email, password) {
  const response = await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const loginData = await response.json();

  if (loginData.success) {
    // ADD THIS LINE:
    window.notifyExtensionOfLogin({
      sessionId: loginData.sessionId,
      userId: loginData.userId,
      email: loginData.email,
    });
  }
}
```

---

## 🔄 Option 2: Include Integration Script (5 minutes)

Add this script to your web app's HTML:

```html
<!-- Add BEFORE your other scripts -->
<script src="web-app-integration.js"></script>
```

This will **automatically detect** login API calls and sync with the extension.

---

## 🎯 Option 3: Manual localStorage (1 minute)

If you already store session data in localStorage, just use the **standard keys**:

```javascript
// Instead of your current keys, use these:
localStorage.setItem("sessionId", yourSessionId);
localStorage.setItem("userId", yourUserId);
localStorage.setItem("email", yourEmail);
```

The sync script will automatically detect these standard keys.

---

## 🧪 Testing the Fix

1. **Login to your web app**
2. **Check browser console** - you should see:
   ```
   ✅ Login detected and synced to extension
   ```
3. **Go to a job application site**
4. **Click on a form field** - AI assistant should appear immediately!

---

## 🔍 Debug Commands

Open browser console and run:

```javascript
// Check if session is stored correctly
console.log("Session:", {
  sessionId: localStorage.getItem("sessionId"),
  userId: localStorage.getItem("userId"),
  email: localStorage.getItem("email"),
});

// Check if extension received it
chrome.storage.local.get(["sessionId", "userId", "email"], console.log);

// Manual sync test
window.notifyExtensionOfLogin({
  sessionId: "test-session-123",
  userId: "test-user-456",
  email: "test@example.com",
});
```

---

## 🎉 Expected Result

After the fix:

- ✅ Login to web app → **Automatic sync** → Form filling works immediately
- ❌ No more "Sync with Extension" button needed
- ✅ Seamless user experience across all websites

---

## 💡 Need Help?

If you're still seeing the sync button:

1. **Check browser console** for sync messages
2. **Verify session data** is being stored in localStorage
3. **Make sure** you're using the correct sessionId and userId format
4. **Test** with the debug commands above

The sync should happen **within 2 seconds** of login! 🚀
