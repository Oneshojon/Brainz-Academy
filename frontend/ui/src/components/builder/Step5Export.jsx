import { useState, useEffect } from "react";

const styles = `
  /* ══ Row 1: stats + actions ══ */
  .s5-row1 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; align-items: center; }
  @media (max-width: 640px) { .s5-row1 { grid-template-columns: 1fr; } }

  .s5-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
  .s5-stat {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 10px;
    padding: 0.55rem 0.5rem; text-align: center;
    box-shadow: 0 1px 3px rgba(11,45,114,0.05);
  }
  .s5-stat-val { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1rem; line-height: 1; }
  .s5-stat-label { font-size: 0.58rem; color: #6B7FA3; margin-top: 0.15rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .s5-stat-val.accent { color: #0992C2; }
  .s5-stat-val.gold   { color: #B8860B; }
  .s5-stat-val.green  { color: #15803D; }

  .s5-actions-row { display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
  .s5-test-btn {
    padding: 0.42rem 0.9rem; border-radius: 100px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.78rem;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .s5-test-btn.my  { background: #F3F6FA; color: #6B7FA3; border: 1.5px solid #C2D4EC; }
  .s5-test-btn.my:hover { border-color: #0B2D72; color: #0B2D72; background: #EDF1F8; }
  .s5-test-btn.new { background: #0B2D72; color: #ffffff; border: none; box-shadow: 0 4px 12px rgba(11,45,114,0.2); }
  .s5-test-btn.new:hover { background: #0a2360; }
  .s5-test-btn.new:active { transform: scale(0.97); }
  .s5-back-btn {
    padding: 0.42rem 0.9rem; border-radius: 100px;
    background: #ffffff; border: 1.5px solid #C2D4EC; color: #6B7FA3;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.78rem;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
    box-shadow: 0 1px 3px rgba(11,45,114,0.05);
  }
  .s5-back-btn:hover { border-color: #0B2D72; color: #0B2D72; }
  .s5-back-btn:active { transform: scale(0.97); }

  /* ══ Difficulty bar ══ */
  .s5-diff-row { margin-bottom: 1rem; }
  .s5-diff-bar { display: flex; border-radius: 100px; overflow: hidden; height: 6px; background: #D1DCF0; }
  .s5-diff-seg { height: 100%; transition: width 0.4s; }
  .s5-diff-seg.easy   { background: #15803D; }
  .s5-diff-seg.medium { background: #B8860B; }
  .s5-diff-seg.hard   { background: #DC2626; }
  .s5-diff-legend { display: flex; gap: 0.75rem; margin-top: 0.35rem; flex-wrap: wrap; }
  .s5-diff-legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.67rem; color: #6B7FA3; }
  .s5-diff-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }

  /* ══ Main 2-col ══ */
  .s5-main { display: grid; grid-template-columns: minmax(280px, 36%) 1fr; gap: 1rem; }
  @media (max-width: 900px) { .s5-main { grid-template-columns: 1fr; } }

  /* ── Left: question list ── */
  .s5-q-panel {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 14px;
    overflow: hidden; display: flex; flex-direction: column; height: 520px;
    box-shadow: 0 2px 10px rgba(11,45,114,0.07);
  }
  .s5-q-panel-head {
    padding: 0.65rem 0.85rem; border-bottom: 1px solid #C2D4EC; flex-shrink: 0;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.78rem;
    display: flex; align-items: center; justify-content: space-between; color: #0B2D72;
    background: #EDF1F8;
  }
  .s5-q-scroll { overflow-y: auto; flex: 1; padding: 0.4rem; display: flex; flex-direction: column; gap: 0.35rem; }
  .s5-q-scroll::-webkit-scrollbar { width: 7px; }
  .s5-q-scroll::-webkit-scrollbar-track { background: #EDF1F8; border-radius: 4px; }
  .s5-q-scroll::-webkit-scrollbar-thumb { background: #A8BDD8; border-radius: 4px; }
  .s5-q-scroll::-webkit-scrollbar-thumb:hover { background: #6B7FA3; }

  .s5-q-row {
    background: #F7FAFD; border: 1.5px solid #C2D4EC; border-radius: 10px;
    padding: 0.85rem 0.75rem; display: flex; align-items: flex-start; gap: 0.6rem;
    cursor: grab; transition: all 0.12s; font-size: 0.74rem;
  }
  .s5-q-row:hover { border-color: #0B2D72; }
  .s5-q-row.dragging  { opacity: 0.4; border-style: dashed; }
  .s5-q-row.drag-over { border-color: #0992C2; background: rgba(9,146,194,0.06); }
  .s5-drag-handle { color: #6B7FA3; font-size: 0.85rem; flex-shrink: 0; user-select: none; }
  .s5-q-num {
    width: 26px; height: 26px; border-radius: 6px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 0.72rem;
    background: #0B2D72; color: #ffffff; margin-top: 0.1rem;
  }
  .s5-q-info { flex: 1; min-width: 0; }
  .s5-q-title { font-size: 0.82rem; font-weight: 700; color: #0B2D72; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.8rem; }
  .s5-q-tags { display: flex; gap: 0.25rem; margin-top: 0.15rem; }
  .s5-q-tag { font-size: 0.68rem; font-weight: 700; padding: 0.18rem 0.45rem; border-radius: 100px; text-transform: uppercase; }
  .s5-q-tag.obj    { background: rgba(9,146,194,0.1); color: #0992C2;}
  .s5-q-tag.theory { background: #FEF3C7; color: #B8860B; }
  .s5-q-tag.year   { background: #EDF1F8; color: #6B7FA3; border: 1px solid #C2D4EC; }
  .s5-q-tag.easy   { background: #DCFCE7; color: #15803D; }
  .s5-q-tag.medium { background: #FEF3C7; color: #B8860B; }
  .s5-q-tag.hard   { background: #FEE2E2; color: #DC2626; }
  .s5-q-tag.unrated{ background: #EDF1F8; color: #6B7FA3; border: 1px solid #C2D4EC; }

  .s5-marks-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.08rem; flex-shrink: 0; }
  .s5-marks-input {
    width: 40px; background: #ffffff; border: 1.5px solid #C2D4EC; color: #0D1B3E;
    border-radius: 6px; padding: 0.2rem 0.3rem; font-size: 0.78rem; outline: none; text-align: center;
  }
  .s5-marks-input:focus { border-color: #0992C2; }
  .s5-marks-label { font-size: 0.65rem; color: #6B7FA3; font-weight: 600; }

  .s5-remove-btn {
    background: transparent; border: none; color: #6B7FA3;
    width: 20px; height: 20px; cursor: pointer; font-size: 0.7rem;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px; transition: all 0.12s; flex-shrink: 0;
  }
  .s5-remove-btn:hover { background: #FEE2E2; color: #DC2626; }
  .s5-remove-btn:active { transform: scale(0.9); }

  /* ── Right: paper preview ── */
  .s5-preview-panel {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 14px;
    overflow: hidden; display: flex; flex-direction: column; height: 520px;
    box-shadow: 0 2px 10px rgba(11,45,114,0.07);
  }
  .s5-preview-head {
    padding: 0.65rem 0.9rem; border-bottom: 1px solid #C2D4EC; flex-shrink: 0;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.78rem;
    color: #0B2D72; display: flex; align-items: center; justify-content: space-between;
    background: #EDF1F8;
  }
  .s5-preview-scroll { overflow-y: auto; flex: 1; padding: 1rem 1.25rem; }
  .s5-preview-scroll::-webkit-scrollbar { width: 7px; }
  .s5-preview-scroll::-webkit-scrollbar-track { background: #EDF1F8; border-radius: 4px; }
  .s5-preview-scroll::-webkit-scrollbar-thumb { background: #A8BDD8; border-radius: 4px; }
  .s5-preview-scroll::-webkit-scrollbar-thumb:hover { background: #6B7FA3; }

  .s5-paper-q { margin-bottom: 1.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid #D1DCF0; }
  .s5-paper-q:last-child { border-bottom: none; }
  .s5-paper-q-header { display: flex; align-items: flex-start; gap: 0.6rem; margin-bottom: 0.75rem; }
  .s5-paper-q-num { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 0.9rem; color: #0B2D72; flex-shrink: 0; min-width: 28px; }
  .s5-paper-q-content { font-size: 1rem; line-height: 1.75; color: #0D1B3E; flex: 1; }
  .s5-paper-q-img { max-width: 100%; max-height: 220px; border-radius: 6px; margin: 0.5rem 0 0.75rem; border: 1px solid #C2D4EC; display: block; }
  .s5-paper-choices { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; margin-left: 1.6rem; padding: 0; }
  .s5-paper-choice { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.825rem; line-height: 1.5; color: #6B7FA3; }
  .s5-paper-choice-label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.75rem; flex-shrink: 0; color: #6B7FA3; min-width: 20px; }
  .s5-paper-marks { text-align: right; font-size: 0.72rem; color: #B8860B; font-weight: 700; margin-top: 0.6rem; font-family: 'Plus Jakarta Sans', sans-serif; }
  .s5-paper-total { text-align: right; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 0.9rem; color: #0B2D72; padding-top: 0.75rem; border-top: 2px solid #C2D4EC; margin-top: 0.5rem; }

  /* ── Download button spinner ── */
  .s5-dl-spinner {
    display: inline-block; width: 11px; height: 11px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #ffffff; border-radius: 50%;
    animation: s5spin 0.6s linear infinite; flex-shrink: 0;
  }
  .s5-dl-spinner.dark {
    border-color: rgba(11,45,114,0.2); border-top-color: #0B2D72;
  }
  @keyframes s5spin { to { transform: rotate(360deg); } }

  /* ── Mobile export bar (hidden on desktop) ── */
  .s5-mobile-export {
    display: none;
    margin-top: 1.25rem;
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 14px;
    padding: 1rem; box-shadow: 0 2px 10px rgba(11,45,114,0.07);
  }
  @media (max-width: 900px) { .s5-mobile-export { display: block; } }

  .s5-mobile-export-title {
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.78rem;
    color: #0B2D72; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.07em;
  }
  .s5-mobile-export-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .s5-mobile-dl-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.45rem;
    padding: 0.65rem 0.5rem; border-radius: 10px; border: 1.5px solid #C2D4EC;
    background: #F7FAFD; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    font-size: 0.8rem; cursor: pointer; transition: all 0.15s; color: #0D1B3E;
  }
  .s5-mobile-dl-btn:hover:not(:disabled) { border-color: #0B2D72; background: #EDF1F8; color: #0B2D72; }
  .s5-mobile-dl-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .s5-mobile-dl-btn.pdf  { border-color: rgba(9,146,194,0.4); color: #0992C2; background: rgba(9,146,194,0.05); }
  .s5-mobile-dl-btn.pdf:hover:not(:disabled)  { background: rgba(9,146,194,0.1); border-color: #0992C2; }
  .s5-mobile-dl-btn.docx { border-color: rgba(184,134,11,0.4); color: #B8860B; background: rgba(184,134,11,0.05); }
  .s5-mobile-dl-btn.docx:hover:not(:disabled) { background: rgba(184,134,11,0.1); border-color: #B8860B; }
  .s5-mobile-dl-divider { grid-column: 1 / -1; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6B7FA3; margin: 0.35rem 0 0.1rem; }
  .s5-pdf-only-note { grid-column: 1 / -1; font-size: 0.72rem; color: #B8860B; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.35rem; }
`;

/* ── Reusable spinner icon ── */
function Spinner({ dark }) {
  return <span className={`s5-dl-spinner${dark ? ' dark' : ''}`} />;
}

/* ── Download button with built-in spinner ── */
function DlBtn({ fmt, copyType, label, icon, downloading, disabled, onClick, className, style }) {
  const key     = `${fmt}-${copyType}`;
  const loading = downloading === key;
  return (
    <button
      className={className}
      style={style}
      disabled={disabled || !!downloading}
      onClick={() => onClick(fmt, copyType)}
    >
      {loading ? <Spinner /> : <span>{icon}</span>}
      {label}
    </button>
  );
}

export default function Step5Export({
  savedQuestions, testTitle, access,
  onUpdateMarks, onRemove, onReorder,
  onBack, onNewTest, qTypeFilter, onQTypeFilter,
  downloading, onDownload, onOpenMyTests,
}) {
  const [dragIdx, setDragIdx]           = useState(null);
  const [overIdx, setOverIdx]           = useState(null);

  useEffect(() => {
    if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise();
  }, [savedQuestions]);

  const total       = savedQuestions.length;
  const totalMarks  = savedQuestions.reduce((s, q) => s + (q.customMarks ?? q.marks ?? 1), 0);
  const objCount    = savedQuestions.filter(q => q.question_type === 'OBJ').length;
  const theoryCount = total - objCount;
  const isPdfOnly   = access?.pdf_only;

  const diffCounts = { EASY: 0, MEDIUM: 0, HARD: 0, null: 0 };
  savedQuestions.forEach(q => { diffCounts[q.difficulty || 'null']++; });
  const pct = (k) => total > 0 ? (diffCounts[k] / total * 100).toFixed(1) : 0;

  const displayed = qTypeFilter
    ? savedQuestions.filter(q => q.question_type === qTypeFilter)
    : savedQuestions;

  // ── Drag reorder ──────────────────────────────────────────────────────────
  const handleDragStart = (i) => setDragIdx(i);
  const handleDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const handleDrop      = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return; }
    const r = [...savedQuestions];
    const [m] = r.splice(dragIdx, 1);
    r.splice(i, 0, m);
    onReorder(r);
    setDragIdx(null); setOverIdx(null);
  };

  return (
    <>
      <style>{styles}</style>

      {/* ══ Row 1: stats + actions ══ */}
      <div className="s5-row1">
        <div className="s5-stats-row">
          <div className="s5-stat"><div className="s5-stat-val accent">{total}</div><div className="s5-stat-label">Questions</div></div>
          <div className="s5-stat"><div className="s5-stat-val gold">{totalMarks}</div><div className="s5-stat-label">Total Marks</div></div>
          <div className="s5-stat"><div className="s5-stat-val accent">{objCount}</div><div className="s5-stat-label">Objective</div></div>
          <div className="s5-stat"><div className="s5-stat-val green">{theoryCount}</div><div className="s5-stat-label">Theory</div></div>
        </div>
        <div className="s5-actions-row">
          <button className="s5-test-btn my"
            onClick={onOpenMyTests}
            style={onOpenMyTests ? { cursor: 'pointer', opacity: 1 } : {}}>
            📂 My Tests
          </button>
          <button className="s5-test-btn new" onClick={onNewTest}>+ New Test</button>
          <button className="s5-back-btn" onClick={onBack}>← Back to Questions</button>
        </div>
      </div>

      {/* ══ Difficulty bar ══ */}
      {total > 0 && (
        <div className="s5-diff-row">
          <div className="s5-diff-bar">
            <div className="s5-diff-seg easy"   style={{ width: `${pct('EASY')}%` }} />
            <div className="s5-diff-seg medium" style={{ width: `${pct('MEDIUM')}%` }} />
            <div className="s5-diff-seg hard"   style={{ width: `${pct('HARD')}%` }} />
          </div>
          <div className="s5-diff-legend">
            <div className="s5-diff-legend-item"><div className="s5-diff-dot" style={{ background: '#15803D' }} />Easy {diffCounts.EASY}</div>
            <div className="s5-diff-legend-item"><div className="s5-diff-dot" style={{ background: '#B8860B' }} />Medium {diffCounts.MEDIUM}</div>
            <div className="s5-diff-legend-item"><div className="s5-diff-dot" style={{ background: '#DC2626' }} />Hard {diffCounts.HARD}</div>
            {diffCounts.null > 0 && <div className="s5-diff-legend-item"><div className="s5-diff-dot" style={{ background: '#C2D4EC' }} />Unrated {diffCounts.null}</div>}
          </div>
        </div>
      )}

      {/* ══ Main: question list (left) + paper preview (right) ══ */}
      <div className="s5-main">

        {/* ── Left: narrow question list ── */}
        <div className="s5-q-panel">
          <div className="s5-q-panel-head">
            <span>Questions</span>
            <span style={{ fontSize: '0.65rem' }}>{displayed.length} shown</span>
          </div>
          <div className="s5-q-scroll">
            {displayed.length === 0 ? (
              <div style={{ color: '#6B7FA3', padding: '1.5rem', textAlign: 'center', fontSize: '0.78rem' }}>
                {total === 0 ? 'No questions added.' : 'No questions match filter.'}
              </div>
            ) : displayed.map((q, i) => (
              <div key={q.id}
                className={`s5-q-row ${dragIdx === i ? 'dragging' : ''} ${overIdx === i ? 'drag-over' : ''}`}
                draggable onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)} onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              >
                <span className="s5-drag-handle">⠿</span>
                <div className="s5-q-num">{i + 1}</div>
                <div className="s5-q-info">
                  <div className="s5-q-title">{q.topic_names?.length > 0 ? q.topic_names[0] : q.subject_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <span className={`s5-q-tag ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
                      {q.question_type === 'OBJ' ? 'MCQ' : 'Theory'}
                    </span>
                    {q.exam_year && (
                      <span className="s5-q-tag year">
                        {q.sitting ? q.sitting.replace('MAY_JUNE', 'May/Jun').replace('NOV_DEC', 'Nov/Dec').replace('MOCK', 'Mock') + ' · ' : ''}
                        {String(q.exam_year).slice(-2)}
                      </span>
                    )}
                    {q.difficulty
                      ? <span className={`s5-q-tag ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                      : <span className="s5-q-tag unrated">Unrated</span>
                    }
                    <input className="s5-marks-input" type="number" min={1} max={50}
                      value={q.customMarks ?? q.marks ?? 1}
                      onChange={e => onUpdateMarks(q.id, parseInt(e.target.value) || 1)} />
                    <span className="s5-marks-label">marks</span>
                  </div>
                </div>
                <button className="s5-remove-btn" onClick={() => onRemove(q.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: paper-style preview ── */}
        <div className="s5-preview-panel">
          <div className="s5-preview-head">
            <span>📄 Paper Preview — {testTitle || 'Untitled Test'}</span>
            <span style={{ fontSize: '0.65rem' }}>{total} question{total !== 1 ? 's' : ''} · {totalMarks} marks</span>
          </div>
          <div className="s5-preview-scroll">
            {savedQuestions.length === 0 ? (
              <div style={{ color: '#6B7FA3', padding: '2rem', textAlign: 'center', fontSize: '0.82rem' }}>
                Add questions to see the paper preview.
              </div>
            ) : (
              <>
                {savedQuestions.map((q, i) => (
                  <div key={q.id} className="s5-paper-q">
                    <div className="s5-paper-q-header">
                      <span className="s5-paper-q-num">{i + 1}.</span>
                      <div className="s5-paper-q-content" dangerouslySetInnerHTML={{ __html: q.content }} />
                    </div>
                    {q.image && <img src={q.image} alt="" className="s5-paper-q-img" />}
                    {q.question_type === 'OBJ' && q.choices?.length > 0 && (
                      <ul className="s5-paper-choices">
                        {q.choices.map(c => (
                          <li key={c.id} className="s5-paper-choice">
                            <span className="s5-paper-choice-label">{c.label}.</span>
                            <span dangerouslySetInnerHTML={{ __html: c.choice_text }} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.question_type === 'THEORY' && (
                      <div className="s5-paper-marks">[{q.customMarks ?? q.marks ?? 1} mark{(q.customMarks ?? q.marks ?? 1) !== 1 ? 's' : ''}]</div>
                    )}
                    {q.question_type === 'OBJ' && (
                      <div className="s5-paper-marks" style={{ color: '#6B7FA3' }}>[{q.customMarks ?? q.marks ?? 1} mark{(q.customMarks ?? q.marks ?? 1) !== 1 ? 's' : ''}]</div>
                    )}
                  </div>
                ))}
                <div className="s5-paper-total">Total: {totalMarks} mark{totalMarks !== 1 ? 's' : ''}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ Mobile export bar (below preview on small screens) ══ */}
      <div className="s5-mobile-export">
        <div className="s5-mobile-export-title">Export</div>
        <div className="s5-mobile-export-grid">

          <div className="s5-mobile-dl-divider">📄 PDF</div>
          <DlBtn fmt="pdf" copyType="student" label="Questions only" icon="📄"
            className="s5-mobile-dl-btn pdf" downloading={downloading}
            disabled={total === 0} onClick={onDownload} />
          <DlBtn fmt="pdf" copyType="teacher" label="Mark scheme" icon="📄"
            className="s5-mobile-dl-btn pdf" downloading={downloading}
            disabled={total === 0} onClick={onDownload} />

          {!isPdfOnly && (
            <>
              <div className="s5-mobile-dl-divider">📝 Word</div>
              <DlBtn fmt="docx" copyType="student" label="Questions only" icon="📝"
                className="s5-mobile-dl-btn docx" downloading={downloading}
                disabled={total === 0} onClick={onDownload} />
              <DlBtn fmt="docx" copyType="teacher" label="Mark scheme" icon="📝"
                className="s5-mobile-dl-btn docx" downloading={downloading}
                disabled={total === 0} onClick={onDownload} />
            </>
          )}

          {isPdfOnly && (
            <div className="s5-pdf-only-note">
              🏷️ PDF only on free tier — <a href="/pricing/?tab=teacher" style={{ color: '#0992C2', fontWeight: 700 }}>Upgrade for Word</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}