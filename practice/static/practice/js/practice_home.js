const data = document.getElementById('practice-data');
const TOPICS_URL   = data.dataset.topicsUrl;
const YEARS_URL    = data.dataset.yearsUrl;
const SITTINGS_URL = data.dataset.sittingsUrl;

// ── SESSION TYPE ──────────────────────────────────────────────────────────────
function setSessionType(type) {
  document.querySelectorAll('.session-type-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`stype-${type}`).classList.add('active');
  document.getElementById('session_type_input').value = type;

  const topicSection = document.getElementById('topic-section');
  topicSection.style.display = (type === 'TOPIC') ? 'block' : 'none';
}

// ── QUESTION TYPE ─────────────────────────────────────────────────────────────
function setQType(val) {
  document.querySelectorAll('.qtype-btn').forEach(b => b.classList.remove('active'));
  const target = document.querySelector(`.qtype-btn[data-val="${val}"]`);
  if (target) target.classList.add('active');
  document.getElementById('question_type_input').value = val;
  updateSummary();
}

/**
 * Show or hide the Oral (MCQ) button based on whether the selected subject
 * is English Language. Resets question type to OBJ if ORAL_ENG_OBJ was
 * selected and subject is no longer oral-eligible.
 *
 * @param {HTMLSelectElement} selectEl - The subject <select> element.
 */
function syncQTypeBar(selectEl) {
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const isOral         = selectedOption && selectedOption.dataset.oral === 'true';
  const oralBtn        = document.getElementById('qtype-oral-btn');
  const currentType    = document.getElementById('question_type_input').value;

  oralBtn.style.display = isOral ? '' : 'none';

  // If oral button was active but subject no longer supports it, reset to OBJ
  if (!isOral && currentType === 'ORAL_ENG_OBJ') {
    setQType('OBJ');
  }
}

// ── QUICK NUM ─────────────────────────────────────────────────────────────────
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

// ── LOAD TOPICS ───────────────────────────────────────────────────────────────
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

// ── LOAD YEARS ────────────────────────────────────────────────────────────────
function loadYears() {
  const subjectId  = document.getElementById('subject').value;
  const boardId    = document.getElementById('exam_board').value;
  const yearSelect = document.getElementById('year');

  if (!subjectId && !boardId) {
    yearSelect.innerHTML = '<option value="">— Select subject/board first —</option>';
    yearSelect.disabled  = true;
    return;
  }

  const params = new URLSearchParams();
  if (subjectId) params.set('subject', subjectId);
  if (boardId)   params.set('exam_board', boardId);

  fetch(`${YEARS_URL}?${params}`)
    .then(r => r.json())
    .then(res => {
      const years = res.years || [];
      if (!years.length) {
        yearSelect.innerHTML = '<option value="">No years available</option>';
        yearSelect.disabled  = true;
        return;
      }
      yearSelect.disabled   = false;
      yearSelect.innerHTML  = '<option value="">— Any Year —</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('');
    })
    .catch(() => {
      yearSelect.innerHTML = '<option value="">Failed to load</option>';
    });
}

// ── LOAD SITTINGS ─────────────────────────────────────────────────────────────
let sittingsController = null;
const sittingsCache    = {};

function loadSittings() {
  const subjectId = document.getElementById('subject').value;
  const boardId   = document.getElementById('exam_board').value;
  const year      = document.getElementById('year').value;
  const sittingEl = document.getElementById('sitting');

  if (!subjectId) {
    sittingEl.innerHTML = '<option value="">— Any Sitting —</option>';
    sittingEl.disabled  = true;
    return;
  }

  const cacheKey = `${subjectId}-${boardId}-${year}`;
  if (sittingsCache[cacheKey]) {
    renderSittings(sittingsCache[cacheKey]);
    return;
  }

  if (sittingsController) sittingsController.abort();
  sittingsController = new AbortController();

  const params = new URLSearchParams();
  if (subjectId) params.set('subject', subjectId);
  if (boardId)   params.set('board', boardId);
  if (year)      params.set('year', year);

  fetch(`${SITTINGS_URL}?${params}`, { signal: sittingsController.signal })
    .then(r => r.json())
    .then(res => {
      sittingsCache[cacheKey] = res.sittings || [];
      renderSittings(sittingsCache[cacheKey]);
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        sittingEl.innerHTML = '<option value="">— Any Sitting —</option>';
        sittingEl.disabled  = true;
      }
    });
}

function renderSittings(sittings) {
  const sittingEl = document.getElementById('sitting');
  sittingEl.innerHTML = '<option value="">— Any Sitting —</option>';
  if (!sittings.length) {
    sittingEl.disabled = true;
    return;
  }
  sittings.forEach(s => {
    const opt       = document.createElement('option');
    opt.value       = s.value;
    opt.textContent = s.label;
    sittingEl.appendChild(opt);
  });
  sittingEl.disabled = false;
}

// ── SUBJECT CHANGE ────────────────────────────────────────────────────────────
document.getElementById('subject').addEventListener('change', function () {
  syncQTypeBar(this);   // ← show/hide oral button, reset type if needed
  loadTopics(this.value);
  loadYears();
  loadSittings();
  updateSummary();
});

document.getElementById('exam_board').addEventListener('change', function () {
  loadYears();
  loadSittings();
  updateSummary();
});

document.getElementById('year').addEventListener('change', function () {
  loadSittings();
  updateSummary();
});

document.getElementById('sitting').addEventListener('change', updateSummary);

// ── SUMMARY ───────────────────────────────────────────────────────────────────
function updateSummary() {
  const subjectEl  = document.getElementById('subject');
  const boardEl    = document.getElementById('exam_board');
  const subject    = subjectEl.options[subjectEl.selectedIndex]?.text || '—';
  const board      = boardEl.options[boardEl.selectedIndex]?.text     || 'Any board';
  const year       = document.getElementById('year').value            || 'Any year';
  const sittingEl  = document.getElementById('sitting');
  const sitting    = sittingEl.options[sittingEl.selectedIndex]?.text || '';
  const num        = document.getElementById('num_questions').value   || 40;

  const sittingPart = sitting && sitting !== '— Any Sitting —' ? ` · ${sitting}` : '';

  document.getElementById('summary-text').innerHTML =
    `<strong>${num} questions</strong> · ${subject} · ${board} · ${year}${sittingPart}`;
}

// ── TOPIC CHECKBOX STYLE SYNC ─────────────────────────────────────────────────
document.addEventListener('change', function (e) {
  if (e.target.type === 'checkbox' && e.target.name === 'topics') {
    e.target.closest('.topic-check-label')?.classList.toggle('checked', e.target.checked);
  }
});

// ── INIT ──────────────────────────────────────────────────────────────────────
setSessionType('EXAM');
setQType('OBJ');
setNum(40);
updateSummary();