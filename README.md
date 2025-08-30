# 🎤 Speech Analyzer - AI-Powered English Learning Tool

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)

A comprehensive speech analysis tool that helps users improve their English pronunciation, grammar, and fluency using AI-powered feedback. Upload or record your speech and get instant corrections with downloadable improved audio.

## 🌟 Features

- **🎵 Audio Input Options**
  - Upload audio files (MP3, WAV, M4A, etc.)
  - Live microphone recording with browser support
  - Drag & drop file upload interface

- **🤖 AI-Powered Analysis**
  - Speech-to-text transcription via Deepgram API
  - Grammar and pronunciation feedback via Google Gemini AI
  - Intelligent error detection and correction suggestions

- **🔊 Audio Generation**
  - Text-to-speech conversion of corrected version
  - Downloadable corrected audio files
  - Side-by-side comparison of original vs corrected

- **💻 Modern UI/UX**
  - Responsive design for all devices
  - Real-time feedback and loading states
  - Intuitive two-page workflow
  - Progressive enhancement with graceful fallbacks

## 🚀 Demo

![Speech Analyzer Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=Speech+Analyzer+Demo)

**Live Demo**: [Add your deployed URL here]

## 📋 Prerequisites

- **Node.js** 16.0 or higher
- **NPM** or **Yarn** package manager
- **Deepgram API Key** (for speech-to-text)
- **Google Gemini API Key** (for AI analysis)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/speech-analyzer.git
cd speech-analyzer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Add your API keys to `.env`:
```env
DEEPGRAM_API_KEY=your_deepgram_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

### 4. Get API Keys

#### Deepgram API Key:
1. Visit [Deepgram Console](https://console.deepgram.com/)
2. Create an account and new project
3. Copy your API key from the dashboard

#### Google Gemini API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in and create a new API key
3. Copy the generated key

### 5. Start the Application
```bash
# Development mode with auto-reload
npm run dev
# This runs: nodemon app.js

# Production mode  
npm start
# This runs: node app.js
```

Visit `http://localhost:3000` to use the application.

## 📁 Project Structure

```
speech-analyzer/
├── app.js                # Main Express server
├── package.json          # Project dependencies  
├── package-lock.json     # Dependency lock file
├── .env                  # Environment variables (create from .env.example)
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── LICENSE              # MIT license
├── frontend/
│   ├── index.html       # Landing page with upload/record
│   └── results.html     # Analysis results page
├── uploads/             # Temporary audio uploads (auto-created)
└── temp/                # Temporary generated files (auto-created)
```

## 🔄 How It Works

### User Journey:
1. **Upload/Record** → User provides audio input via file upload or live recording
2. **Analyze** → Click analyze button to process the speech
3. **Results** → Get redirected to results page with detailed feedback
4. **Download** → Access corrected audio file and analysis

### Technical Flow:
1. **Speech-to-Text**: Deepgram API converts audio to text transcript
2. **AI Analysis**: Gemini AI analyzes transcript for grammar/pronunciation errors
3. **Text Correction**: AI provides corrected version with educational feedback
4. **Audio Generation**: gTTS creates audio file of corrected speech
5. **Results Display**: User sees original vs corrected with downloadable audio

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Landing page |
| `GET` | `/results/:id` | Results page |
| `POST` | `/analyze-speech` | Main analysis endpoint |
| `GET` | `/api/analysis/:id` | Get analysis results |
| `GET` | `/api/download/:id` | Download corrected audio |
| `GET` | `/api/health` | Health check |

## 🎯 Usage Examples

### Upload Audio File
```javascript
const formData = new FormData();
formData.append('audio', audioFile);

const response = await fetch('/analyze-speech', {
    method: 'POST',
    body: formData
});

const result = await response.json();
// Returns: { success: true, analysisId: "...", redirectUrl: "/results/..." }
```

### Get Results
```javascript
const response = await fetch(`/api/analysis/${analysisId}`);
const data = await response.json();
// Returns: { transcript, feedback, correctedText, audio: "base64..." }
```

## 🔒 Security & Privacy

- **File Cleanup**: Uploaded files are automatically deleted after processing
- **Result Expiration**: Analysis results expire after 1 hour
- **File Size Limits**: 50MB maximum file size to prevent abuse
- **Input Validation**: Proper file type and content validation
- **Error Handling**: Secure error messages without exposing sensitive data

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment (Heroku Example)
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set DEEPGRAM_API_KEY=your_key
heroku config:set GEMINI_API_KEY=your_key
git push heroku main
```

### Environment Variables for Production
```env
NODE_ENV=production
DEEPGRAM_API_KEY=your_production_key
GEMINI_API_KEY=your_production_key
PORT=3000
```

## 🧪 Testing

### Manual Testing
1. Test file upload with various audio formats
2. Test microphone recording functionality
3. Verify analysis pipeline with sample audio
4. Check download functionality
5. Test error scenarios (large files, invalid formats)

### API Testing with cURL
```bash
# Health check
curl http://localhost:3000/api/health

# Upload audio file
curl -X POST -F "audio=@sample.wav" http://localhost:3000/analyze-speech
```

## 🐛 Troubleshooting

### Common Issues:

| Problem | Solution |
|---------|----------|
| Missing API keys error | Check `.env` file exists and contains valid keys |
| Audio upload fails | Verify file size (<50MB) and format (audio/*) |
| Recording doesn't work | Allow microphone permissions in browser |
| gTTS errors | Check internet connection and text content |
| Analysis timeout | Try shorter audio files (<5 minutes) |

### Browser Compatibility:
- **Chrome**: Full support including recording
- **Firefox**: Full support including recording
- **Safari**: Upload only (recording requires HTTPS)
- **Edge**: Full support including recording

## 📊 Performance Considerations

- **File Processing**: Average 2-5 seconds per minute of audio
- **Memory Usage**: Results stored in memory (consider Redis for scale)
- **Rate Limits**: Deepgram and Gemini APIs have usage quotas
- **File Cleanup**: Automatic cleanup prevents disk space issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines:
- Follow existing code style and structure
- Add comments for complex logic
- Test thoroughly before submitting
- Update README if adding new features

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Deepgram](https://deepgram.com/)** - Excellent speech-to-text API
- **[Google Gemini](https://ai.google.dev/)** - Powerful language analysis
- **[gTTS](https://github.com/pndurette/gTTS)** - Google Text-to-Speech
- **[Express.js](https://expressjs.com/)** - Web framework
- **[Multer](https://github.com/expressjs/multer)** - File upload handling

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/yourusername/speech-analyzer/issues)
3. Create a new issue with detailed description
4. For API-related issues, check respective documentation:
   - [Deepgram Docs](https://developers.deepgram.com/)
   - [Gemini API Docs](https://ai.google.dev/docs)

## 🎯 Future Enhancements

- [ ] User authentication and speech history
- [ ] Multiple language support
- [ ] Advanced pronunciation scoring
- [ ] Integration with more TTS voices
- [ ] Mobile app development
- [ ] Batch processing for multiple files
- [ ] Progress tracking and learning analytics
- [ ] Custom feedback preferences

---

**Made with ❤️ for English language learners worldwide**

⭐ **Star this repo if it helped you improve your English!**