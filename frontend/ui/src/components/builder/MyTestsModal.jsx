import { useState, useEffect, useCallback } from "react";
import api from "../../api";

const styles = `
  .myt-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(11,29,62,0.55); backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }

  .myt-modal {
    background: #ffffff; border-radius: 20px;
    width: 100%; max-width: 780px; max-height: 88vh;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 80px rgba(11,45,114,0.22);
    overflow: hidden;
  }

  .myt-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.1rem 1.4rem; border-bottom: 1px solid #C2D4EC;
    background: #EDF1F8; flex-shrink: 0;
  }
  .myt-header-title {
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800;
    font-size: 1rem; color: #0B2D72;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .myt-close-btn {
    background: transparent; border: none; color: #6B7FA3;
    font-size: 1.1rem; cursor: pointer; width: 30px; height: 30px;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
  }
  .myt-close-btn:hover { background: #D1DCF0; color: #0B2D72; }

  .myt-body { flex: 1; overflow-y: auto; padding: 1rem 1.4rem; }
  .myt-body::-webkit-scrollbar { width: 6px; }
  .myt-body::-webkit-scrollbar-track { background: #EDF1F8; border-radius: 4px; }
  .myt-body::-webkit-scrollbar-thumb { background: #A8BDD8; border-radius: 4px; }
  .myt-body::-webkit-scrollbar-thumb:hover { background: #6B7FA3; }

  /* ── States ── */
  .myt-loading, .myt-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 4rem 2rem; text-align: center;
    color: #6B7FA3; gap: 0.75rem; font-size: 0.875rem;
  }
  .myt-empty-icon { font-size: 2.5rem; }
  .myt-spinner {
    width: 28px; height: 28px;
    border: 3px solid #C2D4EC; border-top-color: #0B2D72;
    border-radius: 50%; animation: myt-spin 0.7s linear infinite;
  }
  @keyframes myt-spin { to { transform: rotate(360deg); } }

  /* ── Test list ── */
  .myt-list { display: flex; flex-direction: column; gap: 0.6rem; }

  .myt-card {
    background: #F7FAFD; border: 1.5px solid #C2D4EC; border-radius: 12px;
    padding: 0.9rem 1rem; display: flex; align-items: center; gap: 0.75rem;
    transition: border-color 0.15s;
  }
  .myt-card:hover { border-color: #0B2D72; }

  .myt-card-icon {
    font-size: 1.4rem; flex-shrink: 0; width: 40px; height: 40px;
    background: #EDF1F8; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }

  .myt-card-info { flex: 1; min-width: 0; }
  .myt-card-title {
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    font-size: 0.88rem; color: #0B2D72;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 0.35rem;
  }
  .myt-card-meta {
    display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center;
  }
  .myt-tag {
    font-size: 0.62rem; font-weight: 700; padding: 0.1rem 0.42rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .myt-tag.mode-manual  { background: rgba(11,45,114,0.08); color: #0B2D72; }
  .myt-tag.mode-random  { background: rgba(9,146,194,0.1);  color: #0992C2; }
  .myt-tag.counts       { background: #EDF1F8; color: #6B7FA3; border: 1px solid #C2D4EC; }
  .myt-tag.marks        { background: #FEF3C7; color: #B8860B; }
  .myt-card-date { font-size: 0.68rem; color: #6B7FA3; margin-top: 0.25rem; }

  /* ── Card actions ── */
  .myt-card-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

  .myt-open-btn {
    background: #0B2D72; color: #ffffff; border: none; border-radius: 8px;
    padding: 0.4rem 0.85rem; font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: all 0.15s;
    white-space: nowrap;
  }
  .myt-open-btn:hover { background: #0a2360; }
  .myt-open-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .myt-delete-btn {
    background: transparent; border: 1.5px solid #C2D4EC; color: #6B7FA3;
    border-radius: 8px; width: 32px; height: 32px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; transition: all 0.15s; flex-shrink: 0;
  }
  .myt-delete-btn:hover { background: #FEE2E2; border-color: rgba(220,38,38,0.3); color: #DC2626; }
  .myt-delete-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Loading state on open button ── */
  .myt-btn-spinner {
    display: inline-block; width: 10px; height: 10px;
    border: 2px solid rgba(255,255,255,0.4); border-top-color: #ffffff;
    border-radius: 50%; animation: myt-spin 0.6s linear infinite;
  }

  /* ── Confirm delete ── */
  .myt-confirm {
    background: #FEE2E2; border: 1.5px solid rgba(220,38,38,0.25);
    border-radius: 10px; padding: 0.65rem 0.9rem;
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.5rem; margin-top: 0.4rem;
    font-size: 0.78rem; color: #DC2626;
  }
  .myt-confirm-btns { display: flex; gap: 0.35rem; }
  .myt-confirm-yes {
    background: #DC2626; color: #ffffff; border: none; border-radius: 6px;
    padding: 0.3rem 0.7rem; font-size: 0.72rem; font-weight: 700; cursor: pointer;
  }
  .myt-confirm-no {
    background: #ffffff; color: #6B7FA3; border: 1px solid #C2D4EC;
    border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.72rem;
    font-weight: 600; cursor: pointer;
  }
`;

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyTestsModal({ onClose, onOpenTest }) {
  const [tests, setTests]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [opening, setOpening]       = useState(null);   // test PK being opened
  const [deleting, setDeleting]     = useState(null);   // test PK being deleted
  const [confirmId, setConfirmId]   = useState(null);   // test PK awaiting confirm

  const fetchTests = useCallback(() => {
    setLoading(true);
    api.get('saved-tests/')
      .then(r => setTests(r.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOpen = async (test) => {
    if (test.builder_mode === 'random') {
      // Random tests can't be reopened in the builder — offer re-download only
      // (handled by the download buttons in the card — this button is disabled)
      return;
    }

    setOpening(test.id);
    try {
      // Fetch full question data to restore builder state
      const res = await api.get(`saved-tests/${test.id}/`);
      const full = res.data;

      // Map SavedTestQuestion records back to the savedQuestions shape
      // that BuilderLayout expects
      const questions = full.test_questions.map(stq => ({
        id:            stq.id,
        question_number: stq.question_number,
        question_type: stq.question_type,
        content:       stq.content,
        image:         stq.image,
        marks:         stq.marks,
        difficulty:    stq.difficulty,
        exam_year:     stq.exam_year,
        exam_board:    stq.exam_board,
        sitting:       stq.sitting,
        subject_name:  stq.subject_name,
        topic_names:   stq.topic_names,
        choices:       stq.choices,
        theory_answer: stq.theory_answer,
        customMarks:   stq.custom_marks,  // from through model
      }));

      onOpenTest({
        savedTestId: full.id,
        title:       full.title,
        questions,
      });
    } catch {
      alert('Could not load test. Please try again.');
    } finally {
      setOpening(null);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`saved-tests/${id}/`);
      setTests(prev => prev.filter(t => t.id !== id));
      setConfirmId(null);
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="myt-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="myt-modal">

          {/* Header */}
          <div className="myt-header">
            <div className="myt-header-title">
              📂 My Tests
              {!loading && tests.length > 0 && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600, color: '#6B7FA3',
                  background: '#D1DCF0', padding: '0.1rem 0.5rem',
                  borderRadius: '100px',
                }}>
                  {tests.length}
                </span>
              )}
            </div>
            <button className="myt-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="myt-body">
            {loading ? (
              <div className="myt-loading">
                <div className="myt-spinner" />
                <span>Loading your tests…</span>
              </div>

            ) : tests.length === 0 ? (
              <div className="myt-empty">
                <div className="myt-empty-icon">📋</div>
                <strong style={{ color: '#0B2D72', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  No saved tests yet
                </strong>
                <span>Download a test from the builder and it will appear here.</span>
              </div>

            ) : (
              <div className="myt-list">
                {tests.map(test => (
                  <div key={test.id}>
                    <div className="myt-card">
                      <div className="myt-card-icon">
                        {test.builder_mode === 'manual' ? '✋' : '🎲'}
                      </div>

                      <div className="myt-card-info">
                        <div className="myt-card-title">{test.title}</div>
                        <div className="myt-card-meta">
                          <span className={`myt-tag mode-${test.builder_mode}`}>
                            {test.builder_mode === 'manual' ? 'Manual' : 'Random'}
                          </span>
                          <span className="myt-tag counts">
                            {test.question_count} Q
                          </span>
                          <span className="myt-tag marks">
                            {test.total_marks} marks
                          </span>
                          <span className="myt-tag counts">
                            {test.format.toUpperCase()}
                          </span>
                        </div>
                        <div className="myt-card-date">
                          Last updated {formatDate(test.updated_at)}
                        </div>
                      </div>

                      <div className="myt-card-actions">
                        {test.builder_mode === 'manual' ? (
                          <button
                            className="myt-open-btn"
                            disabled={!!opening || !!deleting}
                            onClick={() => handleOpen(test)}>
                            {opening === test.id
                              ? <span className="myt-btn-spinner" />
                              : 'Open →'}
                          </button>
                        ) : (
                          <span style={{
                            fontSize: '0.7rem', color: '#6B7FA3',
                            fontStyle: 'italic', maxWidth: '80px', lineHeight: 1.3,
                          }}>
                            Re-generate to download
                          </span>
                        )}
                        <button
                          className="myt-delete-btn"
                          disabled={!!opening || !!deleting}
                          title="Delete test"
                          onClick={() => setConfirmId(confirmId === test.id ? null : test.id)}>
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Inline delete confirmation */}
                    {confirmId === test.id && (
                      <div className="myt-confirm">
                        <span>Delete "<strong>{test.title}</strong>"? This cannot be undone.</span>
                        <div className="myt-confirm-btns">
                          <button className="myt-confirm-no"
                            onClick={() => setConfirmId(null)}>
                            Cancel
                          </button>
                          <button className="myt-confirm-yes"
                            disabled={deleting === test.id}
                            onClick={() => handleDelete(test.id)}>
                            {deleting === test.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}