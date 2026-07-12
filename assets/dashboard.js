(function () {
  const PORTFOLIO_URL = '/api/portfolio';
  const WATCHLIST_URL = '/api/watchlist';

  document.addEventListener('DOMContentLoaded', function () {
    const holdingsList = document.getElementById('holdings-list');
    const holdingsEmpty = document.getElementById('holdings-empty-state');
    const addBtn = document.getElementById('add-holding-btn');
    const form = document.getElementById('add-holding-form');
    const saveBtn = document.getElementById('save-holding-btn');
    const formError = document.getElementById('holding-form-error');
    const summaryBox = document.getElementById('holdings-summary');
    const totalValueEl = document.getElementById('holdings-total-value');
    const totalGainEl = document.getElementById('holdings-total-gain');

    const symbolInput = document.getElementById('holding-symbol');
    const quantityInput = document.getElementById('holding-quantity');
    const avgCostInput = document.getElementById('holding-avg-cost');

    const watchlistContainer = document.getElementById('dashboard-watchlist');
    const watchlistEmpty = document.getElementById('watchlist-empty-state');

    if (!holdingsList) return; // not on this page

    function authHeaders(extra) {
      const h = window.TradePilotAuth ? window.TradePilotAuth.authHeader() : {};
      return { ...h, ...(extra || {}) };
    }

    function fmtMoney(n) {
      return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // --- Holdings ---
    function renderHoldings(holdings, summary) {
      holdingsList.querySelectorAll('.holding-row').forEach((el) => el.remove());

      if (!holdings || holdings.length === 0) {
        holdingsEmpty.classList.remove('hidden');
        summaryBox.classList.add('hidden');
        return;
      }
      holdingsEmpty.classList.add('hidden');
      summaryBox.classList.remove('hidden');

      totalValueEl.textContent = fmtMoney(summary.totalValue);
      const gainPositive = summary.totalGain >= 0;
      totalGainEl.textContent = `${gainPositive ? '+' : ''}${fmtMoney(summary.totalGain)} (${gainPositive ? '+' : ''}${summary.totalGainPercent}%)`;
      totalGainEl.className = 'text-label-sm ' + (gainPositive ? 'text-green-600' : 'text-red-500');

      holdings.forEach((h) => {
        const gainPositive = h.gain >= 0;
        const row = document.createElement('div');
        row.className = 'holding-row flex flex-wrap justify-between items-center p-sm border border-outline-variant/20 rounded-xl gap-sm';
        row.innerHTML = `
          <div class="flex items-center gap-sm">
            <div class="w-10 h-10 bg-primary-container/20 rounded-lg flex items-center justify-center font-bold text-primary">${h.symbol.slice(0, 2)}</div>
            <div>
              <p class="font-bold text-label-md dark:text-inverse-on-surface">${h.symbol}</p>
              <p class="text-label-sm text-on-surface-variant">${h.quantity} shares @ ${fmtMoney(h.avgCost)}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-label-md dark:text-inverse-on-surface">${fmtMoney(h.marketValue)}</p>
            <p class="text-label-sm ${gainPositive ? 'text-green-600' : 'text-red-500'}">${gainPositive ? '+' : ''}${fmtMoney(h.gain)} (${gainPositive ? '+' : ''}${h.gainPercent}%)</p>
          </div>
          <button class="delete-holding-btn text-error text-label-sm font-bold hover:underline" data-id="${h.id}">Remove</button>
        `;
        holdingsList.appendChild(row);
      });

      holdingsList.querySelectorAll('.delete-holding-btn').forEach((btn) => {
        btn.addEventListener('click', () => deleteHolding(btn.getAttribute('data-id')));
      });
    }

    async function loadHoldings() {
      try {
        const res = await fetch(PORTFOLIO_URL, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) renderHoldings(data.holdings, data.summary);
      } catch (err) {
        console.error('Could not load holdings', err);
      }
    }

    async function deleteHolding(id) {
      try {
        await fetch(`${PORTFOLIO_URL}/${id}`, { method: 'DELETE', headers: authHeaders() });
        loadHoldings();
      } catch (err) {
        console.error('Could not delete holding', err);
      }
    }

    async function saveHolding() {
      formError.classList.add('hidden');
      const payload = {
        symbol: symbolInput.value.trim(),
        quantity: quantityInput.value,
        avgCost: avgCostInput.value
      };

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const res = await fetch(PORTFOLIO_URL, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          formError.textContent = data.error || 'Could not add holding.';
          formError.classList.remove('hidden');
          return;
        }

        symbolInput.value = '';
        quantityInput.value = '';
        avgCostInput.value = '';
        form.classList.add('hidden');
        loadHoldings();
      } catch (err) {
        formError.textContent = 'Could not reach the server. Make sure it is running (npm start).';
        formError.classList.remove('hidden');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    }

    addBtn.addEventListener('click', () => form.classList.toggle('hidden'));
    saveBtn.addEventListener('click', saveHolding);

    // --- Watchlist (read-only display here; adding happens from Explore) ---
    async function loadWatchlist() {
      try {
        const res = await fetch(WATCHLIST_URL, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) return;

        watchlistContainer.querySelectorAll('.watchlist-row').forEach((el) => el.remove());

        if (!data.watchlist || data.watchlist.length === 0) {
          watchlistEmpty.classList.remove('hidden');
          return;
        }
        watchlistEmpty.classList.add('hidden');

        data.watchlist.forEach((item) => {
          const changePositive = item.quote.changePercent >= 0;
          const row = document.createElement('div');
          row.className = 'watchlist-row flex justify-between items-center p-xs hover:bg-surface-container rounded-xl transition-colors group';
          row.innerHTML = `
            <div class="flex items-center gap-sm">
              <div class="w-10 h-10 bg-primary-container/20 rounded-lg flex items-center justify-center font-bold text-primary">${item.symbol.slice(0, 2)}</div>
              <div>
                <p class="text-label-md font-bold dark:text-inverse-on-surface">${item.symbol}</p>
                <p class="text-[10px] text-on-surface-variant">${fmtMoney(item.quote.price)}</p>
              </div>
            </div>
            <div class="flex items-center gap-xs">
              <span class="text-label-sm font-bold ${changePositive ? 'text-green-600' : 'text-red-500'}">${changePositive ? '+' : ''}${item.quote.changePercent}%</span>
              <button class="remove-watchlist-btn material-symbols-outlined text-[16px] text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity" data-id="${item.id}">close</button>
            </div>
          `;
          watchlistContainer.appendChild(row);
        });

        watchlistContainer.querySelectorAll('.remove-watchlist-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            await fetch(`${WATCHLIST_URL}/${btn.getAttribute('data-id')}`, { method: 'DELETE', headers: authHeaders() });
            loadWatchlist();
          });
        });
      } catch (err) {
        console.error('Could not load watchlist', err);
      }
    }

    // Set dynamic username
    const user = window.TradePilotAuth.getUser();
    if (user) {
      const nameEl = document.getElementById('dashboard-user-name');
      if (nameEl) nameEl.textContent = user.name || user.email.split('@')[0];
    }

    // --- Watchlist Manual Add ---
    const addWatchlistBtn = document.getElementById('add-watchlist-btn');
    const addWatchlistForm = document.getElementById('add-watchlist-form');
    const watchlistSymbolInput = document.getElementById('watchlist-symbol');
    const saveWatchlistBtn = document.getElementById('save-watchlist-btn');
    const watchlistError = document.getElementById('watchlist-form-error');

    if (addWatchlistBtn && addWatchlistForm) {
      addWatchlistBtn.addEventListener('click', () => {
        addWatchlistForm.classList.toggle('hidden');
        watchlistSymbolInput.focus();
      });
      
      saveWatchlistBtn.addEventListener('click', async () => {
        watchlistError.classList.add('hidden');
        const symbol = watchlistSymbolInput.value.trim().toUpperCase();
        if (!symbol || !/^[A-Z]{1,6}$/.test(symbol)) {
          watchlistError.textContent = 'Please enter a valid stock symbol (1-6 letters).';
          watchlistError.classList.remove('hidden');
          return;
        }
        
        saveWatchlistBtn.disabled = true;
        saveWatchlistBtn.textContent = 'Adding...';
        
        try {
          const res = await fetch(WATCHLIST_URL, {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ symbol })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to add to watchlist.');
          }
          watchlistSymbolInput.value = '';
          addWatchlistForm.classList.add('hidden');
          loadWatchlist();
        } catch (err) {
          watchlistError.textContent = err.message || 'Could not add to watchlist.';
          watchlistError.classList.remove('hidden');
        } finally {
          saveWatchlistBtn.disabled = false;
          saveWatchlistBtn.textContent = 'Add';
        }
      });
    }

    // --- Profile Editing Modal ---
    const openProfileBtn = document.getElementById('open-profile-edit-btn');
    const profileModal = document.getElementById('edit-profile-modal');
    const closeProfileBtn = document.getElementById('close-profile-modal-btn');
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');
    const profileForm = document.getElementById('profile-edit-form');
    const profileEditError = document.getElementById('profile-edit-error');
    const profileEditSuccess = document.getElementById('profile-edit-success');

    if (openProfileBtn && profileModal) {
      openProfileBtn.addEventListener('click', async () => {
        profileEditError.classList.add('hidden');
        profileEditSuccess.classList.add('hidden');
        profileModal.classList.remove('hidden');
        
        try {
          const res = await fetch('/api/onboarding', { headers: authHeaders() });
          const data = await res.json();
          if (res.ok && data.preferences) {
            const prefs = data.preferences;
            document.getElementById('edit-user-type').value = prefs.user_type || 'learner';
            document.getElementById('edit-experience-level').value = prefs.experience_level || 'Beginner';
            document.getElementById('edit-risk-preference').value = prefs.risk_preference || 'Medium';
            document.getElementById('edit-learning-preference').value = prefs.learning_preference || 'Text articles';
            
            const goals = prefs.goals || [];
            document.querySelectorAll('input[name="edit-goal"]').forEach(cb => {
              cb.checked = goals.includes(cb.value);
            });
            
            const sectors = prefs.favorite_sectors || [];
            document.querySelectorAll('input[name="edit-sector"]').forEach(cb => {
              cb.checked = sectors.includes(cb.value);
            });
          }
        } catch (err) {
          console.error('Could not prefill user preferences:', err);
        }
      });

      const hideModal = () => {
        profileModal.classList.add('hidden');
      };
      
      closeProfileBtn.addEventListener('click', hideModal);
      cancelProfileBtn.addEventListener('click', hideModal);
      
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profileEditError.classList.add('hidden');
        profileEditSuccess.classList.add('hidden');
        
        const userType = document.getElementById('edit-user-type').value;
        const experienceLevel = document.getElementById('edit-experience-level').value;
        const riskPreference = document.getElementById('edit-risk-preference').value;
        const learningPreference = document.getElementById('edit-learning-preference').value;
        
        const goals = [];
        document.querySelectorAll('input[name="edit-goal"]:checked').forEach(cb => {
          goals.push(cb.value);
        });
        
        const sectors = [];
        document.querySelectorAll('input[name="edit-sector"]:checked').forEach(cb => {
          sectors.push(cb.value);
        });
        
        const saveBtn = document.getElementById('save-profile-btn-modal');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        try {
          const res = await fetch('/api/onboarding', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              experienceLevel,
              userType,
              riskPreference,
              learningPreference,
              goals,
              sectors
            })
          });
          
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to save changes.');
          }
          
          profileEditSuccess.textContent = 'Profile preferences updated successfully!';
          profileEditSuccess.classList.remove('hidden');
          
          const localUser = window.TradePilotAuth.getUser();
          if (localUser) {
            localUser.onboardingCompleted = true;
            localStorage.setItem('tradepilot_user', JSON.stringify(localUser));
          }
          
          setTimeout(() => {
            hideModal();
          }, 1000);
        } catch (err) {
          profileEditError.textContent = err.message || 'Could not save profile changes.';
          profileEditError.classList.remove('hidden');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Changes';
        }
      });
    }

    loadHoldings();
    loadWatchlist();
  });
})();
