// Mock market data — since this app has no real live market feed, alerts are
// checked against a deterministic "simulated" price that drifts over time.
// Swap this out for a real market data API later without changing anything
// else (alerts.js only calls getMockPrice()).

const BASE_PRICES = {
  NVDA: 894.52,
  AAPL: 214.1,
  TSLA: 248.3,
  BTC: 67500,
  SPY: 528.4,
  MSFT: 441.2,
  GOOGL: 178.9,
  AMZN: 187.4
};

function hashSymbol(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % 100000;
  }
  return hash;
}

// Returns a plausible "current price" for a symbol: a base price plus a slow,
// deterministic sine-wave drift based on the current time, so it changes
// gradually rather than jumping around randomly on every request.
function getMockPrice(symbolRaw) {
  const symbol = symbolRaw.trim().toUpperCase();
  const base = BASE_PRICES[symbol] || 100 + (hashSymbol(symbol) % 400);
  const seed = hashSymbol(symbol);
  const minutesSinceEpoch = Math.floor(Date.now() / 60000);
  const wave = Math.sin((minutesSinceEpoch + seed) / 45) * 0.03; // +/- 3% drift
  const price = base * (1 + wave);
  return Math.round(price * 100) / 100;
}

// Returns a fuller quote: current price plus a plausible day-change percent,
// both deterministic based on the symbol and current time.
function getMockQuote(symbolRaw) {
  const symbol = symbolRaw.trim().toUpperCase();
  const price = getMockPrice(symbol);
  const seed = hashSymbol(symbol);
  const minutesSinceEpoch = Math.floor(Date.now() / 60000);
  const changeWave = Math.sin((minutesSinceEpoch + seed * 2) / 30);
  const changePercent = Math.round(changeWave * 3 * 100) / 100; // +/- 3%
  const changeAbs = Math.round(price * (changePercent / 100) * 100) / 100;
  return { symbol, price, changePercent, changeAbs };
}

module.exports = { getMockPrice, getMockQuote };
