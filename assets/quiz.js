(function () {
  const QUIZ_URL = '/api/quiz';

  document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('quiz-container');
    const progressEl = document.getElementById('quiz-progress');
    const bestScoreEl = document.getElementById('quiz-best-score');

    if (!container) return; // not on this page

    function authHeaders(extra) {
      const h = window.TradePilotAuth ? window.TradePilotAuth.authHeader() : {};
      return { ...h, ...(extra || {}) };
    }

    let questions = [];
    let currentIndex = 0;
    const answers = {}; // questionId -> chosen index

    function renderQuestion() {
      const q = questions[currentIndex];
      if (!q) return;

      progressEl.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

      container.innerHTML = `
        <p class="font-bold text-body-lg italic">"${q.question}"</p>
        ${q.options.map((opt, i) => `
          <button class="quiz-option w-full text-left p-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors text-label-md" data-index="${i}">
            ${opt}
          </button>
        `).join('')}
      `;

      container.querySelectorAll('.quiz-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          answers[q.id] = parseInt(btn.getAttribute('data-index'), 10);
          if (currentIndex < questions.length - 1) {
            currentIndex += 1;
            renderQuestion();
          } else {
            submitQuiz();
          }
        });
      });
    }

    async function submitQuiz() {
      container.innerHTML = '<p class="text-label-md opacity-80">Scoring your answers...</p>';
      try {
        const res = await fetch(`${QUIZ_URL}/submit`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ answers })
        });
        const data = await res.json();

        if (!res.ok) {
          container.innerHTML = `<p class="text-label-md text-red-300">${data.error || 'Could not submit quiz.'}</p>`;
          return;
        }

        progressEl.textContent = '';
        container.innerHTML = `
          <p class="font-bold text-headline-sm">You scored ${data.score} / ${data.total}!</p>
          <p class="text-label-md opacity-80">${data.score === data.total ? "Perfect score! 🎉" : "Nice work — review and try again anytime."}</p>
          <button id="retry-quiz-btn" class="w-full text-left p-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors text-label-md mt-sm">
            Try Again
          </button>
        `;
        document.getElementById('retry-quiz-btn').addEventListener('click', () => {
          currentIndex = 0;
          Object.keys(answers).forEach((k) => delete answers[k]);
          renderQuestion();
        });
        loadBestScore();
      } catch (err) {
        container.innerHTML = '<p class="text-label-md text-red-300">Could not reach the server. Make sure it is running (npm start).</p>';
      }
    }

    async function loadBestScore() {
      try {
        const res = await fetch(`${QUIZ_URL}/best`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok && data.best) {
          bestScoreEl.textContent = `Your best score: ${data.best.score} / ${data.best.total}`;
        } else {
          bestScoreEl.textContent = 'Answer all questions to see your score!';
        }
      } catch (err) {
        bestScoreEl.textContent = '';
      }
    }

    async function init() {
      try {
        const res = await fetch(`${QUIZ_URL}/questions`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) {
          container.innerHTML = `<p class="text-label-md text-red-300">${data.error || 'Could not load quiz.'}</p>`;
          return;
        }
        questions = data.questions;
        renderQuestion();
        loadBestScore();
      } catch (err) {
        container.innerHTML = '<p class="text-label-md text-red-300">Could not reach the server. Make sure it is running (npm start).</p>';
      }
    }

    init();
  });
})();
