const fetch = require('node-fetch');
const db = require('./db');
const { getSectorForSymbol } = require('./mock-market');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const MOCK_NEWS_TEMPLATES = [
  {
    title: (sym) => `${sym} Unveils Strategic Product Expansion Amid Growing Market Demand`,
    description: (sym) => `Industry sources indicate that ${sym} is ramping up production of its next-generation offerings. Analysts expect this expansion to significantly enhance competitive advantage heading into the next fiscal quarter.`
  },
  {
    title: (sym) => `${sym} Ratings Upgraded by Analysts Citing Solid Financial Health`,
    description: (sym) => `A leading investment bank has upgraded its rating for ${sym}, citing robust margin expansion potential and strong balance sheet health driven by operational efficiencies.`
  },
  {
    title: (sym) => `How ${sym}'s Sector Positioning Helps It Shield From Inflationary Pressures`,
    description: (sym) => `With macroeconomic uncertainties, stock market experts highlight ${sym} as a resilient holding, backed by high consumer loyalty and strong pricing power.`
  },
  {
    title: (sym) => `Institutional Holdings in ${sym} Reach Multi-Year High as Trading Volume Spikes`,
    description: (sym) => `SEC filings reveal that major mutual funds and institutions have increased their stake in ${sym} significantly. Market indicators suggest strong accumulation at current price levels.`
  }
];

function hashSymbol(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % 100000;
  }
  return hash;
}

function getDeterministicMockNews(symbol) {
  const seed = hashSymbol(symbol);
  const hourSinceEpoch = Math.floor(Date.now() / 3600000);
  
  const stories = [];
  const count = 2;
  for (let i = 0; i < count; i++) {
    const idx = (seed + i + Math.floor(hourSinceEpoch / 12)) % MOCK_NEWS_TEMPLATES.length;
    const template = MOCK_NEWS_TEMPLATES[idx];
    stories.push({
      symbol,
      title: template.title(symbol),
      description: template.description(symbol),
      url: `https://finance.yahoo.com/quote/${symbol.toUpperCase()}/news`
    });
  }
  return stories;
}

async function fetchFromGroq(symbol) {
  if (!GROQ_API_KEY) {
    throw new Error('No Groq key');
  }
  
  const sector = getSectorForSymbol(symbol);
  const systemPrompt = `You are a financial news generator for TradePilot.
Generate 2 realistic, plausible recent news headlines with a summary and a mock URL for the stock symbol: ${symbol} (Sector: ${sector}).
Respond ONLY with a valid JSON object matching this schema:
{
  "news": [
    {
      "symbol": "${symbol}",
      "title": "A headline here",
      "description": "2-3 sentences summary",
      "url": "https://finance.example.com/news/story"
    }
  ]
}
Do not include markdown code block formatting or any explanation. Only output the raw JSON.`;

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
        { role: 'user', content: `Generate news for ${symbol}.` }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })
  });

  if (!groqResponse.ok) {
    throw new Error('Groq failed');
  }

  const data = await groqResponse.json();
  const raw = data.choices?.[0]?.message?.content || '{"news":[]}';
  
  let parsed = JSON.parse(raw);
  let newsList = parsed.news;
  if (!Array.isArray(newsList)) {
    if (Array.isArray(parsed)) {
      newsList = parsed;
    } else {
      throw new Error('Invalid JSON format');
    }
  }
  return newsList.map(item => ({
    symbol: symbol,
    title: item.title || `${symbol} updates`,
    description: item.description || 'No description available.',
    url: `https://finance.yahoo.com/quote/${symbol.toUpperCase()}/news`
  }));
}

async function getOrGenerateNews(table, symbols) {
  if (!symbols || symbols.length === 0) return [];
  
  // 1. Fetch current cached news from DB
  let cached = await db.getNewsForSymbols(table, symbols);
  
  // Filter cached to only keep those less than 30 minutes old
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const activeCached = cached.filter(item => new Date(item.createdAt) > thirtyMinsAgo);
  
  // Check which symbols don't have news cached
  const cachedSymbols = new Set(activeCached.map(c => c.symbol));
  const missingSymbols = symbols.filter(s => !cachedSymbols.has(s));
  
  let generatedItems = [];
  if (missingSymbols.length > 0) {
    for (const symbol of missingSymbols) {
      let newsList = [];
      try {
        newsList = await fetchFromGroq(symbol);
      } catch (err) {
        console.log(`Groq news generation failed for ${symbol}, falling back to mock:`, err.message);
        newsList = getDeterministicMockNews(symbol);
      }
      
      for (const item of newsList) {
        try {
          const saved = await db.saveNewsItem(table, item);
          generatedItems.push(saved);
        } catch (dbErr) {
          console.error(`Failed to save news item for ${symbol}:`, dbErr);
        }
      }
    }
  }
  
  // Merge active cached and new generated items, then sort by createdAt DESC
  const allNews = [...activeCached, ...generatedItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return allNews;
}

module.exports = { getOrGenerateNews };
