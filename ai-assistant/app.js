require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint to fetch places from Google Maps
app.post('/api/search-places', async (req, res) => {
  const { query } = req.body;
  try {
    const location = await axios.get(
      `https://api.geoapify.com/v2/places?categories=catering.restaurant&filter=circle:77.5946,12.9716,5000&apiKey=${process.env.GEOAPIFY_API_KEY}`
    );
    res.json(location.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get data from Google Maps API' });
  }
});

// Endpoint to summarize content using Gemini (or a free AI API)
app.post('/api/summarize', async (req, res) => {
  const { content } = req.body;
  try {
    // Example using Gemini API
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: content }] }]
      }
    );
    const summary = response.data.candidates[0].content.parts.text;

    // Store summary in /summaries
    if (!fs.existsSync('summaries')) fs.mkdirSync('summaries');
    const filePath = path.join(__dirname, 'summaries', `summary_${Date.now()}.txt`);
    fs.writeFileSync(filePath, summary);

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'AI Summarization failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
