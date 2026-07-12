const express = require('express');
const db = require('./db');
const { requireAuth } = require('./auth');
const { getMockQuote } = require('./mock-market');

const router = express.Router();

function isValidSymbol(symbol) {
  return typeof symbol === 'string' && /^[A-Za-z]{1,6}$/.test(symbol.trim());
}

// GET /api/portfolio — list holdings with live (mock) valuation
router.get('/', requireAuth, async (req, res) => {
  try {
    const holdings = await db.listHoldings(req.user.id);

    let totalValue = 0;
    let totalCost = 0;

    const enriched = holdings.map((h) => {
      const quote = getMockQuote(h.symbol);
      const quantity = Number(h.quantity);
      const avgCost = Number(h.avgCost);
      const marketValue = quote.price * quantity;
      const costBasis = avgCost * quantity;
      const gain = marketValue - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      totalValue += marketValue;
      totalCost += costBasis;

      return {
        ...h,
        currentPrice: quote.price,
        marketValue: Math.round(marketValue * 100) / 100,
        gain: Math.round(gain * 100) / 100,
        gainPercent: Math.round(gainPercent * 100) / 100
      };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    res.json({
      holdings: enriched,
      summary: {
        totalValue: Math.round(totalValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalGain: Math.round(totalGain * 100) / 100,
        totalGainPercent: Math.round(totalGainPercent * 100) / 100
      }
    });
  } catch (err) {
    console.error('List holdings error:', err);
    res.status(500).json({ error: 'Could not load portfolio.' });
  }
});

// POST /api/portfolio — add a holding
router.post('/', requireAuth, async (req, res) => {
  try {
    const { symbol, quantity, avgCost } = req.body;

    if (!isValidSymbol(symbol)) {
      return res.status(400).json({ error: 'Please enter a valid stock symbol (letters only, e.g. AAPL).' });
    }
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Please enter a valid quantity greater than 0.' });
    }
    const cost = Number(avgCost);
    if (!avgCost || isNaN(cost) || cost <= 0) {
      return res.status(400).json({ error: 'Please enter a valid average cost per share.' });
    }

    const holding = await db.createHolding(req.user.id, {
      symbol: symbol.trim().toUpperCase(),
      quantity: qty,
      avgCost: cost
    });

    res.json({ holding });
  } catch (err) {
    console.error('Create holding error:', err);
    res.status(500).json({ error: 'Could not add holding.' });
  }
});

// DELETE /api/portfolio/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await db.deleteHolding(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Holding not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete holding error:', err);
    res.status(500).json({ error: 'Could not delete holding.' });
  }
});

module.exports = router;
