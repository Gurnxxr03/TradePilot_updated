const express = require('express');
const db = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();

// Static question bank — simple and fast, no AI call needed for this feature.
const QUESTIONS = [
  {
    question: "What does a 'Death Cross' indicate in technical analysis?",
    options: ['Bullish Momentum', 'Bearish Long-term Trend', 'Volume Spike Only'],
    correctIndex: 1
  },
  {
    question: "What does 'P/E Ratio' stand for?",
    options: ['Price-to-Equity Ratio', 'Price-to-Earnings Ratio', 'Profit-to-Expense Ratio'],
    correctIndex: 1
  },
  {
    question: 'What is "diversification" in investing?',
    options: [
      'Putting all your money into one high-growth stock',
      'Spreading investments across different assets to reduce risk',
      'Selling all your assets during a downturn'
    ],
    correctIndex: 1
  },
  {
    question: "What does 'RSI' (Relative Strength Index) measure?",
    options: [
      'Whether a stock is overbought or oversold',
      'A company\'s total revenue',
      'The number of shares traded'
    ],
    correctIndex: 0
  },
  {
    question: 'What is a "bull market"?',
    options: [
      'A period of falling prices',
      'A period of rising prices and investor optimism',
      'A market with no trading activity'
    ],
    correctIndex: 1
  },
  {
    question: 'What does "liquidity" refer to in finance?',
    options: [
      'How easily an asset can be bought or sold without affecting its price',
      'The total debt a company holds',
      'The interest rate on a savings account'
    ],
    correctIndex: 0
  },
  {
    question: 'What is a "dividend"?',
    options: [
      'A fee paid to a stockbroker',
      'A portion of a company\'s profits paid to shareholders',
      'A type of loan between companies'
    ],
    correctIndex: 1
  }
];

// GET /api/quiz/questions — returns questions WITHOUT correct answers (checked server-side)
router.get('/questions', requireAuth, (req, res) => {
  const publicQuestions = QUESTIONS.map(({ question, options }, index) => ({
    id: index,
    question,
    options
  }));
  res.json({ questions: publicQuestions });
});

// POST /api/quiz/submit — body: { answers: { "0": 1, "1": 0, ... } } (questionId -> chosen option index)
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Missing answers.' });
    }

    let score = 0;
    const total = QUESTIONS.length;
    const results = QUESTIONS.map((q, id) => {
      const chosen = answers[id];
      const correct = chosen === q.correctIndex;
      if (correct) score += 1;
      return { id, correct, correctIndex: q.correctIndex, chosen };
    });

    const attempt = await db.saveQuizAttempt(req.user.id, score, total);

    res.json({ score, total, results, attempt });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Could not save your quiz results.' });
  }
});

// GET /api/quiz/best — this user's best past score
router.get('/best', requireAuth, async (req, res) => {
  try {
    const best = await db.getBestQuizAttempt(req.user.id);
    res.json({ best });
  } catch (err) {
    console.error('Get best quiz error:', err);
    res.status(500).json({ error: 'Could not load past results.' });
  }
});

module.exports = router;
