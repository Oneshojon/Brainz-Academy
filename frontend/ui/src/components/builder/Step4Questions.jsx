import { useState, useEffect, useRef } from "react";
import api from "../../api";

const styles = `
  .q4-layout { display: grid; grid-template-columns: 420px 1fr; gap: 1.5rem; align-items: start; }
  @media (max-width: 900px) { .q4-layout { grid-template-columns: 1fr; } }

  /* ── Left panel ── */
  .q4-list-panel { }
  .q4-list-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;
  }
  .q4-list-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; }
  .q4-search {
    width: 100%; background: var(--deep); border: 1px solid var(--border);
    color: var(--text); padding: 0.5rem 0.85rem; border-radius: 8px;
    font-size: 0.85rem; outline: none; transition: border-color 0.2s; margin-bottom: 0.75rem;
  }
  .q4-search:focus { border-color: rgba(156,213,255,0.4); }

  .q4-question-rows { display: flex; flex-direction: column; gap: 0.4rem; max-height: 600px; overflow-y: auto; padding-right: 4px; }
  .q4-question-rows::-webkit-scrollbar { width: 4px; }
  .q4-question-rows::-webkit-scrollbar-thumb { background: var(--base); border-radius: 2px; }

  .q4-row {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 0.75rem 0.9rem; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 0.75rem;
  }
  .q4-row:hover { border-color: var(--border-hover); }
  .q4-row.previewing { border-color: var(--accent); background: var(--accent-dim); }
  .q4-row.added { border-color: rgba(74,222,128,0.35); background: var(--green-dim); }

  .q4-row-meta { flex: 1; min-width: 0; }
  .q4-row-title { font-size: 0.78rem; font-weight: 600; color: var(--muted-light); margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .q4-row-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  .q4-tag {
    font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .q4-tag.year  { background: var(--deep); color: var(--muted-light); border: 1px solid var(--border); }
  .q4-tag.obj   { background: var(--accent-dim); color: var(--accent); }
  .q4-tag.theory{ background: rgba(245,200,66,0.1); color: var(--gold); }
  .q4-tag.marks { background: rgba(167,139,250,0.1); color: #a78bfa; }
  .q4-tag.easy  { background: rgba(74,222,128,0.1); color: var(--green); }
  .q4-tag.medium{ background: rgba(245,200,66,0.1); color: var(--gold); }
  .q4-tag.hard  { background: rgba(248,113,113,0.1); color: var(--red); }

  .q4-add-btn {
    background: var(--accent); color: var(--black); border: none; border-radius: 6px;
    width: 28px; height: 28px; font-size: 1rem; font-weight: 700;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .q4-add-btn:hover { background: #c2e8ff; }
  .q4-add-btn.remove { background: var(--green-dim); color: var(--green); border: 1px solid rgba(74,222,128,0.3); font-size: 0.7rem; }
  .q4-add-btn.remove:hover { background: var(--red-dim); color: var(--red); border-color: rgba(248,113,113,0.3); }

  /* ── Right panel ── */
  .q4-preview-panel {
    position: sticky; top: 80px;
    background: var(--card); border: 1px solid var(--border); border-radius: 14px;
    min-height: 400px; overflow: hidden;
  }
  .q4-preview-header {
    padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem;
  }
  .q4-preview-body { padding: 1.25rem; overflow-y: auto; max-height: 580px; }
  .q4-preview-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: var(--muted); }
  .q4-preview-content { font-size: 0.925rem; line-height: 1.75; margin-bottom: 1.25rem; }
  .q4-preview-img { max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border); display: block; }
  .q4-preview-choices { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .q4-preview-choice {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.9rem;
    border-radius: 8px; border: 1px solid var(--border); background: var(--deep);
    font-size: 0.875rem;
  }
  .q4-preview-choice.correct { border-color: rgba(74,222,128,0.35); background: var(--green-dim); }
  .q4-choice-label {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.72rem;
    background: var(--card); border: 1px solid var(--border);
  }
  .q4-choice-label.correct { background: var(--green); color: var(--black); border-color: var(--green); }
  .q4-preview-add-btn {
    width: 100%; padding: 0.75rem; margin-top: 1.25rem;
    background: var(--accent); color: var(--black); border: none; border-radius: 10px;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem;
    cursor: pointer; transition: all 0.2s;
  }
  .q4-preview-add-btn:hover { background: #c2e8ff; }
  .q4-preview-add-btn.added { background: var(--green-dim); color: var(--green); border: 1px solid rgba(74,222,128,0.3); }
  .q4-preview-add-btn.added:hover { background: var(--red-dim); color: var(--red); border-color: rgba(248,113,113,0.3); }

  .q4-topic-bar {
    display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;
  }
  .q4-topic-btn {
    background: var(--deep); border: 1px solid var(--border); color: var(--muted-light);
    border-radius: 7px; padding: 0.3rem 0.7rem; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif;
  }
  .q4-topic-btn:hover { border-color: var(--border-hover); color: var(--text); }
  .q4-topic-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
`;

export default function Step4Questions({ board, subject, theme, savedQuestions, onAdd, onRemove, onBack, onDone, onChangeTheme }) {
  const topic = theme?.selectedTopic;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [previewQ, setPreviewQ]   = useState(null);   // full question detail
  const [previewId, setPreviewId] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!topic) return;
    setLoading(true);
    const params = new URLSearchParams({ topic: topic.id });
    if (board && board.id !== 'mix') params.set('exam_board', board.id);
    api.get(`questions-by-topic/?${params}`)
      .then(r => setQuestions(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topic, board]);

  const handlePreview = (q) => {
    if (previewId === q.id) return; // already previewing
    setPreviewId(q.id);
    setLoadingPreview(true);
    api.get(`questions/${q.id}/`)
      .then(r => setPreviewQ(r.data))
      .catch(() => {})
      .finally(() => setLoadingPreview(false));
  };

  const isAdded = (id) => savedQuestions.some(q => q.id === id);

  const filtered = questions.filter(q => {
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
        <span style={{fontSize:'0.8rem', color:'var(--muted)'}}>Topic:</span>
        <span style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text)'}}>{topic?.name}</span>
        <button className="q4-topic-btn" onClick={onChangeTheme}>Change Topic</button>
      </div>

      <div className="q4-layout">
        {/* ── Left: question list ── */}
        <div className="q4-list-panel">
          <div className="q4-list-header">
            <span className="q4-list-title">
              {loading ? 'Loading…' : `${filtered.length} question${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <input
            className="q4-search"
            placeholder="Search by year, type, difficulty…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="q4-question-rows">
            {filtered.map((q, i) => {
              const added = isAdded(q.id);
              return (
                <div
                  key={q.id}
                  className={`q4-row ${previewId === q.id ? 'previewing' : ''} ${added ? 'added' : ''}`}
                  onClick={() => handlePreview(q)}
                >
                  <div className="q4-row-meta">
                    <div className="q4-row-title">Q{q.question_number ?? i+1} · {q.subject_name}</div>
                    <div className="q4-row-tags">
                      {q.exam_year  && <span className="q4-tag year">{q.exam_year}</span>}
                      <span className={`q4-tag ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
                        {q.question_type === 'OBJ' ? 'OBJ' : 'Theory'}
                      </span>
                      <span className="q4-tag marks">{q.marks ?? 1} mk</span>
                      {q.difficulty && <span className={`q4-tag ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>}
                    </div>
                  </div>
                  <button
                    className={`q4-add-btn ${added ? 'remove' : ''}`}
                    onClick={e => { e.stopPropagation(); added ? onRemove(q.id) : onAdd(q); }}
                    title={added ? 'Remove' : 'Add to test'}
                  >
                    {added ? '✓' : '+'}
                  </button>
                </div>
              );
            })}
            {!loading && filtered.length === 0 && (
              <div style={{color:'var(--muted)', padding:'2rem', textAlign:'center', fontSize:'0.85rem'}}>
                No questions found.
              </div>
            )}
          </div>
        </div>

        {/* ── Right: preview ── */}
        <div className="q4-preview-panel">
          <div className="q4-preview-header">
            <span>Preview</span>
            {previewId && <span style={{fontSize:'0.72rem', color:'var(--muted)'}}>Q{previewQ?.question_number}</span>}
          </div>
          <div className="q4-preview-body">
            {!previewId ? (
              <div className="q4-preview-empty">
                <span style={{fontSize:'2rem', marginBottom:'0.75rem'}}>👆</span>
                <span>Click a question to preview it here</span>
              </div>
            ) : loadingPreview ? (
              <div className="q4-preview-empty">Loading preview…</div>
            ) : previewQ ? (
              <>
                {/* Meta tags */}
                <div className="q4-row-tags" style={{marginBottom:'1rem'}}>
                  {previewQ.exam_year && <span className="q4-tag year">{previewQ.exam_year} · {previewQ.exam_board}</span>}
                  <span className={`q4-tag ${previewQ.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
                    {previewQ.question_type === 'OBJ' ? 'Objective' : 'Theory'}
                  </span>
                  <span className="q4-tag marks">{previewQ.marks ?? 1} mark{(previewQ.marks ?? 1) !== 1 ? 's' : ''}</span>
                  {previewQ.difficulty && <span className={`q4-tag ${previewQ.difficulty.toLowerCase()}`}>{previewQ.difficulty}</span>}
                </div>

                {/* Content */}
                <div
                  className="q4-preview-content"
                  dangerouslySetInnerHTML={{ __html: previewQ.content }}
                />

                {/* Image */}
                {previewQ.image && (
                  <img src={previewQ.image} alt="Question" className="q4-preview-img" />
                )}

                {/* Choices (OBJ) */}
                {previewQ.question_type === 'OBJ' && previewQ.choices?.length > 0 && (
                  <ul className="q4-preview-choices">
                    {previewQ.choices.map(c => (
                      <li key={c.id} className={`q4-preview-choice ${c.is_correct ? 'correct' : ''}`}>
                        <span className={`q4-choice-label ${c.is_correct ? 'correct' : ''}`}>{c.label}</span>
                        <span>{c.choice_text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Theory answer */}
                {previewQ.question_type === 'THEORY' && previewQ.theory_answer && (
                  <div style={{marginTop:'1rem', padding:'0.85rem', background:'var(--deep)', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'0.85rem', color:'var(--muted-light)', lineHeight:1.7}}>
                    <strong style={{color:'var(--gold)', display:'block', marginBottom:'0.4rem'}}>Model Answer:</strong>
                    {previewQ.theory_answer.content}
                  </div>
                )}

                {/* Add/Remove button */}
                <button
                  className={`q4-preview-add-btn ${isAdded(previewQ.id) ? 'added' : ''}`}
                  onClick={() => isAdded(previewQ.id) ? onRemove(previewQ.id) : onAdd(previewQ)}
                >
                  {isAdded(previewQ.id) ? '✓ Added — Click to Remove' : '+ Add to Test'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}