# AI Form Assistant - Browser Extension

A Chrome/Firefox extension that provides AI-powered form filling capabilities using your uploaded resume and personal information.

## 🚀 Features

- **Smart Form Detection**: Automatically detects form fields and shows AI assistance button
- **Intelligent Field Filling**: Uses AI to generate appropriate responses based on field context
- **Secure Authentication**: Login with your account to access your documents
- **Document Status Tracking**: Shows status of uploaded resume and personal info
- **Cross-Site Compatibility**: Works on job sites, forms, and applications

## 📋 Prerequisites

1. **Backend API running** on `http://localhost:8000`
2. **React Web App** with uploaded resume and personal information
3. **User account** created through the web app

## 🛠️ Installation

### Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser_extension_example` folder
5. Extension should appear in your toolbar

### Firefox Extension

1. Open Firefox and go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from `browser_extension_example` folder
5. Extension should appear in your toolbar

## 🎯 How to Use

### 1. Initial Setup

- Click the extension icon in your browser toolbar
- Login with your existing account credentials
- Verify that your resume and personal info show as "Ready"

### 2. Form Filling

- Navigate to any job application or form website
- Click on any input field (text input or textarea)
- An AI button (🤖) will appear to the left of the field
- Click the AI button to automatically fill the field with relevant information

### 3. Supported Sites

- Job boards (LinkedIn, Indeed, Glassdoor)
- Company career pages
- Application forms
- Google Forms
- Any website with form fields

## 🔧 Configuration

### API Endpoints

The extension connects to these backend endpoints:

- `POST /api/simple/login` - User authentication
- `POST /api/simple/register` - User registration
- `GET /api/v1/documents/status` - Check document upload status
- `POST /api/generate-field-answer` - Generate field answers

### Storage

The extension stores:

- Authentication token (JWT)
- User information
- Extension preferences

## 🔍 Troubleshooting

### Authentication Issues

- **403 Forbidden**: Login through extension popup
- **Token expired**: Logout and login again
- **No documents**: Upload resume/personal info via web app

### Form Filling Issues

- **No AI button**: Refresh page and try again
- **Wrong answers**: Check that documents are uploaded correctly
- **Fields not detected**: Try clicking directly on the input field

### Console Debugging

Open browser DevTools (F12) and check:

- Console logs for extension activity
- Network tab for API calls
- Storage tab for saved tokens

## 🏗️ Architecture

```
Browser Extension
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic & authentication
├── content-script.js  # Injected form detection
├── background.js      # Extension lifecycle
└── ai_popup.png       # Extension icon
```

### Content Script Flow

1. Detects form fields on page load
2. Shows AI button when field is focused
3. Sends field context to backend API
4. Receives and fills appropriate answer

### Authentication Flow

1. User logs in through extension popup
2. JWT token stored in extension storage
3. Token sent with all API requests
4. Content script notified of auth status

## 🔐 Security

- JWT tokens stored securely in browser extension storage
- All API calls use HTTPS in production
- No sensitive data stored in content scripts
- Tokens automatically cleared on logout

## 📝 Development

### File Structure

- `manifest.json` - Extension metadata and permissions
- `popup.html/js` - User interface and authentication
- `content-script.js` - Form detection and AI integration
- `background.js` - Extension lifecycle management

### Key Components

- **PopupManager**: Handles login/signup/dashboard
- **Content Script**: Injects AI buttons and handles form filling
- **Background Script**: Manages extension lifecycle

### API Integration

The extension mirrors the React app's authentication and API patterns:

- Same login/signup endpoints
- Same document status checking
- Same field answer generation

## 🌟 Features in Development

- [ ] Keyboard shortcuts for form filling
- [ ] Custom field mappings
- [ ] Form auto-detection improvements
- [ ] Multi-language support
- [ ] Advanced field context analysis

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify backend API is running
3. Ensure documents are uploaded via web app
4. Try refreshing the page and extension

---

**Note**: This extension requires the AI Form Assistant web application and backend API to be running locally for full functionality.
