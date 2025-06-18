# 🚀 AI Form Assistant - Browser Extension

An intelligent browser extension that uses AI to automatically fill form fields based on your uploaded documents and personal information.

## ✨ Features

- **🧠 AI-Powered Form Filling**: Automatically fills form fields using AI analysis
- **🔐 Secure Authentication**: Session-based authentication with the backend
- **📄 Document Integration**: Uses your uploaded resume and personal info
- **🎯 Smart Field Detection**: Advanced label detection for better accuracy
- **💫 Beautiful UI**: Modern popup interface with status indicators
- **🔄 Real-time Sync**: Syncs with your web app login session

## 🛠️ Installation

### Method 1: Load Unpacked (Development)

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `ai-form-assistant` folder
5. The extension icon should appear in your browser toolbar

### Method 2: From Web App

1. Login to the AI Form Assistant web app
2. Go to the Dashboard
3. In the "Extension Setup" section, click "Download Extension"
4. Follow the installation instructions provided

## 🎯 How to Use

### 1. **Initial Setup**

- Install the browser extension
- Login to the AI Form Assistant web app
- Upload your resume and personal information documents
- In the web app dashboard, click "Login to Extension" to sync your session

### 2. **Using the Extension**

- Navigate to any website with forms
- Click on input fields (text inputs, textareas)
- The AI icon will appear to the left of the field
- Click the AI icon to auto-fill the field with relevant information

### 3. **Extension Popup**

- Click the extension icon in your browser toolbar
- View your login status and document status
- Login/logout directly from the extension
- See real-time status of your uploaded documents

## 🔧 Files Structure

```
ai-form-assistant/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality and authentication
├── content-script.js     # Main form filling logic
├── background.js         # Background service worker
├── ai_popup.png          # Extension icon
└── README.md            # This file
```

## 🌟 Key Components

### Content Script (`content-script.js`)

- Detects form fields and displays AI button
- Handles field analysis and label detection
- Makes API calls to generate field answers
- Manages authentication state

### Popup (`popup.html` + `popup.js`)

- Extension login/logout interface
- Document status display
- Session management
- User information display

### Background Script (`background.js`)

- Handles extension lifecycle events
- Manages cross-tab communication

## 🔐 Authentication Flow

1. **Web App Login**: User logs into the main web application
2. **Extension Sync**: User clicks "Login to Extension" in web app dashboard
3. **Session Transfer**: Session data is copied to extension storage
4. **Form Filling**: Extension uses session for authenticated API calls

## 🎨 UI Features

- **Smart Positioning**: AI button appears next to focused input fields
- **Hover Effects**: Smooth animations and visual feedback
- **Loading States**: Clear indication when AI is processing
- **Error Handling**: Helpful error messages for authentication issues
- **Status Indicators**: Real-time extension and login status

## 🔍 Field Detection

The extension uses multiple strategies to identify form fields:

1. **Label Association**: `<label for="fieldId">` elements
2. **Parent Labels**: Fields wrapped in `<label>` elements
3. **Adjacent Labels**: Labels near the input field
4. **ARIA Labels**: `aria-label` attributes
5. **Placeholders**: Fallback to placeholder text
6. **Name Attributes**: Formatted name attributes

## 🚀 API Integration

The extension communicates with the backend API:

- **Endpoint**: `http://localhost:8000/api/generate-field-answer`
- **Authentication**: Session-based with `Authorization: Session <sessionId>` header
- **Request Data**: Field metadata and context information
- **Response**: AI-generated field value with reasoning

## 🐛 Troubleshooting

### Extension Not Working

- Check if you're logged into the web app
- Verify extension is installed and enabled
- Check browser console for error messages
- Try refreshing the page

### Authentication Issues

- Re-login through the extension popup
- Or use "Login to Extension" button in web app dashboard
- Clear extension storage if needed

### Field Detection Problems

- Check if the form has proper labels
- Look for console logs showing field analysis
- Try different field detection strategies

## 🔧 Development

### Local Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click refresh icon on the extension card
4. Test on various websites

### Console Debugging

- Open Developer Tools (F12)
- Check Console tab for extension logs
- Look for messages starting with 🚀, 🔐, 🧠, etc.

## 📝 License

This extension is part of the AI Form Assistant project.

---

**Need Help?** Check the main web app dashboard for status and troubleshooting tips!
