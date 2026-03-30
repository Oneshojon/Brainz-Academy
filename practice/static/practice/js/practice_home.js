const data = document.getElementById('practice-data');
const TOPICS_URL = data.dataset.topicsUrl;
const YEARS_URL = data.dataset.yearsUrl;

// ── SESSION TYPE ──
function setSessionType(type) {
  document.querySelectorAll('.session-type-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`stype-${type}`).classList.add('active');
  document.getElementById('session_type_input').value = type;

  // Show/hide topic section for TOPIC mode
  const topicSection = document.getElementById('topic-section');
  topicSection.style.display = (type === 'TOPIC') ? 'block' : 'none';
}

// ── QUESTION TYPE ──
function setQType(val) {
  document.querySelectorAll('.qtype-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.qtype-btn[data-val="${val}"]`).classList.add('active');
  document.getElementById('question_type_input').value = val;
}

// ── QUICK NUM ──
function setNum(n) {
  document.querySelectorAll('.quick-num').forEach(b => b.classList.remove('active'));
  document.querySelector(`.quick-num[data-val="${n}"]`)?.classList.add('active');
  document.getElementById('num_questions').value = n;
}

document.getElementById('num_questions').addEventListener('input', function () {
  document.querySelectorAll('.quick-num').forEach(b => b.classList.remove('active'));
  const matched = document.querySelector(`.quick-num[data-val="${this.value}"]`);
  if (matched) matched.classList.add('active');
  updateSummary();
});

// ── LOAD TOPICS ──
function loadTopics(subjectId) {
  const container = document.getElementById('topics-container');
  if (!subjectId) {
    container.innerHTML = '<p class="no-topics">Select a subject first.</p>';
    return;
  }
  container.innerHTML = '<p class="no-topics">Loading topics...</p>';

  fetch(`${TOPICS_URL}?subject=${subjectId}`)
    .then(r => r.json())
    .then(topics => {
      if (!topics.length) {
        container.innerHTML = '<p class="no-topics">No topics found for this subject.</p>';
        return;
      }
      container.innerHTML = topics.map(t => `
        <label class="topic-check-label" id="topic-label-${t.id}">
          <input type="checkbox" name="topics" value="${t.id}" onchange="toggleTopicLabel(${t.id}, this)">
          ${t.name}
        </label>
      `).join('');
    })
    .catch(() => {
      container.innerHTML = '<p class="no-topics">Failed to load topics.</p>';
    });
}

function toggleTopicLabel(id, el) {
  document.getElementById(`topic-label-${id}`).classList.toggle('checked', el.checked);
  updateSummary();
}

// ── LOAD YEARS ──
function loadYears() {
  const subjectId = document.getElementById('subject').value;
  const boardId = document.getElementById('exam_board').value;
  const yearSelect = document.getElementById('year');

  if (!subjectId && !boardId) {
    yearSelect.innerHTML = '<option value="">— Select subject/board first —</option>';
    yearSelect.disabled = true;
    return;
  }

  const params = new URLSearchParams();
  if (subjectId) params.set('subject', subjectId);
  if (boardId) params.set('exam_board', boardId);

  fetch(`${YEARS_URL}?${params}`)
    .then(r => r.json())
    .then(res => {
      const years = res.years || [];
      if (!years.length) {
        yearSelect.innerHTML = '<option value="">No years available</option>';
        yearSelect.disabled = true;
        return;
      }
      yearSelect.disabled = false;
      yearSelect.innerHTML = '<option value="">— Any Year —</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('');
    })
    .catch(() => {
      yearSelect.innerHTML = '<option value="">Failed to load</option>';
    });
}

// ── SUBJECT CHANGE ──
document.getElementById('subject').addEventListener('change', function () {
  loadTopics(this.value);
  loadYears();
  updateSummary();
});

document.getElementById('exam_board').addEventListener('change', function () {
  loadYears();
  updateSummary();
});

document.getElementById('year').addEventListener('change', updateSummary);

// ── SUMMARY ──
function updateSummary() {
  const subject = document.getElementById('subject').options[document.getElementById('subject').selectedIndex]?.text || '—';
  const board = document.getElementById('exam_board').options[document.getElementById('exam_board').selectedIndex]?.text || 'Any board';
  const year = document.getElementById('year').value || 'Any year';
  const num = document.getElementById('num_questions').value || 40;

  document.getElementById('summary-text').innerHTML =
    `<strong>${num} questions</strong> · ${subject} · ${board} · ${year}`;
}

// ── TOPIC CHECKBOX STYLE SYNC ──
document.addEventListener('change', function (e) {
  if (e.target.type === 'checkbox' && e.target.name === 'topics') {
    e.target.closest('.topic-check-label')?.classList.toggle('checked', e.target.checked);
  }
});

// ── INIT ──
setSessionType('EXAM');
setQType('OBJ');
setNum(40);
updateSummary();