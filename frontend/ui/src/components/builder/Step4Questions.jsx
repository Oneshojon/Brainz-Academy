import { useState, useEffect, useRef } from "react";
import api from "../../api";

const styles = `
/* Year bar — single row, horizontal scroll, no wrap */
.q4-year-bar {
  display: flex; gap: 0.4rem; flex-wrap: nowrap;
  overflow-x: auto; margin-bottom: 0.65rem;
  padding-bottom: 0.2rem; /* room for scrollbar on some OS */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}
.q4-year-bar::-webkit-scrollbar { display: none; } /* Chrome/Safari */

.q4-year-pill {
  padding: 0.25rem 0.65rem; border-radius: 100px; font-size: 0.72rem; font-weight: 700;
  border: 1.5px solid #C2D4EC; background: #ffffff; color: #6B7FA3;
  cursor: pointer; transition: all 0.15s; font-family: 'Plus Jakarta Sans', sans-serif;
  flex-shrink: 0; /* prevent pills from squishing */
}
.q4-year-pill.active { background: #0B2D72; color: #ffffff; border-color: #0B2D72; }
.q4-year-pill:hover:not(.active) { border-color: #0B2D72; color: #0B2D72; }

/* ── Type toggle inside topic bar ── */
.q4-type-toggle {
  display: flex; gap: 0.2rem;
  background: #EDF1F8; border: 1.5px solid #C2D4EC;
  padding: 0.18rem; border-radius: 8px; flex-shrink: 0;
}
.q4-type-btn {
  padding: 0.22rem 0.6rem; border-radius: 6px; border: none;
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.72rem;
  cursor: pointer; transition: all 0.15s; line-height: 1;
}
.q4-type-btn.active  { background: #0B2D72; color: #ffffff; }
.q4-type-btn:not(.active) { background: transparent; color: #6B7FA3; }
.q4-type-btn:not(.active):hover { color: #0B2D72; }

/* Question limit counter + cap banner */
.q4-limit-counter {
  font-size: 0.72rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 0.18rem 0.55rem; border-radius: 100px;
  border: 1.5px solid #C2D4EC; background: #EDF1F8; color: #6B7FA3;
  transition: all 0.2s;
}
.q4-limit-counter.near  { background: #FEF3C7; border-color: rgba(184,134,11,0.35); color: #B8860B; }
.q4-limit-counter.full  { background: #FEE2E2; border-color: rgba(220,38,38,0.3);   color: #DC2626; }

.q4-cap-banner {
  display: flex; align-items: center; gap: 0.5rem;
  background: #FEF3C7; border: 1px solid rgba(184,134,11,0.3);
  border-radius: 8px; padding: 0.55rem 0.8rem;
  font-size: 0.78rem; color: #B8860B; margin-bottom: 0.65rem; line-height: 1.4;
}
.q4-cap-banner a { color: #0992C2; font-weight: 700; text-decoration: none; }
.q4-cap-banner a:hover { text-decoration: underline; }

/* Disabled add button */
.q4-add-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none !important; }

  .q4-layout { display: grid; grid-template-columns: 400px 1fr; gap: 1.25rem; align-items: start; }
  @media (max-width: 900px) { .q4-layout { grid-template-columns: 1fr; } }

  .q4-topic-bar {
    display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 10px;
    padding: 0.6rem 1rem; box-shadow: 0 1px 3px rgba(11,45,114,0.05);
  }
  .q4-topic-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6B7FA3; }
  .q4-topic-name  { font-size: 0.875rem; font-weight: 700; color: #0B2D72; flex: 1; }
  .q4-topic-btn {
    background: #EDF1F8; border: 1.5px solid #C2D4EC; color: #6B7FA3;
    border-radius: 100px; padding: 0.28rem 0.7rem; font-size: 0.75rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .q4-topic-btn:hover { border-color: #0B2D72; color: #0B2D72; }

  /* ── Left panel ── */
  .q4-list-panel { }
  .q4-list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem; }
  .q4-list-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.88rem; color: #0B2D72; }

  .q4-search {
    width: 100%; background: #ffffff; border: 1.5px solid #C2D4EC; color: #0D1B3E;
    padding: 0.55rem 0.9rem; border-radius: 100px; font-size: 0.85rem; outline: none;
    transition: border-color 0.2s; margin-bottom: 0.75rem; font-family: 'Inter', sans-serif;
    box-shadow: 0 1px 3px rgba(11,45,114,0.06); box-sizing: border-box;
  }
  .q4-search:focus { border-color: #0992C2; }
  .q4-search::placeholder { color: #6B7FA3; }

  /* Desktop: scrollable list */
  .q4-question-rows { display: flex; flex-direction: column; gap: 0.4rem; max-height: 560px; overflow-y: auto; padding-right: 4px; }
  .q4-question-rows::-webkit-scrollbar { width: 4px; }
  .q4-question-rows::-webkit-scrollbar-thumb { background: #C2D4EC; border-radius: 2px; }

  /* Mobile: no max-height, natural scroll */
  @media (max-width: 900px) {
    .q4-question-rows { max-height: none; overflow-y: visible; padding-right: 0; }
  }

  .q4-row {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 10px;
    padding: 0.75rem 0.9rem; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 0.75rem;
    box-shadow: 0 1px 3px rgba(11,45,114,0.05);
  }
  .q4-row:hover { border-color: #0B2D72; background: #F7FAFD; }
  .q4-row:active { transform: scale(0.99); }
  .q4-row.previewing { border-color: #0B2D72; background: rgba(11,45,114,0.05); border-left: 4px solid #0B2D72; }
  .q4-row.added { border-color: #15803D; background: #DCFCE7; border-left: 4px solid #15803D; }
  /* On mobile, previewing row gets bottom border only when expanded */
  @media (max-width: 900px) {
    .q4-row.previewing { border-radius: 10px 10px 0 0; border-bottom-color: #C2D4EC; }
    .q4-row.previewing.added { border-radius: 10px 10px 0 0; }
  }

  .q4-row-meta { flex: 1; min-width: 0; }
  .q4-row-title { font-size: 0.78rem; font-weight: 600; color: #0B2D72; margin-bottom: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .q4-row-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }

  .q4-tag {
    font-size: 0.62rem; font-weight: 700; padding: 0.12rem 0.42rem; border-radius: 100px;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .q4-tag.year   { background: #EDF1F8; color: #6B7FA3; border: 1px solid #C2D4EC; }
  .q4-tag.marks  { background: #EDF1F8; color: #6B7FA3; border: 1px solid #C2D4EC; }
  .q4-tag.obj    { background: rgba(9,146,194,0.1); color: #0992C2; }
  .q4-tag.theory { background: #FEF3C7; color: #B8860B; }
  .q4-tag.easy   { background: #DCFCE7; color: #15803D; }
  .q4-tag.medium { background: #FEF3C7; color: #B8860B; }
  .q4-tag.hard   { background: #FEE2E2; color: #DC2626; }

  .q4-add-btn {
    background: #0B2D72; color: #ffffff; border: none; border-radius: 8px;
    width: 30px; height: 30px; font-size: 1rem; font-weight: 700;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .q4-add-btn:hover { background: #0a2360; }
  .q4-add-btn:active { transform: scale(0.9); }
  .q4-add-btn.remove {
    background: #DCFCE7; color: #15803D; border: 1.5px solid rgba(21,128,61,0.3);
    font-size: 0.7rem; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
  }
  .q4-add-btn.remove:hover { background: #FEE2E2; color: #DC2626; border-color: rgba(220,38,38,0.3); }

  /* ── Mobile inline preview accordion ── */
  .q4-mobile-accordion {
    display: none;
  }
  @media (max-width: 900px) {
    .q4-mobile-accordion {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.28s ease;
      border: 1.5px solid #0B2D72;
      border-top: none;
      border-radius: 0 0 10px 10px;
      background: #ffffff;
      margin-top: -2px; /* overlap the row's bottom border */
      margin-bottom: 0.4rem;
    }
    .q4-mobile-accordion.open { grid-template-rows: 1fr; }
    .q4-mobile-accordion-inner { overflow: hidden; }
    .q4-mobile-accordion-body { padding: 1rem; border-top: 1px solid #C2D4EC; }
  }

  /* ── Right: preview panel (desktop only) ── */
  .q4-preview-panel {
    position: sticky; top: 80px;
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 16px;
    min-height: 400px; overflow: hidden;
    box-shadow: 0 4px 20px rgba(11,45,114,0.09);
  }
  @media (max-width: 900px) { .q4-preview-panel { display: none; } }

  .q4-preview-header {
    padding: 0.9rem 1.1rem; border-bottom: 1px solid #C2D4EC;
    display: flex; align-items: center; justify-content: space-between;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.85rem;
    color: #0B2D72; background: #EDF1F8;
  }
  .q4-preview-body { padding: 1.25rem; overflow-y: auto; max-height: 560px; }
  .q4-preview-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 4rem 2rem; text-align: center; color: #6B7FA3; gap: 0.75rem;
    font-size: 0.875rem;
  }
  .q4-preview-content { font-size: 0.925rem; line-height: 1.75; margin-bottom: 1.25rem; color: #0D1B3E; }
  .q4-preview-img { max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #C2D4EC; display: block; }

  .q4-preview-choices { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; padding: 0; }
  .q4-preview-choice {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.9rem;
    border-radius: 10px; border: 1.5px solid #C2D4EC; background: #F7FAFD; font-size: 0.875rem;
    color: #0D1B3E;
  }
  .q4-preview-choice.correct { border-color: rgba(21,128,61,0.35); background: #DCFCE7; color: #0D1B3E;}
  .q4-choice-label {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.72rem;
    background: #ffffff; border: 1.5px solid #C2D4EC; color: #6B7FA3;
  }
  .q4-choice-label.correct { background: #15803D; color: #fff; border-color: #15803D; }

  .q4-preview-add-btn {
    width: 100%; padding: 0.75rem; margin-top: 1.25rem;
    background: #0B2D72; color: #ffffff; border: none; border-radius: 100px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.9rem;
    cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 14px rgba(11,45,114,0.25);
  }
  .q4-preview-add-btn:hover { background: #0a2360; }
  .q4-preview-add-btn:active { transform: scale(0.98); }
  .q4-preview-add-btn.added {
    background: #DCFCE7; color: #15803D; border: 1.5px solid rgba(21,128,61,0.3); box-shadow: none;
  }
  .q4-preview-add-btn.added:hover { background: #FEE2E2; color: #DC2626; border-color: rgba(220,38,38,0.3); }

  /* ── Table styles ── */
.q4-preview-content table,
.q4-preview-body table {
  border-collapse: collapse; width: 100%; margin: 0.75rem 0; font-size: 0.875rem;
}
.q4-preview-content table th,
.q4-preview-content table td,
.q4-preview-body table th,
.q4-preview-body table td {
  border: 1.5px solid #C2D4EC; padding: 0.45rem 0.7rem;
  text-align: left; vertical-align: top;
}
.q4-preview-content table th,
.q4-preview-body table th {
  background: #EDF1F8; font-weight: 700; color: #0B2D72;
}
.q4-preview-content table tr:nth-child(even),
.q4-preview-body table tr:nth-child(even) { background: #F7FAFD; }
`;

/* ── Shared preview content (used in both desktop panel and mobile accordion) ── */
function PreviewBody({ q, isAdded, onAdd, onRemove, atLimit, maxQ }) {
  const ref = useRef(null);

  // Trigger KaTeX after content mounts or question changes
  useEffect(() => {
    if (ref.current && window.renderMath) {
      window.renderMath(ref.current);
    }
  }, [q]);

  if (!q) return null;

  return (
    <div ref={ref}>
      <div className="q4-row-tags" style={{ marginBottom: '1rem', flexWrap: 'wrap', display: 'flex', gap: '0.35rem' }}>
        {q.exam_year && (
          <span className="q4-tag year">{q.exam_year} · {q.exam_board}</span>
        )}
        <span className={`q4-tag ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
          {q.question_type === 'OBJ' ? 'Objective' : 'Theory'}
        </span>
        <span className="q4-tag marks">{q.marks ?? 1} mark{(q.marks ?? 1) !== 1 ? 's' : ''}</span>
        {q.difficulty && (
          <span className={`q4-tag ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
        )}
      </div>

      {/* Question content — rendered as HTML with KaTeX */}
      <div className="q4-preview-content" dangerouslySetInnerHTML={{ __html: q.content }} />

      {q.image && (
        <img src={q.image} alt="Question" className="q4-preview-img" />
      )}

      {q.content_after_image && (
        <div className="q4-preview-content"
            dangerouslySetInnerHTML={{ __html: q.content_after_image }} />
      )}

      {q.question_type === 'OBJ' && q.choices?.length > 0 && (
        <ul className="q4-preview-choices">
          {q.choices.map(c => (
            <li key={c.id} className={`q4-preview-choice ${c.is_correct ? 'correct' : ''}`}>
              <span className={`q4-choice-label ${c.is_correct ? 'correct' : ''}`}>{c.label}</span>
              {/* Choice text — rendered as HTML with KaTeX */}
              <span dangerouslySetInnerHTML={{ __html: c.choice_text }} />
            </li>
          ))}
        </ul>
      )}

      {q.question_type === 'THEORY' && q.theory_answer && (
        <div style={{
          marginTop: '1rem', padding: '0.85rem', background: '#FEF3C7',
          borderRadius: '10px', border: '1px solid rgba(184,134,11,0.2)',
          fontSize: '0.85rem', lineHeight: 1.7,
        }}>
          <strong style={{
            color: '#B8860B', display: 'block', marginBottom: '0.4rem',
            fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>Model Answer</strong>
          {/* Theory answer — rendered as HTML with KaTeX */}
          <span dangerouslySetInnerHTML={{ __html: q.theory_answer.content }} />
        </div>
      )}

      <button
        className={`q4-preview-add-btn ${isAdded ? 'added' : ''}`}
        disabled={!isAdded && atLimit}
        title={!isAdded && atLimit ? `Limit of ${maxQ} reached — upgrade to add more` : ''}
        onClick={() => isAdded ? onRemove(q.id) : onAdd(q)}
      >
        {isAdded
          ? '✓ Added — Click to Remove'
          : atLimit
            ? `Limit reached (${maxQ})`
            : '+ Add to Test'}
      </button>
    </div>
  );
}

export default function Step4Questions({
  board, subject, theme, savedQuestions,
  onAdd, onRemove, onBack, onDone, onChangeTheme,
  access, qTypeFilter, onQTypeFilter, 
}) {
  const topic     = theme?.selectedTopic;
  const maxQ      = access?.max_questions ?? Infinity;
  const atLimit   = savedQuestions.length >= maxQ;
  const nearLimit = !atLimit && savedQuestions.length >= maxQ - 2;

  const [questions, setQuestions]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [previewQ, setPreviewQ]             = useState(null);
  const [previewId, setPreviewId]           = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears]   = useState([]);

  useEffect(() => {
    if (!topic) return;
    setLoading(true);
    setSelectedYears([]);
    const params = new URLSearchParams({ topic: topic.id });
    if (board && board.id !== 'mix') params.set('exam_board', board.id);
    Promise.all([
      api.get(`questions-by-topic/?${params}`),
      api.get(`years/?subject=${topic.subject}${board?.id && board.id !== 'mix' ? `&exam_board=${board.id}` : ''}`),
    ])
      .then(([qRes, yRes]) => {
        setQuestions(qRes.data);
        setAvailableYears(yRes.data.years || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topic, board]);

  const toggleYear = (year) => {
    const y = Number(year);
    setSelectedYears(prev => prev.includes(y) ? prev.filter(n => n !== y) : [...prev, y]);
  };

  const handlePreview = (q) => {
    // Toggle: clicking same row collapses it
    if (previewId === q.id) {
      setPreviewId(null);
      setPreviewQ(null);
      return;
    }
    setPreviewId(q.id);
    setPreviewQ(q);
  };

  const handleAdd = (q) => {
    if (atLimit) return;
    const enrich = (fullQ) => ({
      ...fullQ,
      topic_names: fullQ.topic_names?.length > 0 ? fullQ.topic_names : [topic?.name].filter(Boolean),
    });
    onAdd(enrich(q));
  };

  const isAdded = (id) => savedQuestions.some(q => q.id === id);

  const filtered = questions.filter(q => {
    if (selectedYears.length > 0 && !selectedYears.includes(Number(q.exam_year))) return false;
    if (qTypeFilter && q.question_type !== qTypeFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(q.exam_year).includes(s) ||
      (q.difficulty || '').toLowerCase().includes(s) ||
      (q.question_type || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      <style>{styles}</style>
      <button className="btn-back-sm" onClick={onBack}>← Back</button>

      <div className="q4-topic-bar">
      <span className="q4-topic-label">Topic:</span>
      <span className="q4-topic-name">{topic?.name}</span>

      {/* Question type filter */}
      {onQTypeFilter && (
        <div className="q4-type-toggle">
          {[['', 'All'], ['OBJ', 'OBJ'], ['THEORY', 'Theory']].map(([val, label]) => (
            <button
              key={val}
              className={`q4-type-btn ${(qTypeFilter ?? '') === val ? 'active' : ''}`}
              onClick={() => onQTypeFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <button className="q4-topic-btn" onClick={onChangeTheme}>Change Topic</button>
    </div>

      <div className="q4-layout">
        {/* ── Left: question list ── */}
        <div className="q4-list-panel">
          <div className="q4-list-header">
            <span className="q4-list-title">
              {loading ? 'Loading…' : `${filtered.length} question${filtered.length !== 1 ? 's' : ''}`}
            </span>
            {access && maxQ !== Infinity && (
              <span className={`q4-limit-counter ${atLimit ? 'full' : nearLimit ? 'near' : ''}`}>
                {savedQuestions.length} / {maxQ} added
              </span>
            )}
          </div>

          {/* Cap reached banner */}
          {atLimit && access && (
            <div className="q4-cap-banner">
              <span>⚠️</span>
              <span>
                <strong>Question limit reached ({maxQ}).</strong>{' '}
                <a href="/pricing/?tab=teacher">Upgrade</a> to add more.
              </span>
            </div>
          )}

          {availableYears.length > 1 && (
            <div className="q4-year-bar">
              {availableYears.map(year => (
                <button key={year}
                  className={`q4-year-pill ${selectedYears.includes(year) ? 'active' : ''}`}
                  onClick={() => toggleYear(year)}>
                  {year}
                </button>
              ))}
            </div>
          )}

          <input className="q4-search"
            placeholder="Search by year, type, difficulty…"
            value={search}
            onChange={e => setSearch(e.target.value)} />

          <div className="q4-question-rows">
            {filtered.map((q, i) => {
              const added    = isAdded(q.id);
              const expanded = previewId === q.id;
              return (
                <div key={q.id}>
                  {/* Row header */}
                  <div
                    className={`q4-row ${expanded ? 'previewing' : ''} ${added ? 'added' : ''}`}
                    onClick={() => handlePreview(q)}
                  >
                    <div className="q4-row-meta">
                      <div className="q4-row-title">
                        Q{i + 1} · {q.topic_names?.length > 0 ? q.topic_names[0] : q.subject_name}
                      </div>
                      <div className="q4-row-tags">
                        {q.exam_year && <span className="q4-tag year">{q.exam_year}</span>}
                        <span className={`q4-tag ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
                          {q.question_type === 'OBJ' ? 'OBJ' : 'Theory'}
                        </span>
                        <span className="q4-tag marks">{q.marks ?? 1} mark</span>
                        {q.difficulty && <span className={`q4-tag ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>}
                      </div>
                    </div>
                    <button
                      className={`q4-add-btn ${added ? 'remove' : ''}`}
                      disabled={!added && atLimit}
                      title={!added && atLimit ? `Limit of ${maxQ} reached` : added ? 'Remove' : 'Add to test'}
                      onClick={e => { e.stopPropagation(); added ? onRemove(q.id) : handleAdd(q); }}
                    >
                      {added ? '✓' : '+'}
                    </button>
                  </div>

                  {/* Mobile inline accordion preview */}
                  <div className={`q4-mobile-accordion ${expanded ? 'open' : ''}`}>
                    <div className="q4-mobile-accordion-inner">
                      <div className="q4-mobile-accordion-body">
                        <PreviewBody
                          q={previewQ}
                          isAdded={previewQ ? isAdded(previewQ.id) : false}
                          onAdd={handleAdd}
                          onRemove={onRemove}
                          atLimit={atLimit}
                          maxQ={maxQ}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && filtered.length === 0 && (
              <div style={{ color: '#6B7FA3', padding: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
                No questions found.
              </div>
            )}
          </div>
        </div>

        {/* ── Right: desktop preview panel ── */}
        <div className="q4-preview-panel">
          <div className="q4-preview-header">
            <span>Preview</span>
            {previewId && (
              <span style={{ fontSize: '0.72rem', color: '#6B7FA3', fontWeight: 400 }}>
                Q{previewQ?.question_number}
              </span>
            )}
          </div>
          <div className="q4-preview-body">
            {!previewId ? (
              <div className="q4-preview-empty">
                <span style={{ fontSize: '2rem' }}>👆</span>
                <span>Click a question to preview it here</span>
              </div>
            ) : (
              <PreviewBody
                q={previewQ}
                isAdded={previewQ ? isAdded(previewQ.id) : false}
                onAdd={handleAdd}
                onRemove={onRemove}
                atLimit={atLimit}
                maxQ={maxQ}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}