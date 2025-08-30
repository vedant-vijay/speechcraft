require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const gTTS = require('gtts');

// ---------------------
// CONFIG & INIT
// ---------------------
const app = express();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DEEPGRAM_API_KEY || !GEMINI_API_KEY) {
  console.error("❌ Missing API keys in .env file. Please set DEEPGRAM_API_KEY and GEMINI_API_KEY.");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Store analysis results temporarily (in production, use a database)
const analysisResults = new Map();

// ---------------------
// ROUTES
// ---------------------

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Serve results page
app.get('/results/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'results.html'));
});

// Get analysis results by ID
app.get('/api/analysis/:id', (req, res) => {
  const analysisId = req.params.id;
  const result = analysisResults.get(analysisId);
  
  if (!result) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  
  res.json(result);
});

// Download corrected audio file
app.get('/api/download/:id', (req, res) => {
  const analysisId = req.params.id;
  const result = analysisResults.get(analysisId);
  
  if (!result || !result.audio) {
    return res.status(404).json({ error: 'Audio file not found' });
  }
  
  const audioBuffer = Buffer.from(result.audio, 'base64');
  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Disposition': `attachment; filename="corrected_speech_${analysisId}.mp3"`
  });
  res.send(audioBuffer);
});

// Main analysis endpoint
app.post('/analyze-speech', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No audio file uploaded',
        message: 'Please select an audio file to analyze'
      });
    }

    console.log('📁 Received file:', req.file.originalname, req.file.size, 'bytes');

    // ---------------------
    // STEP 1: Deepgram Speech-to-Text
    // ---------------------
    const audioPath = path.resolve(req.file.path);
    const audioBuffer = await fs.readFile(audioPath);
    const audioMimeType = req.file.mimetype || 'audio/wav';

    console.log('🎤 Sending to Deepgram...');
    const deepgramResponse = await axios({
      method: 'post',
      url: 'https://api.deepgram.com/v1/listen?punctuate=true&diarize=false',
      headers: {
        'Content-Type': audioMimeType,
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
      data: audioBuffer,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000
    });

    // Clean up uploaded file immediately
    await fs.unlink(audioPath);

    const transcript = deepgramResponse.data?.results?.channels[0]?.alternatives[0]?.transcript;
    console.log('📝 Transcribed:', transcript);

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ 
        error: 'No speech detected',
        message: 'Could not detect any speech in the audio file. Please try again with a clearer recording.'
      });
    }

    // ---------------------
    // STEP 2: Gemini Feedback + Correction
    // ---------------------
    console.log('🤖 Analyzing with Gemini...');
    const prompt = `You are a helpful English language tutor. Analyze the following speech transcript and provide constructive feedback on grammar, pronunciation (based on likely intended words), and fluency.

Transcript: "${transcript}"

Please respond in this exact format:
Feedback: [Provide specific, encouraging feedback about grammar mistakes, word choice, or pronunciation issues. Be constructive and educational.]
Corrected: [Provide the corrected version of the text with proper grammar and word choice]

Keep feedback encouraging and educational. Focus on the most important improvements.`;

    const geminiResponse = await axios({
      method: 'post',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      timeout: 15000
    });

    const aiText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("🧠 Gemini Analysis:", aiText);

    // Extract feedback and corrected version with better parsing
    let feedback = "No specific feedback generated.";
    let correctedText = transcript;

    const feedbackMatch = aiText.match(/Feedback:\s*([\s\S]*?)(?=\nCorrected:|$)/i);
    const correctedMatch = aiText.match(/Corrected:\s*([\s\S]*?)$/i);

    if (feedbackMatch) feedback = feedbackMatch[1].trim();
    if (correctedMatch) correctedText = correctedMatch[1].trim();

    // ---------------------
    // STEP 3: Generate Corrected Audio
    // ---------------------
    console.log('🎵 Generating corrected audio...');
    const tempDir = path.join(__dirname, "temp");
    await fs.mkdir(tempDir, { recursive: true });
    
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correctedAudioPath = path.join(tempDir, `speech_${analysisId}.mp3`);

    const tts = new gTTS(correctedText, 'en');
    await new Promise((resolve, reject) => {
      tts.save(correctedAudioPath, (err) => {
        if (err) {
          console.error('TTS Error:', err);
          reject(new Error('Failed to generate corrected audio'));
        } else {
          resolve();
        }
      });
    });

    const audioBufferCorrected = await fs.readFile(correctedAudioPath);
    const base64Audio = audioBufferCorrected.toString("base64");
    
    // Clean up temp file
    await fs.unlink(correctedAudioPath);

    // ---------------------
    // STEP 4: Store results and return response
    // ---------------------
    const result = {
      id: analysisId,
      transcript,
      feedback,
      correctedText,
      audio: base64Audio,
      timestamp: new Date().toISOString()
    };

    // Store for later retrieval (expires after 1 hour)
    analysisResults.set(analysisId, result);
    setTimeout(() => {
      analysisResults.delete(analysisId);
      console.log(`🗑️ Cleaned up analysis ${analysisId}`);
    }, 3600000); // 1 hour

    console.log('✅ Analysis complete:', analysisId);

    res.json({
      success: true,
      analysisId,
      redirectUrl: `/results/${analysisId}`,
      preview: {
        transcript: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''),
        hasCorrections: correctedText.toLowerCase() !== transcript.toLowerCase()
      }
    });

  } catch (error) {
    console.error('❌ Error processing speech analysis:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('❌ Cleanup error:', cleanupError);
      }
    }

    // Return user-friendly error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(408).json({ 
        error: 'Request timeout',
        message: 'The analysis took too long. Please try with a shorter audio file.'
      });
    }

    if (error.response?.status === 401) {
      return res.status(500).json({ 
        error: 'API authentication failed',
        message: 'There was an issue with the speech analysis service. Please try again later.'
      });
    }

    res.status(500).json({ 
      error: 'Analysis failed',
      message: 'Failed to analyze speech. Please ensure you uploaded a valid audio file and try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeAnalyses: analysisResults.size
  });
});

// ---------------------
// ERROR HANDLING
// ---------------------
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong. Please try again.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ---------------------
// GRACEFUL SHUTDOWN
// ---------------------
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// ---------------------
// START SERVER
// ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Speech Analyzer Server running at http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});