# 🤖 AI Google Helper - Browser Extension

A simple browser extension that helps fill Google forms automatically using AI. Focused specifically on Google sites with ultra-simple session management.

## 🎯 **What it does**

- **🌐 Google Sites Only**: Works on forms.google.com, docs.google.com, and other Google sites
- **🤖 AI Form Filling**: Click any form field to auto-fill with AI-generated content
- **⚡ Simple Sessions**: One-click registration with persistent login
- **📱 Visual Feedback**: Real-time indicators showing field filling progress

## 🚀 **Quick Setup**

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select this folder: `ai_popup/browser_extension_example/`

### 2. Start Your Backend API

Make sure your API server is running:

```bash
# Your API should be running on http://localhost:8000
# With these endpoints available:
# - POST /api/simple/register
# - POST /api/session/create
# - GET  /api/session/current/{user_id}
# - POST /api/generate-field-answer
```

### 3. Register & Use

1. Click the extension icon in Chrome
2. Enter your email and name
3. Click "Start Using AI Helper"
4. Visit any Google form and click fields to auto-fill!

## 🎯 **How to Use**

### Method 1: Auto-Fill on Click

- Go to any Google form
- Click on any input field
- Watch it fill automatically with AI! 🤖

### Method 2: Keyboard Shortcut

- Focus on any form field
- Press `Ctrl+Shift+F`
- Field gets filled instantly

### Method 3: Visual Indicators

- 🤖 = Ready to fill
- ⏳ = Processing
- ✅ = Successfully filled
- ❌ = Error occurred

## 🌐 **Supported Sites**

- **Google Forms**: forms.google.com
- **Google Docs**: docs.google.com
- **Google Sites**: \*.google.com
- **Gmail**: mail.google.com (form fields)

## 📋 **Simple Database Schema**

This extension uses only the `user_sessions` table for maximum simplicity:

```sql
-- users table (basic info)
users (
  user_id,
  email,
  name,
  created_at
)

-- user_sessions table (session management)
user_sessions (
  session_id,
  user_id,
  device_info,
  is_active,
  created_at,
  last_used_at
)
```

## 🔧 **API Integration**

### Registration Flow

```javascript
// 1. Register user
POST /api/simple/register
{
  "email": "user@gmail.com",
  "name": "John Doe",
  "password": "simple-session"
}

// 2. Create session
POST /api/session/create
{
  "user_id": "user-uuid",
  "device_info": "Chrome Extension - Google Helper"
}

// 3. Store session locally in browser
```

### Form Filling Flow

```javascript
// Fill form field
POST /api/generate-field-answer
{
  "field_name": "email",
  "field_type": "email",
  "field_label": "Email Address",
  "user_id": "user-uuid"
}
```

## 🎨 **Extension Features**

### Background Script (`background.js`)

- Simple session management
- API communication
- Cross-tab session sync

### Content Script (`content-script.js`)

- Google site detection
- Form field identification
- Real-time form filling

### Popup Interface (`popup.html`)

- Clean, Google-style design
- One-click registration
- Session status display

## 🔒 **Privacy & Security**

- **Local Storage**: Session data stored locally in browser
- **Google Only**: Works only on trusted Google domains
- **Simple Auth**: Basic email/name registration (no complex passwords)
- **Session-Based**: Uses session IDs instead of permanent tokens

## 🐛 **Troubleshooting**

### Extension Not Working?

1. Check if API server is running on `http://localhost:8000`
2. Verify you're on a Google site (forms.google.com, docs.google.com)
3. Check browser console for error messages

### Fields Not Filling?

1. Make sure you're registered (click extension icon)
2. Try the keyboard shortcut: `Ctrl+Shift+F`
3. Check if field is supported (text, email, textarea)

### Session Issues?

1. Click extension icon → Sign Out → Register again
2. Clear browser data for the extension
3. Reload the page after re-registering

## 📊 **Performance**

- **First Fill**: ~2-3 seconds (AI processing)
- **Subsequent Fills**: ~1-2 seconds (optimized)
- **Memory Usage**: <5MB (lightweight)
- **Google Sites Only**: No impact on other websites

## 🛠️ **Development**

### File Structure

```
browser_extension_example/
├── manifest.json       # Extension config (Google sites only)
├── background.js       # Session management
├── content-script.js   # Form detection & filling
├── popup.html         # Simple registration UI
├── popup.js           # UI logic
└── README.md          # This file
```

### Testing

1. Load extension in Chrome
2. Visit `forms.google.com/create`
3. Create a test form
4. Fill fields to test auto-fill

---

## 🎉 **That's It!**

Your simple AI Google Helper is ready to use!

- ✅ **One-click setup**
- ✅ **Google sites focused**
- ✅ **Simple session management**
- ✅ **AI-powered form filling**

Just register once and enjoy automatic form filling on all Google sites! 🚀
