const express = require('express');
const { requireAuth } = require('./auth');
const { getMockQuote } = require('./mock-market');

const router = express.Router();

function isValidSymbol(symbol) {
  return typeof symbol === 'string' && /^[A-Za-z]{1,6}$/.test(symbol.trim());
}

// GET /api/market/quote?symbol=AAPL
router.get('/quote', requireAuth, (req, res) => {
  const { symbol } = req.query;
  if (!isValidSymbol(symbol)) {
    return res.status(400).json({ error: 'Please enter a valid stock symbol (letters only, e.g. AAPL).' });
  }
  res.json({ quote: getMockQuote(symbol.trim().toUpperCase()) });
});

module.exports = router;
