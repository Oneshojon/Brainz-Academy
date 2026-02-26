const data = document.getElementById('results-data');
const CSRF = data.dataset.csrf;
const BOOKMARK_URL = data.dataset.bookmarkUrl;
const SCORE_PCT = parseFloat(data.dataset.scorePct) || 0;

// ── SCORE RING ANIMATION ──
window.addEventListener('load', () => {
  const circle = document.getElementById('scoreCircle');
  if (!circle) return;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference;

  // Pick colour based on score
  let colour = '#f87171'; // red
  if (SCORE_PCT >= 70) colour = '#4ade80';
  else if (SCORE_PCT >= 50) colour = '#f5c842';
  circle.setAttribute('stroke', colour);

  // Animate
  setTimeout(() => {
    const offset = circumference - (SCORE_PCT / 100) * circumference;
    circle.style.transition = 'stroke-dashoffset 1.2s ease';
    circle.style.strokeDashoffset = offset;
  }, 300);

  // Counter
  const valEl = document.getElementById('scoreRingPct');
  if (valEl) {
    let current = 0;
    const target = Math.round(SCORE_PCT);
    const step = target / 60;
    const counter = setInterval(() => {
      current = Math.min(current + step, target);
      valEl.textContent = Math.round(current) + '%';
      if (current >= target) clearInterval(counter);
    }, 16);
  }
});

// ── EXPAND / COLLAPSE CARDS ──
function toggleCard(id) {
  const card = document.getElementById(`review-card-${id}`);
  card?.classList.toggle('expanded');
}

// ── FILTER ──
function filterReview(type) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.filter-tab[data-filter="${type}"]`)?.classList.add('active');

  document.querySelectorAll('.review-card').forEach(card => {
    if (type === 'all') {
      card.classList.remove('hidden');
    } else {
      card.classList.toggle('hidden', !card.classList.contains(type));
    }
  });
}

// ── BOOKMARK TOGGLE ──
function toggleBookmark(questionId, btn) {
  fetch(BOOKMARK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF },
    body: JSON.stringify({ question_id: questionId })
  })
  .then(r => r.json())
  .then(res => {
    btn.classList.toggle('bookmarked', res.bookmarked);
    btn.title = res.bookmarked ? 'Remove bookmark' : 'Bookmark this question';
    btn.textContent = res.bookmarked ? '🔖' : '🏷️';
  })
  .catch(() => console.error('Bookmark failed'));
}

// ── EXPAND ALL / COLLAPSE ALL ──
function expandAll() {
  document.querySelectorAll('.review-card:not(.hidden)').forEach(c => c.classList.add('expanded'));
}
function collapseAll() {
  document.querySelectorAll('.review-card').forEach(c => c.classList.remove('expanded'));
}