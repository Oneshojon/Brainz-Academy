import { useState } from "react";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const styles = `
  /* ── Download bar ─────────────────────────────────────────────── */
  .download-bar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem;
    padding: 1rem 1.25rem; background: var(--card);
    border: 1px solid var(--border); border-radius: 12px;
  }
  .dl-info { font-size: 0.85rem; color: var(--muted); line-height: 1.6; }
  .dl-info strong { color: var(--text); font-family: 'Syne', sans-serif; }
  .dl-info small  { display: block; font-size: 0.75rem; margin-top: 0.1rem; }
  .dl-error { font-size: 0.75rem; color: #f87171; margin-top: 0.35rem; }
  .dl-trials {
    font-size: 0.75rem; color: var(--gold); margin-top: 0.4rem;
    display: flex; align-items: center; gap: 0.35rem;
  }

  .dl-btns { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: flex-start; }

  .dl-btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.55rem 1.1rem; border-radius: 9px;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap;
  }
  .dl-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }

  .dl-btn.pdf {
    background: rgba(248,113,113,0.12); color: #f87171;
    border: 1px solid rgba(248,113,113,0.25);
  }
  .dl-btn.pdf:hover:not(:disabled) {
    background: rgba(248,113,113,0.2); transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(248,113,113,0.15);
  }
  .dl-btn.word {
    background: rgba(59,130,246,0.12); color: #60a5fa;
    border: 1px solid rgba(59,130,246,0.25);
  }
  .dl-btn.word:hover:not(:disabled) {
    background: rgba(59,130,246,0.2); transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59,130,246,0.15);
  }

  .dl-spinner {
    width: 12px; height: 12px; border: 2px solid currentColor;
    border-top-color: transparent; border-radius: 50%;
    animation: spin 0.6s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Question list ─────────────────────────────────────────────── */
  .q-list { display: flex; flex-direction: column; gap: 1.25rem; }

  .q-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 1.75rem;
    position: relative; overflow: hidden; transition: border-color 0.2s;
  }
  .q-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  }
  .q-card.obj::before    { background: var(--mid); }
  .q-card.theory::before { background: var(--gold); }
  .q-card:hover { border-color: var(--border-hover); }

  .q-card-header {
    display: flex; align-items: center; gap: 0.6rem;
    flex-wrap: wrap; margin-bottom: 1rem;
  }
  .q-num {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.8rem;
    color: var(--muted); letter-spacing: 0.05em;
  }
  .q-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .q-badge.obj    { background: var(--mid-dim);            color: var(--accent); }
  .q-badge.theory { background: var(--gold-dim);           color: var(--gold);   }
  .q-badge.easy   { background: rgba(0,232,122,0.12);      color: var(--accent); }
  .q-badge.medium { background: var(--gold-dim);           color: var(--gold);   }
  .q-badge.hard   { background: rgba(248,113,113,0.12);    color: var(--red);    }

  .q-marks {
    margin-left: auto; font-size: 0.75rem; color: var(--muted);
    background: var(--deep); border: 1px solid var(--border);
    padding: 0.2rem 0.6rem; border-radius: 6px;
  }
  .q-content { font-size: 0.975rem; line-height: 1.7; color: var(--text); margin-bottom: 1.25rem; }
  .q-image { max-width: 100%; border-radius: 8px; margin-bottom: 1.25rem; border: 1px solid var(--border); }

  .choices { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .choice-item {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.75rem 1rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep); transition: all 0.15s;
  }
  .choice-item.correct { background: rgba(156,213,255,0.06); border-color: rgba(156,213,255,0.2); }
  .choice-label {
    font-weight: 700; font-size: 0.875rem; flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--card); border: 1px solid var(--border);
    font-family: 'Syne', sans-serif;
  }
  .choice-item.correct .choice-label { background: var(--accent); color: var(--black); border-color: var(--accent); }
  .choice-body { flex: 1; }
  .choice-text { font-size: 0.9rem; line-height: 1.5; }
  .choice-item.correct .choice-text { color: var(--accent); }
  .correct-tick { font-size: 0.75rem; color: var(--accent); font-weight: 700; margin-left: auto; flex-shrink: 0; }
  .choice-explanation { font-size: 0.8rem; color: var(--muted); margin-top: 0.4rem; line-height: 1.5; font-style: italic; }

  .theory-answer {
    background: var(--deep); border: 1px solid rgba(245,200,66,0.15);
    border-radius: 10px; padding: 1.25rem; margin-top: 0.5rem;
  }
  .theory-answer-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold); margin-bottom: 0.75rem; }
  .theory-answer-content { font-size: 0.9rem; line-height: 1.7; color: var(--muted-light); }
  .marking-guide { margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem; }
  .marking-guide summary { font-size: 0.78rem; font-weight: 600; color: var(--muted); cursor: pointer; user-select: none; }
  .marking-guide summary:hover { color: var(--text); }
  .marking-guide p { font-size: 0.85rem; color: var(--muted); line-height: 1.6; margin-top: 0.5rem; }

  .video-link {
    display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 0.75rem;
    font-size: 0.8rem; font-weight: 600; color: var(--mid); text-decoration: none;
    padding: 0.35rem 0.8rem; background: var(--mid-dim);
    border: 1px solid rgba(122,170,206,0.2); border-radius: 6px; transition: all 0.2s;
  }
  .video-link:hover { transform: translateX(2px); }

  .q-topics { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 1rem; }
  .topic-tag {
    font-size: 0.72rem; color: var(--muted); background: var(--deep);
    border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 100px;
  }
`;

export default function QuestionList({ questions, filterMeta, access }) {
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [error,       setError]       = useState(null);

  if (!questions.length) return null;

  const buildTitle = () => {
    if (filterMeta) {
      const parts = [];
      if (filterMeta.subject)       parts.push(filterMeta.subject);
      if (filterMeta.examBoard)     parts.push(filterMeta.examBoard);
      if (filterMeta.years?.length) parts.push(filterMeta.years.join('-'));
      if (parts.length) return parts.join(' ');
    }
    return 'Question Set';
  };

  const downloadOne = async (fmt, copyType, title) => {
    const res = await fetch('/api/catalog/questions/download/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
      body: JSON.stringify({
        question_ids: questions.map(q => q.id),
        title, format: fmt, copy_type: copyType,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to generate ${copyType} ${fmt.toUpperCase()}`);
    }
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${title.replace(/\s+/g, '_')}_${copyType}.${fmt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (fmt) => {
    const setLoading = fmt === 'pdf' ? setPdfLoading : setWordLoading;
    setLoading(true);
    setError(null);
    try {
      const title = buildTitle();
      await downloadOne(fmt, 'student', title);
      await new Promise(r => setTimeout(r, 600));
      await downloadOne(fmt, 'teacher', title);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const busy     = pdfLoading || wordLoading;
  // PDF is always available if access is allowed; Word only for subscribed teachers
  const canDownload = access?.allowed ?? false;
  const showWord    = access ? !access.pdf_only : false;
  const trialsLeft  = access?.trials_remaining ?? 0;

  return (
    <>
      <style>{styles}</style>

      {/* ── Download bar ───────────────────────────────────────────────── */}
      <div className="download-bar">
        <div className="dl-info">
          <strong>{questions.length} question{questions.length !== 1 ? 's' : ''} ready</strong>
          <small>
            {showWord
              ? "Each download saves two files — student copy (no answers) and teacher copy (with answers & topics)."
              : "Downloads as PDF. Upgrade to Teacher Pro to also get Word format."}
          </small>
          {/* Trials counter shown only for free teachers */}
          {access?.is_free && (
            <div className="dl-trials">
              🏷️ <strong>{trialsLeft} free trial{trialsLeft !== 1 ? 's' : ''} remaining</strong>
            </div>
          )}
          {error && <div className="dl-error">⚠️ {error}</div>}
        </div>

        <div className="dl-btns">
          {/* PDF — always shown, disabled if no access or busy */}
          <button className="dl-btn pdf"
            onClick={() => handleDownload('pdf')}
            disabled={!canDownload || busy}>
            {pdfLoading
              ? <><div className="dl-spinner" />Generating PDF…</>
              : <>📄 Download PDF</>}
          </button>

          {/* Word — only shown for subscribed teachers */}
          {showWord && (
            <button className="dl-btn word"
              onClick={() => handleDownload('docx')}
              disabled={busy}>
              {wordLoading
                ? <><div className="dl-spinner" />Generating Word…</>
                : <>📝 Download Word</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Question cards ─────────────────────────────────────────────── */}
      <div className="q-list">
        {questions.map(q => (
          <div key={q.id} className={`q-card ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
            <div className="q-card-header">
              <span className="q-num">Q{q.question_number}</span>
              <span className={`q-badge ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
                {q.question_type === 'OBJ' ? 'Objective' : 'Theory'}
              </span>
              {q.difficulty && (
                <span className={`q-badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
              )}
              <span className="q-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
            </div>

            <p className="q-content">{q.content}</p>

            {q.image && (
              <img src={q.image} alt={`Q${q.question_number}`} className="q-image" />
            )}

            {q.question_type === 'OBJ' && q.choices?.length > 0 && (
              <ul className="choices">
                {q.choices.map(c => (
                  <li key={c.id} className={`choice-item ${c.is_correct ? 'correct' : ''}`}>
                    <span className="choice-label">{c.label}</span>
                    <div className="choice-body">
                      <div className="choice-text">{c.choice_text}</div>
                      {c.is_correct && c.explanation && (
                        <div className="choice-explanation">💡 {c.explanation}</div>
                      )}
                      {c.video_url && (
                        <a href={c.video_url} target="_blank" rel="noreferrer" className="video-link">
                          ▶ Watch explanation
                        </a>
                      )}
                    </div>
                    {c.is_correct && <span className="correct-tick">✓</span>}
                  </li>
                ))}
              </ul>
            )}

            {q.question_type === 'THEORY' && q.theory_answer && (
              <div className="theory-answer">
                <div className="theory-answer-title">Model Answer</div>
                <div className="theory-answer-content">{q.theory_answer.content}</div>
                {q.theory_answer.marking_guide && (
                  <details className="marking-guide">
                    <summary>📋 View Marking Guide</summary>
                    <p>{q.theory_answer.marking_guide}</p>
                  </details>
                )}
                {q.theory_answer.video_url && (
                  <a href={q.theory_answer.video_url} target="_blank" rel="noreferrer" className="video-link">
                    ▶ Watch walkthrough
                  </a>
                )}
              </div>
            )}

            {q.topics?.length > 0 && (
              <div className="q-topics">
                {q.topics.map(t => <span key={t.id} className="topic-tag">{t.name}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}