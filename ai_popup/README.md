# 🧠 AI Form Assistant

An intelligent form filling system that uses AI to automatically populate form fields based on context. The system consists of a React frontend and a FastAPI backend with vector database integration.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- PostgreSQL database
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:

```bash
cd ../backend_ai_popup
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
# Create .env file with:
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_form_filler
```

4. Start the backend server:

```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd ai_popup
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🎯 How It Works

1. **Enable AI Assistant**: Click the "Enable AI Assistant" button on the web page
2. **Focus on Input**: Click on any input field or textarea
3. **AI Popup**: An AI brain icon appears next to the focused field
4. **Get AI Answer**: Click the brain icon to get an AI-generated answer

The system uses:

- **Vector Database**: Stores and retrieves resume and personal information
- **OpenAI Integration**: Generates contextual answers when data is not available
- **Smart Field Detection**: Analyzes field labels, placeholders, and context

## 🔧 Browser Extension

You can also use this as a browser extension:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `ai-popup-extension` folder
4. The extension will work on any website!

## 📡 API Endpoints

- `POST /api/generate-field-answer` - Generate answer for a specific field
- `POST /api/v1/resume/reembed` - Re-embed resume data
- `POST /api/v1/personal-info/reembed` - Re-embed personal info
- `GET /api/v1/documents/status` - Check document status
- `GET /health` - Health check

## 🛠 Development

### Frontend Development

```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run lint    # Run ESLint
```

### Backend Development

```bash
python main.py  # Start FastAPI server
python test_api.py  # Run API tests
```

## 🎨 Features

- ✅ Real-time AI form filling
- ✅ Vector database integration
- ✅ Browser extension support
- ✅ React web app
- ✅ FastAPI backend
- ✅ CORS enabled
- ✅ Error handling
- ✅ Loading states

## 🚨 Troubleshooting

1. **CORS Issues**: Make sure the backend is running on `http://localhost:8000`
2. **API Errors**: Check that your OpenAI API key is valid
3. **Database Issues**: Ensure PostgreSQL is running and accessible
4. **Extension Issues**: Check browser console for errors

## 📦 Project Structure

```
ai_popup/
├── src/
│   ├── App.tsx              # Main React app
│   ├── PopupInjector.tsx    # AI popup logic
│   └── ...
├── ai-popup-extension/      # Browser extension
│   ├── manifest.json
│   └── content.js
└── package.json

../backend_ai_popup/
├── main.py                  # FastAPI server
├── app/                     # Application modules
├── requirements.txt
└── ...
```
