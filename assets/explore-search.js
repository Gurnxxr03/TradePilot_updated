(function () {
  const MARKET_URL = '/api/market/quote';
  const WATCHLIST_URL = '/api/watchlist';

  document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('market-search-input');
    const stockName = document.getElementById('stock-name');
    const stockPrice = document.getElementById('stock-price');
    const stockChange = document.getElementById('stock-change');
    const stockChangeText = document.getElementById('stock-change-text');
    const watchlistBtn = document.getElementById('watchlist-btn');
    const watchlistBtnText = document.getElementById('watchlist-btn-text');

    if (!searchInput) return; // not on this page

    let currentSymbol = 'NVDA';

    function authHeaders(extra) {
      const h = window.TradePilotAuth ? window.TradePilotAuth.authHeader() : {};
      return { ...h, ...(extra || {}) };
    }

    function applyQuote(symbol, quote) {
      currentSymbol = symbol;
      stockName.textContent = `${symbol} (simulated)`;
      stockPrice.textContent = `$${quote.price.toFixed(2)}`;
      const positive = quote.changePercent >= 0;
      stockChange.className = (positive ? 'text-green-600' : 'text-red-500') + ' font-semibold flex items-center gap-1';
      stockChangeText.textContent = `${positive ? '+' : ''}${quote.changePercent}% (${positive ? '+' : ''}$${Math.abs(quote.changeAbs).toFixed(2)})`;
      watchlistBtnText.textContent = 'Watchlist';
      watchlistBtn.disabled = false;
    }

    async function searchSymbol(symbol) {
      if (!symbol || !symbol.trim()) return;
      try {
        const res = await fetch(`${MARKET_URL}?symbol=${encodeURIComponent(symbol.trim())}`, {
          headers: authHeaders()
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Could not find that symbol.');
          return;
        }
        applyQuote(data.quote.symbol, data.quote);
      } catch (err) {
        alert('Could not reach the server. Make sure it is running (npm start).');
      }
    }

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchSymbol(searchInput.value);
    });

    if (watchlistBtn) {
      watchlistBtn.addEventListener('click', async () => {
        watchlistBtnText.textContent = 'Adding...';
        try {
          const res = await fetch(WATCHLIST_URL, {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ symbol: currentSymbol })
          });
          const data = await res.json();
          watchlistBtnText.textContent = res.ok ? 'Added ✓' : 'Try again';
          if (!res.ok) console.error(data.error);
        } catch (err) {
          watchlistBtnText.textContent = 'Try again';
        }
      });
    }
  });
})();
