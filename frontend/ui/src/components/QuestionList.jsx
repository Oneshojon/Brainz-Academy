import { useState, useRef, useEffect } from "react";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// ── MathContent ───────────────────────────────────────────────────────────────
// Renders HTML content and triggers KaTeX after mount/update.
// Use this for any field that may contain \(...\) or \[...\] math notation.
function MathContent({ html, className, as: Tag = 'div' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && window.renderMath) {
      window.renderMath(ref.current);
    }
  }, [html]);

  return (
    <Tag
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
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
  .dl-info strong { color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; }
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
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
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
  .q-card.oral::before   { background: #0778A0; }
  /* Theory stripe uses cyan — gold is not part of the BrainzAcademy palette */
  .q-card.theory::before { background: #0992C2; }
  .q-card:hover { border-color: var(--border-hover); }

  .q-card-header {
    display: flex; align-items: center; gap: 0.6rem;
    flex-wrap: wrap; margin-bottom: 1rem;
  }
  .q-num {
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 0.8rem;
    color: var(--muted); letter-spacing: 0.05em;
  }
  .q-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .q-badge.obj    { background: var(--mid-dim);            color: var(--accent); }
  .q-badge.oral   { background: rgba(7,120,160,0.12);      color: #0778A0; border: 1px solid rgba(7,120,160,0.2); }
  /* Theory badge uses cyan to match the card stripe — consistent with palette */
  .q-badge.theory { background: rgba(9,146,194,0.10);      color: #0992C2; border: 1px solid rgba(9,146,194,0.2); }
  .q-badge.easy   { background: rgba(0,232,122,0.12);      color: var(--accent); }
  .q-badge.medium { background: var(--gold-dim);           color: var(--gold);   }
  .q-badge.hard   { background: rgba(248,113,113,0.12);    color: var(--red);    }

  .q-marks {
    margin-left: auto; font-size: 0.75rem; color: var(--muted);
    background: var(--deep); border: 1px solid var(--border);
    padding: 0.2rem 0.6rem; border-radius: 6px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* Explicit font on all question content to prevent browser serif fallback */
  .q-content {
    font-size: 0.975rem; line-height: 1.7; color: var(--text);
    margin-bottom: 1.25rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .q-image { max-width: 100%; border-radius: 8px; margin-bottom: 1.25rem; border: 1px solid var(--border); }

  .choices { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .choice-item {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.75rem 1rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep); transition: all 0.15s;
  }
  .choice-label {
    font-weight: 700; font-size: 0.875rem; flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--card); border: 1px solid var(--border);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .choice-body { flex: 1; }
  /* Explicit font on choice text — fixes the serif fallback seen in the screenshot */
  .choice-text {
    font-size: 0.9rem; line-height: 1.5;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .q-topics { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 1rem; }
  .topic-tag {
    font-size: 0.72rem; color: var(--muted); background: var(--deep);
    border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 100px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* ── Table styles ── */
  .q-content table,
  .choice-text table {
    border-collapse: collapse; width: 100%; margin: 0.75rem 0; font-size: 0.9rem;
  }
  .q-content table th,
  .q-content table td,
  .choice-text table th,
  .choice-text table td {
    border: 1.5px solid #C2D4EC; padding: 0.45rem 0.7rem;
    text-align: left; vertical-align: top;
  }
  .q-content table th { background: #EDF1F8; font-weight: 700; color: #0B2D72; }
  .q-content table tr:nth-child(even) { background: #F7FAFD; }
`;

/**
 * Returns CSS class and display label for a question_type.
 * Kept in sync with the manual builder components.
 */
function qTypeDisplay(questionType) {
  switch (questionType) {
    case 'OBJ':          return { cls: 'obj',    label: 'Objective'    };
    case 'ORAL_ENG_OBJ': return { cls: 'oral',   label: 'Oral Obj'     };
    case 'THEORY':       return { cls: 'theory', label: 'Theory'        };
    default:             return { cls: 'obj',    label: questionType    };
  }
}

/**
 * True when the question type uses MCQ choices (A–E).
 * Both OBJ and ORAL_ENG_OBJ share the same multiple-choice structure.
 */
const isMCQ = (questionType) =>
  questionType === 'OBJ' || questionType === 'ORAL_ENG_OBJ';

export default function QuestionList({ questions, filterMeta, access }) {
  const [downloading, setDownloading] = useState(null);
  const [error,       setError]       = useState(null);

  // Tracks SavedTest PK so re-downloads update existing record, not create new
  const savedTestIdRef = useRef(null);

  if (!questions.length) return null;

  // Reset savedTestId whenever the question set changes (new generation)
  const prevQuestionsRef = useRef(null);
  const questionIds = questions.map(q => q.id).join(',');
  if (prevQuestionsRef.current !== questionIds) {
    prevQuestionsRef.current = questionIds;
    savedTestIdRef.current = null;
  }

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

  const totalMarks = questions.reduce((s, q) => s + (q.marks ?? 1), 0);

  const buildCustomMarks = () => {
    const map = {};
    questions.forEach(q => { map[String(q.id)] = q.marks ?? 1; });
    return map;
  };

  const downloadOne = async (fmt, copyType, title) => {
    const res = await fetch('/api/catalog/questions/download/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'include',
      body: JSON.stringify({
        question_ids:  questions.map(q => q.id),
        title,
        format:        fmt,
        copy_type:     copyType,
        builder_mode:  'random',
        custom_marks:  buildCustomMarks(),
        total_marks:   totalMarks,
        saved_test_id: savedTestIdRef.current,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to generate ${copyType} ${fmt.toUpperCase()}`);
    }

    const returnedId = res.headers.get('X-Saved-Test-Id');
    if (returnedId) savedTestIdRef.current = Number(returnedId);

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

  const handleDownload = async (fmt, copyType) => {
    const key = `${fmt}-${copyType}`;
    setDownloading(key);
    setError(null);
    try {
      await downloadOne(fmt, copyType, buildTitle());
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const busy        = !!downloading;
  const canDownload = access?.allowed ?? false;
  const showWord    = access ? !access.pdf_only : false;
  const trialsLeft  = access?.trials_remaining ?? 0;

  const BtnContent = ({ fmt, copyType }) => {
    const key     = `${fmt}-${copyType}`;
    const loading = downloading === key;
    const icon    = fmt === 'pdf' ? '📄' : '📝';
    const label   = copyType === 'student' ? 'Questions' : 'Mark scheme';
    return loading
      ? <><div className="dl-spinner" />Generating…</>
      : <>{icon} {fmt.toUpperCase()} — {label}</>;
  };

  return (
    <>
      <style>{styles}</style>

      {/* ── Download bar ── */}
      <div className="download-bar">
        <div className="dl-info">
          <strong>{questions.length} question{questions.length !== 1 ? 's' : ''} ready</strong>
          <small>
            Download <em>Questions only</em> for students, or <em>Mark scheme</em> for the teacher copy with answers.
            {!showWord && ' Upgrade to Teacher Pro to also get Word format.'}
          </small>
          {access?.is_free && (
            <div className="dl-trials">
              🏷️ <strong>{trialsLeft} free trial{trialsLeft !== 1 ? 's' : ''} remaining</strong>
            </div>
          )}
          {error && <div className="dl-error">⚠️ {error}</div>}
        </div>

        <div className="dl-btns">
          <button className="dl-btn pdf"
            onClick={() => handleDownload('pdf', 'student')}
            disabled={!canDownload || busy}>
            <BtnContent fmt="pdf" copyType="student" />
          </button>
          <button className="dl-btn pdf"
            onClick={() => handleDownload('pdf', 'teacher')}
            disabled={!canDownload || busy}>
            <BtnContent fmt="pdf" copyType="teacher" />
          </button>
          {showWord && (
            <>
              <button className="dl-btn word"
                onClick={() => handleDownload('docx', 'student')}
                disabled={busy}>
                <BtnContent fmt="docx" copyType="student" />
              </button>
              <button className="dl-btn word"
                onClick={() => handleDownload('docx', 'teacher')}
                disabled={busy}>
                <BtnContent fmt="docx" copyType="teacher" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Question cards ── */}
      <div className="q-list">
        {questions.map((q, idx) => {
          const { cls, label } = qTypeDisplay(q.question_type);
          return (
            <div key={q.id} className={`q-card ${cls}`}>
              <div className="q-card-header">
                <span className="q-num">Q{idx + 1}</span>
                {/* Type badge — ORAL_ENG_OBJ gets its own style, not a fallback */}
                <span className={`q-badge ${cls}`}>{label}</span>
                {q.difficulty && (
                  <span className={`q-badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                )}
                <span className="q-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
              </div>

              {/* Question content — rendered as HTML with KaTeX */}
              <MathContent html={q.content} className="q-content" />

              {q.image && (
                <img src={q.image} alt={`Q${q.question_number}`} className="q-image" />
              )}

              {q.content_after_image && (
                <MathContent html={q.content_after_image} className="q-content" />
              )}

              {/* MCQ choices — both OBJ and ORAL_ENG_OBJ.
                  Choices are displayed without correct-answer highlighting
                  or explanations. This is a question list, not a review. */}
              {isMCQ(q.question_type) && q.choices?.length > 0 && (
                <ul className="choices">
                  {q.choices.map(c => (
                    <li key={c.id} className="choice-item">
                      <span className="choice-label">{c.label}</span>
                      <div className="choice-body">
                        {/* Choice text — rendered as HTML with KaTeX */}
                        <MathContent html={c.choice_text} className="choice-text" />
                        {/* Explanation intentionally omitted — shown in downloaded mark scheme only */}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Theory questions: content only, no model answer shown.
                  Answers appear in the teacher mark scheme download. */}

              {q.topics?.length > 0 && (
                <div className="q-topics">
                  {q.topics.map(t => <span key={t.id} className="topic-tag">{t.name}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}