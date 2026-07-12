const express = require('express');
const fetch = require('node-fetch');
const { requireAuth } = require('./auth');

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// POST /api/narrative — generates today's AI market narrative summary
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Server is missing GROQ_API_KEY. Check server/.env' });
    }

    const systemPrompt = `You are a financial news summarizer for a trading education app called TradePilot.
Generate a plausible, realistic-sounding "today's market narrative" for a general audience.
Respond ONLY with valid JSON (no markdown fences, no preamble), matching exactly this shape:
{
  "whatHappened": "2-3 sentences describing a plausible market event today",
  "whyItHappened": "2-3 sentences explaining the likely cause",
  "beginnerExplainer": "1 short sentence defining one relevant finance term simply, format: \\"'Term' means ...\\""
}
Keep it realistic in tone but you may invent plausible specifics (this is a demo app, not real financial advice).`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate today\'s market narrative.' }
        ],
        temperature: 0.8,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq narrative error:', errText);
      return res.status(502).json({ error: 'Failed to generate narrative.' });
    }

    const data = await groqResponse.json();
    const raw = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('Could not parse narrative JSON:', raw);
      return res.status(502).json({ error: 'AI returned an unexpected format. Try again.' });
    }

    res.json({
      whatHappened: parsed.whatHappened || 'Markets were relatively quiet today.',
      whyItHappened: parsed.whyItHappened || 'No major catalysts drove significant movement.',
      beginnerExplainer: parsed.beginnerExplainer || ''
    });
  } catch (err) {
    console.error('Narrative error:', err);
    res.status(500).json({ error: 'Something went wrong generating the narrative.' });
  }
});

module.exports = router;
