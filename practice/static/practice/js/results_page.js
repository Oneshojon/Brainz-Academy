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

/* ═══════════════════════════════════════════════════════════════════════════
   APPEND TO: practice/static/practice/js/results_page.js
   ─────────────────────────────────────────────────────────────────────────── */

/* ── Discussion state ────────────────────────────────────────────────────── */

// Tracks which panels have already been fetched (prevents refetch on re-open)
const _loadedDiscussions = new Set();

// Builds the API URL from the base URL stored in the data div.
// Base URL is e.g. "/practice/questions/0/comments/"
// We replace the trailing "/0/" with "/<id>/"
function _commentsUrl(questionId) {
  const base = document.getElementById('results-data')
    .dataset.commentsBaseUrl;               // "/practice/questions/0/comments/"
  return base.replace('/0/', `/${questionId}/`);
}

function _csrfToken() {
  return document.getElementById('results-data').dataset.csrf;
}


/* ── openDiscussion ──────────────────────────────────────────────────────── */

async function openDiscussion(questionId, btn) {
  const panel      = document.getElementById(`discussion-${questionId}`);
  const loadingEl  = document.getElementById(`disc-loading-${questionId}`);
  const contentEl  = document.getElementById(`disc-content-${questionId}`);

  // Toggle visibility
  const isOpen = !panel.hidden;
  if (isOpen) {
    panel.hidden = true;
    btn.classList.remove('active');
    return;
  }

  panel.hidden = false;
  btn.classList.add('active');

  // Only fetch once per panel lifetime
  if (_loadedDiscussions.has(questionId)) return;

  // Show loader, hide content
  loadingEl.hidden  = false;
  contentEl.hidden  = true;

  try {
    const res  = await fetch(_commentsUrl(questionId), {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const data = await res.json();

    if (!data.ok) throw new Error(data.error || 'Failed to load comments.');

    contentEl.innerHTML = _buildDiscussionHTML(questionId, data);
    _bindDiscussionEvents(questionId, data.can_post);

    _loadedDiscussions.add(questionId);
  } catch (err) {
    contentEl.innerHTML = `<p class="disc-error-msg">⚠ Could not load discussion. Please try again.</p>`;
  } finally {
    loadingEl.hidden = true;
    contentEl.hidden = false;
  }
}


/* ── _buildDiscussionHTML ─────────────────────────────────────────────────── */

function _buildDiscussionHTML(questionId, data) {
  let html = '';

  // 1. Explanation pin (from Choice.explanation, OBJ questions only)
  if (data.explanation) {
    html += `
      <div class="disc-explanation">
        <span class="disc-explanation-icon">💡</span>
        <div class="disc-explanation-body">
          <div class="disc-explanation-label">Explanation</div>
          <div class="disc-explanation-text">${_escapeHtml(data.explanation)}</div>
        </div>
      </div>`;
  }

  // 2. Comments list
  html += `<div class="disc-section-heading">Discussion</div>`;

  if (data.comments.length === 0) {
    html += `<p class="disc-empty">No comments yet. Be the first to start the discussion.</p>`;
  } else {
    html += `<div class="disc-comment-list" id="disc-list-${questionId}">`;
    for (const c of data.comments) {
      html += _commentHTML(c);
    }
    html += `</div>`;
  }

  // 3. Post form or upgrade nudge
  if (data.can_post) {
    html += `
      <div class="disc-post-form" id="disc-form-${questionId}">
        <textarea
          id="disc-textarea-${questionId}"
          placeholder="Share your thoughts or ask a question…"
          maxlength="1000"
          rows="3"
          oninput="_updateCharCount(${questionId}, this.value.length)"
        ></textarea>
        <div class="disc-form-footer">
          <span class="disc-char-count" id="disc-chars-${questionId}">0 / 1000</span>
          <button class="disc-submit-btn" id="disc-submit-${questionId}"
                  onclick="postComment(${questionId})">
            Post
          </button>
        </div>
        <div class="disc-error-msg" id="disc-form-error-${questionId}" hidden></div>
      </div>`;
  } else {
    html += `
      <div class="disc-upgrade-nudge">
        <span>🔒</span>
        <span>Subscribe to join the discussion. <a href="/pricing/">Upgrade now →</a></span>
      </div>`;
  }

  return html;
}


/* ── _commentHTML ─────────────────────────────────────────────────────────── */

function _commentHTML(c) {
  const deleteBtn = c.is_mine
    ? `<button class="disc-delete-btn"
              onclick="deleteComment(${c.id}, this)"
              title="Delete comment">✕</button>`
    : '';

  const pinBadge = c.is_pinned
    ? `<span style="font-size:0.68rem;color:var(--green);font-weight:700;">📌 Pinned</span>`
    : '';

  return `
    <div class="disc-comment" id="disc-comment-${c.id}" data-comment-id="${c.id}">
      <div class="disc-comment-header">
        <span class="disc-comment-author">${_escapeHtml(c.author)}</span>
        ${pinBadge}
        ${deleteBtn}
        <span class="disc-comment-time">${_escapeHtml(c.created_at)}</span>
      </div>
      <div class="disc-comment-body">${_escapeHtml(c.body)}</div>
    </div>`;
}


/* ── _bindDiscussionEvents ────────────────────────────────────────────────── */

function _bindDiscussionEvents(questionId, canPost) {
  // If the comment list didn't exist before (0 comments),
  // we need to ensure the container is injected on first post.
  // This is handled inside postComment().
}


/* ── postComment ─────────────────────────────────────────────────────────── */

async function postComment(questionId) {
  const textarea  = document.getElementById(`disc-textarea-${questionId}`);
  const submitBtn = document.getElementById(`disc-submit-${questionId}`);
  const errorEl   = document.getElementById(`disc-form-error-${questionId}`);
  const body      = textarea.value.trim();

  if (!body) return;

  // Loading state
  submitBtn.disabled     = true;
  submitBtn.innerHTML    = `<span class="disc-submit-spinner"></span> Posting…`;
  errorEl.hidden         = true;

  try {
    const res  = await fetch(_commentsUrl(questionId), {
      method:  'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-CSRFToken':      _csrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || 'Could not post comment.');
    }

    // Inject comment into list (create list container if first comment)
    let listEl = document.getElementById(`disc-list-${questionId}`);
    if (!listEl) {
      // Remove "no comments yet" message and create list
      const emptyEl = document.querySelector(`#disc-content-${questionId} .disc-empty`);
      if (emptyEl) emptyEl.remove();

      const formEl = document.getElementById(`disc-form-${questionId}`);
      listEl = document.createElement('div');
      listEl.className = 'disc-comment-list';
      listEl.id        = `disc-list-${questionId}`;
      formEl.parentNode.insertBefore(listEl, formEl);
    }

    listEl.insertAdjacentHTML('beforeend', _commentHTML(data.comment));

    // Update badge count
    _incrementCommentBadge(questionId);

    // Reset form
    textarea.value      = '';
    _updateCharCount(questionId, 0);

  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden      = false;
  } finally {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = 'Post';
  }
}


/* ── deleteComment ───────────────────────────────────────────────────────── */

async function deleteComment(commentId, btn) {
  if (!confirm('Remove this comment?')) return;

  const commentEl    = document.getElementById(`disc-comment-${commentId}`);
  const questionId   = _questionIdFromCommentEl(commentEl);
  const originalHTML = btn.innerHTML;

  btn.disabled    = true;
  btn.textContent = '…';

  try {
    const url = _commentsUrl(questionId) + `${commentId}/delete/`;
    const res  = await fetch(url, {
      method:  'DELETE',
      headers: {
        'X-CSRFToken':      _csrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const data = await res.json();

    if (!data.ok) throw new Error(data.error || 'Could not delete comment.');

    commentEl.remove();
    _decrementCommentBadge(questionId);

  } catch (err) {
    btn.disabled   = false;
    btn.innerHTML  = originalHTML;
    alert('Could not delete comment. Please try again.');
  }
}


/* ── Badge helpers ───────────────────────────────────────────────────────── */

function _incrementCommentBadge(questionId) {
  const badge = document.getElementById(`comment-count-${questionId}`);
  if (!badge) return;
  const current = parseInt(badge.textContent || '0', 10);
  badge.textContent = current + 1;
}

function _decrementCommentBadge(questionId) {
  const badge = document.getElementById(`comment-count-${questionId}`);
  if (!badge) return;
  const current = parseInt(badge.textContent || '0', 10);
  const next    = Math.max(0, current - 1);
  badge.textContent = next > 0 ? next : '';
}


/* ── Character counter ───────────────────────────────────────────────────── */

function _updateCharCount(questionId, length) {
  const el = document.getElementById(`disc-chars-${questionId}`);
  if (!el) return;
  el.textContent = `${length} / 1000`;
  el.className   = 'disc-char-count' +
    (length > 950 ? ' over' : length > 800 ? ' warn' : '');
}


/* ── Utilities ───────────────────────────────────────────────────────────── */

function _escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Walk up from a comment element to find the question ID
// (comments live inside #discussion-<questionId>)
function _questionIdFromCommentEl(commentEl) {
  const panel = commentEl.closest('.discussion-panel');
  if (!panel) return null;
  return panel.id.replace('discussion-', '');
}