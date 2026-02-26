// All values injected from the template via data attributes on #exam-data
const examData = document.getElementById('exam-data');
const SESSION_ID = parseInt(examData.dataset.sessionId);
const TOTAL = parseInt(examData.dataset.total);
const CSRF = examData.dataset.csrf;
const SUBMIT_URL = examData.dataset.submitUrl;
const FINISH_URL = examData.dataset.finishUrl;

// ── STATE ──
let currentQId = parseInt(document.querySelector('.question-card.active').dataset.qid);
let answeredCount = parseInt(examData.dataset.answeredCount);
let theoryTimers = {};

// Build ordered list of question IDs from DOM
const qCards = Array.from(document.querySelectorAll('.question-card'));
const qIds = qCards.map(c => parseInt(c.dataset.qid));

// ── TIMER ──
let timeLeft = TOTAL * 90; // 1.5 mins per question
const timerEl = document.getElementById('timer');

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const timerInterval = setInterval(() => {
  timeLeft--;
  timerEl.textContent = '⏱ ' + formatTime(timeLeft);
  if (timeLeft <= 300) timerEl.className = 'timer warning';
  if (timeLeft <= 60) timerEl.className = 'timer danger';
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    document.getElementById('confirmModal').classList.add('open');
  }
}, 1000);

// ── NAVIGATION ──
function goToQuestion(qId) {
  document.getElementById(`q-${currentQId}`)?.classList.remove('active');
  document.getElementById(`grid-${currentQId}`)?.classList.remove('current');
  document.getElementById(`drawer-grid-${currentQId}`)?.classList.remove('current');

  currentQId = qId;
  document.getElementById(`q-${qId}`)?.classList.add('active');

  const gridBtn = document.getElementById(`grid-${qId}`);
  const drawerBtn = document.getElementById(`drawer-grid-${qId}`);
  if (gridBtn && !gridBtn.classList.contains('answered')) gridBtn.classList.add('current');
  if (drawerBtn && !drawerBtn.classList.contains('answered')) drawerBtn.classList.add('current');

  document.querySelector('.exam-main').scrollTo({ top: 0, behavior: 'smooth' });
}

function nextQuestion() {
  const idx = qIds.indexOf(currentQId);
  if (idx < qIds.length - 1) goToQuestion(qIds[idx + 1]);
}

function prevQuestion() {
  const idx = qIds.indexOf(currentQId);
  if (idx > 0) goToQuestion(qIds[idx - 1]);
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') nextQuestion();
  if (e.key === 'ArrowLeft') prevQuestion();
});

// ── SELECT CHOICE (OBJ) ──
function selectChoice(qId, choiceId, el) {
  document.querySelectorAll(`#choices-${qId} .choice-item`).forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  fetch(SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF },
    body: JSON.stringify({ session_id: SESSION_ID, question_id: qId, choice_id: choiceId })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      markAnswered(qId);
      updateProgress(data.answered_count);
      showSaved(qId);
    }
  })
  .catch(() => console.error('Failed to save answer'));
}

// ── AUTO-SAVE THEORY ──
function autoSaveTheory(qId) {
  clearTimeout(theoryTimers[qId]);
  theoryTimers[qId] = setTimeout(() => {
    const text = document.getElementById(`theory-${qId}`).value;
    fetch(SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF },
      body: JSON.stringify({ session_id: SESSION_ID, question_id: qId, theory_response: text })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        markAnswered(qId);
        updateProgress(data.answered_count);
        showSaved(qId);
      }
    })
    .catch(() => console.error('Failed to save theory answer'));
  }, 800);
}

// ── HELPERS ──
function markAnswered(qId) {
  const gridBtn = document.getElementById(`grid-${qId}`);
  const drawerBtn = document.getElementById(`drawer-grid-${qId}`);
  if (gridBtn) gridBtn.className = 'grid-btn answered';
  if (drawerBtn) drawerBtn.className = 'grid-btn answered';
}

function updateProgress(count) {
  answeredCount = count;
  const pct = Math.round((count / TOTAL) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('answeredCount').textContent = count;
  document.getElementById('answeredCountSide').textContent = count;
  document.getElementById('modalAnswered').textContent = count;
  document.getElementById('modalUnanswered').textContent = TOTAL - count;
}

function showSaved(qId) {
  const el = document.getElementById(`saved-${qId}`);
  if (el) {
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 1500);
  }
}

// ── MODAL ──
function openModal() {
  document.getElementById('confirmModal').classList.add('open');
}
function closeModal() {
  document.getElementById('confirmModal').classList.remove('open');
}

// ── MOBILE DRAWER ──
function toggleDrawer() {
  document.getElementById('gridDrawer').classList.toggle('open');
  document.getElementById('drawerOverlay').classList.toggle('open');
}

// ── INIT ──
document.getElementById(`grid-${currentQId}`)?.classList.add('current');
document.getElementById(`drawer-grid-${currentQId}`)?.classList.add('current');