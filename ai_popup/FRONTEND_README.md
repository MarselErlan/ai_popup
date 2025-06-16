# AI Form Assistant Frontend

A modern web application for managing your AI-powered form filling extension. This frontend provides a secure login system and dashboard for uploading your resume and personal information to enhance the AI's form filling capabilities.

## Features

### 🔐 Authentication System

- Secure login with email/password
- User registration (signup) with validation
- Session management with automatic token handling
- Demo mode for testing without backend
- Seamless switching between login and signup

### 📊 Dashboard

- **Extension Setup**: Step-by-step installation instructions
- **Extension Download**: Direct download of the browser extension
- **Resume Upload**: Upload your resume (PDF, DOC, DOCX)
- **Personal Info Upload**: Upload additional personal information
- **File Management**: Track upload status and success/error messages

### 🎨 Modern UI/UX

- Responsive design that works on all devices
- Clean, professional interface
- Real-time feedback and loading states
- Gradient backgrounds and modern styling

## Demo Credentials

For testing purposes, you can use these demo credentials:

- **Email**: `demo@example.com`
- **Password**: `demo123`

Alternative demo account:

- **Email**: `test@test.com`
- **Password**: `test123`

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AI Form Assistant backend running (optional - has fallback demo mode)

### Installation

1. **Clone and navigate to the project**:

   ```bash
   cd ai_popup
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Production Build

```bash
npm run build
npm run preview
```

## Backend Integration

The frontend is designed to work with the AI Form Assistant backend API. It expects these endpoints:

### Authentication

- `POST /api/login` - User login

  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```

- `POST /api/signup` - User registration
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password"
  }
  ```

### File Uploads

- `POST /api/upload-resume` - Upload resume file
- `POST /api/upload-personal-info` - Upload personal information file

Both upload endpoints expect:

- `file`: The uploaded file (multipart/form-data)
- `user_id`: User identifier
- `Authorization: Bearer <token>` header

### Demo Mode

If the backend is not available, the frontend automatically falls back to demo mode:

- Mock authentication with demo credentials
- Simulated file uploads
- All functionality works for testing purposes

## Project Structure

```
src/
├── components/
│   ├── Login.tsx          # Login page component
│   ├── Dashboard.tsx      # Main dashboard component
├── services/
│   └── authService.ts     # Authentication and API service
├── App.tsx                # Main app component with routing
├── main.tsx               # App entry point
└── assets/                # Static assets (logo, etc.)

public/
├── ai_popup.png           # Application logo
└── ai-popup-extension.zip # Extension download file
```

## Key Components

### Login Component (`src/components/Login.tsx`)

- Handles user authentication
- Modern form design with validation
- Error handling and loading states
- Demo credentials display
- Switch to signup functionality

### Signup Component (`src/components/Signup.tsx`)

- User registration with form validation
- Password confirmation matching
- Email uniqueness checking (demo mode)
- Modern responsive design
- Switch to login functionality

### Dashboard Component (`src/components/Dashboard.tsx`)

- Main user interface after login
- Extension installation instructions
- File upload functionality
- User account management

### Auth Service (`src/services/authService.ts`)

- Centralized API communication
- Token management
- Automatic fallback to demo mode
- Error handling and retry logic

## Customization

### Styling

The application uses inline styles for simplicity but can be easily customized:

- Colors: Update the gradient and color values in components
- Layout: Modify the grid and flexbox layouts
- Typography: Change font sizes and weights

### API Configuration

Update the API base URL in `src/services/authService.ts`:

```typescript
const API_BASE_URL = "http://your-backend-url/api";
```

### Demo Credentials

Modify demo users in `authService.ts` mockLogin function:

```typescript
const validUsers = [
  {
    email: "your@email.com",
    password: "yourpassword",
    id: "1",
    name: "Your Name",
  },
];
```

## Extension Integration

The dashboard provides:

1. **Download Link**: Pre-packaged extension as a zip file
2. **Installation Instructions**: Step-by-step Chrome extension setup
3. **File Uploads**: Resume and personal info for AI context

The uploaded files enhance the AI's ability to fill forms with relevant personal information.

## Troubleshooting

### Common Issues

1. **Login not working**:

   - Check if backend is running on port 8000
   - Use demo credentials for testing
   - Check browser console for errors

2. **File uploads failing**:

   - Ensure file types are supported (PDF, DOC, DOCX, TXT)
   - Check file size limits
   - Verify backend endpoints are available

3. **Extension download not working**:
   - Ensure `ai-popup-extension.zip` exists in `/public` folder
   - Check file permissions

### Development Issues

1. **Port conflicts**:

   - Frontend runs on port 5173 by default
   - Use `npm run dev -- --port 3000` for different port

2. **Dependencies**:
   - Run `npm install` to ensure all packages are installed
   - Clear node_modules and reinstall if issues persist

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the AI Form Assistant system. See main project for license details.

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure backend API is accessible
4. Test with demo credentials first
