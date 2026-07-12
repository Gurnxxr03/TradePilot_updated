(function () {
  const NARRATIVE_URL = '/api/narrative';

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('regenerate-narrative-btn');
    const errorBox = document.getElementById('narrative-error');
    const whatEl = document.getElementById('narrative-what');
    const whyEl = document.getElementById('narrative-why');
    const explainerEl = document.getElementById('narrative-explainer');

    if (!btn) return;

    async function generateNarrative() {
      errorBox.classList.add('hidden');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Generating...';
      btn.disabled = true;

      try {
        const authHeader = window.TradePilotAuth ? window.TradePilotAuth.authHeader() : {};
        const res = await fetch(NARRATIVE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader }
        });
        const data = await res.json();

        if (!res.ok) {
          errorBox.textContent = data.error || 'Could not generate a new narrative.';
          errorBox.classList.remove('hidden');
          return;
        }

        whatEl.textContent = data.whatHappened;
        whyEl.textContent = data.whyItHappened;
        if (data.beginnerExplainer) explainerEl.textContent = data.beginnerExplainer;
      } catch (err) {
        errorBox.textContent = 'Could not reach the AI server. Make sure it is running (npm start).';
        errorBox.classList.remove('hidden');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', generateNarrative);

    // Auto-generate a fresh narrative once when the page first loads
    generateNarrative();
  });
})();
