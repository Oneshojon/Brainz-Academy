import { useState, useRef } from "react";
import api from "../../api";

const styles = `
  .s5-layout { display: grid; grid-template-columns: 420px 1fr; gap: 1.5rem; align-items: start; }
  @media (max-width: 900px) { .s5-layout { grid-template-columns: 1fr; } }

  /* ── Summary bar ── */
  .s5-summary {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.75rem;
  }
  .s5-stat {
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 1rem; text-align: center;
  }
  .s5-stat-val { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.5rem; }
  .s5-stat-label { font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem; }
  .s5-stat-val.accent { color: var(--accent); }
  .s5-stat-val.gold   { color: var(--gold); }
  .s5-stat-val.green  { color: var(--green); }

  /* ── Difficulty bar ── */
  .diff-bar-wrap { margin-bottom: 1.75rem; }
  .diff-bar-label { font-size: 0.78rem; color: var(--muted); margin-bottom: 0.5rem; }
  .diff-bar { display: flex; border-radius: 100px; overflow: hidden; height: 8px; }
  .diff-bar-seg { height: 100%; transition: width 0.4s ease; }
  .diff-bar-seg.easy   { background: var(--green); }
  .diff-bar-seg.medium { background: var(--gold); }
  .diff-bar-seg.hard   { background: var(--red); }
  .diff-bar-seg.none   { background: var(--base); }
  .diff-legend { display: flex; gap: 1rem; margin-top: 0.4rem; }
  .diff-legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: var(--muted); }
  .diff-dot { width: 8px; height: 8px; border-radius: 2px; }

  /* ── Question list (draggable) ── */
  .s5-q-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .s5-q-row {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 0.75rem 0.9rem; display: flex; align-items: center; gap: 0.75rem;
    transition: all 0.15s;
  }
  .s5-q-row.dragging { opacity: 0.5; border-style: dashed; }
  .s5-q-row.drag-over { border-color: var(--accent); transform: translateY(-2px); }
  .s5-drag-handle {
    color: var(--muted); cursor: grab; font-size: 1rem; flex-shrink: 0; user-select: none;
  }
  .s5-drag-handle:active { cursor: grabbing; }
  .s5-q-num {
    width: 26px; height: 26px; border-radius: 6px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.72rem;
    background: var(--deep); border: 1px solid var(--border); color: var(--muted-light);
  }
  .s5-q-info { flex: 1; min-width: 0; }
  .s5-q-title { font-size: 0.78rem; font-weight: 600; color: var(--muted-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.2rem; }
  .s5-marks-input {
    width: 52px; background: var(--deep); border: 1px solid var(--border); color: var(--text);
    border-radius: 6px; padding: 0.25rem 0.4rem; font-size: 0.8rem; outline: none;
    text-align: center; transition: border-color 0.15s;
  }
  .s5-marks-input:focus { border-color: rgba(156,213,255,0.4); }
  .s5-marks-label { font-size: 0.68rem; color: var(--muted); }
  .s5-remove-btn {
    background: transparent; border: 1px solid var(--border); color: var(--muted);
    border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-size: 0.85rem;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
    flex-shrink: 0;
  }
  .s5-remove-btn:hover { background: var(--red-dim); color: var(--red); border-color: rgba(248,113,113,0.3); }

  /* ── Export panel ── */
  .s5-export-panel { position: sticky; top: 80px; }
  .s5-export-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 14px;
    padding: 1.5rem; margin-bottom: 1rem;
  }
  .s5-export-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; margin-bottom: 1rem; }
  .s5-export-btns { display: flex; flex-direction: column; gap: 0.6rem; }
  .s5-export-btn {
    width: 100%; padding: 0.75rem; border-radius: 10px; border: none;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.875rem;
    cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .s5-export-btn.primary { background: var(--accent); color: var(--black); }
  .s5-export-btn.primary:hover { background: #c2e8ff; }
  .s5-export-btn.secondary { background: var(--deep); color: var(--text); border: 1px solid var(--border); }
  .s5-export-btn.secondary:hover { border-color: var(--border-hover); }
  .s5-export-btn.gold-btn { background: var(--gold); color: var(--black); }
  .s5-export-btn.gold-btn:hover { background: #f7d96a; }
  .s5-export-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .s5-export-divider { font-size: 0.7rem; color: var(--muted); text-align: center; margin: 0.25rem 0; }
  .pdf-only-note { font-size: 0.72rem; color: var(--muted); text-align: center; margin-top: 0.5rem; line-height: 1.5; }

  .s5-loading { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(14,31,44,0.3); border-top-color: var(--black); border-radius: 50%; animation: spin 0.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) { .s5-summary { grid-template-columns: 1fr 1fr; } }
`;

export default function Step5Export({ savedQuestions, testTitle, access, onUpdateMarks, onRemove, onReorder, onBack }) {
  const [downloading, setDownloading] = useState(null); // 'pdf-student'|'pdf-teacher'|'docx-student'|'docx-teacher'
  const [dragIdx, setDragIdx]   = useState(null);
  const [overIdx, setOverIdx]   = useState(null);

  const total      = savedQuestions.length;
  const totalMarks = savedQuestions.reduce((s, q) => s + (q.customMarks ?? q.marks ?? 1), 0);
  const objCount   = savedQuestions.filter(q => q.question_type === 'OBJ').length;
  const theoryCount = total - objCount;

  // Difficulty breakdown
  const diffCounts = { EASY: 0, MEDIUM: 0, HARD: 0, null: 0 };
  savedQuestions.forEach(q => { diffCounts[q.difficulty || 'null']++; });
  const pct = (k) => total > 0 ? (diffCounts[k] / total * 100).toFixed(1) : 0;

  // ── Drag-to-reorder ──────────────────────────────────────────────────────
  const handleDragStart = (i) => setDragIdx(i);
  const handleDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const handleDrop      = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return; }
    const reordered = [...savedQuestions];
    const [moved]   = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    onReorder(reordered);
    setDragIdx(null); setOverIdx(null);
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const download = async (fmt, copyType) => {
    const key = `${fmt}-${copyType}`;
    setDownloading(key);
    try {
      const res = await api.post('questions/download/', {
        question_ids: savedQuestions.map(q => q.id),
        title:        testTitle,
        format:       fmt,
        copy_type:    copyType,
      }, { responseType: 'blob' });

      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `${testTitle.replace(/\s+/g,'_')}_${copyType}.${fmt}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const isPdfOnly = access?.pdf_only;
  const isLoading = (key) => downloading === key;
  const anyLoading = !!downloading;

  return (
    <>
      <style>{styles}</style>
      <button className="btn-back-sm" onClick={onBack}>← Back</button>

      {/* Summary stats */}
      <div className="s5-summary">
        <div className="s5-stat"><div className="s5-stat-val accent">{total}</div><div className="s5-stat-label">Questions</div></div>
        <div className="s5-stat"><div className="s5-stat-val gold">{totalMarks}</div><div className="s5-stat-label">Total Marks</div></div>
        <div className="s5-stat"><div className="s5-stat-val accent">{objCount}</div><div className="s5-stat-label">Objective</div></div>
        <div className="s5-stat"><div className="s5-stat-val green">{theoryCount}</div><div className="s5-stat-label">Theory</div></div>
      </div>

      {/* Difficulty bar */}
      {total > 0 && (
        <div className="diff-bar-wrap">
          <div className="diff-bar-label">Difficulty breakdown</div>
          <div className="diff-bar">
            <div className="diff-bar-seg easy"   style={{width:`${pct('EASY')}%`}} />
            <div className="diff-bar-seg medium" style={{width:`${pct('MEDIUM')}%`}} />
            <div className="diff-bar-seg hard"   style={{width:`${pct('HARD')}%`}} />
            <div className="diff-bar-seg none"   style={{width:`${pct('null')}%`}} />
          </div>
          <div className="diff-legend">
            <div className="diff-legend-item"><div className="diff-dot" style={{background:'var(--green)'}} /> Easy {diffCounts.EASY}</div>
            <div className="diff-legend-item"><div className="diff-dot" style={{background:'var(--gold)'}} /> Medium {diffCounts.MEDIUM}</div>
            <div className="diff-legend-item"><div className="diff-dot" style={{background:'var(--red)'}} /> Hard {diffCounts.HARD}</div>
            {diffCounts.null > 0 && <div className="diff-legend-item"><div className="diff-dot" style={{background:'var(--base)'}} /> Unrated {diffCounts.null}</div>}
          </div>
        </div>
      )}

      <div className="s5-layout">
        {/* ── Left: question list with drag reorder ── */}
        <div>
          <div className="q4-list-title" style={{marginBottom:'0.75rem'}}>Question Order <span style={{color:'var(--muted)', fontWeight:400, fontSize:'0.72rem'}}>(drag to reorder)</span></div>
          {savedQuestions.length === 0 ? (
            <div style={{color:'var(--muted)', padding:'2rem', textAlign:'center', fontSize:'0.85rem'}}>No questions added yet.</div>
          ) : (
            <div className="s5-q-list">
              {savedQuestions.map((q, i) => (
                <div
                  key={q.id}
                  className={`s5-q-row ${dragIdx === i ? 'dragging' : ''} ${overIdx === i ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                >
                  <span className="s5-drag-handle">⠿</span>
                  <div className="s5-q-num">{i + 1}</div>
                  <div className="s5-q-info">
                    <div className="s5-q-title">
                      Q{q.question_number} · {q.subject_name} · {q.exam_year ?? '—'}
                    </div>
                    <div className="q4-row-tags">
                      <span className={`q4-tag ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
                        {q.question_type === 'OBJ' ? 'OBJ' : 'Theory'}
                      </span>
                      {q.difficulty && <span className={`q4-tag ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>}
                    </div>
                  </div>
                  {/* Marks editor (especially useful for theory) */}
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'0.15rem'}}>
                    <input
                      className="s5-marks-input"
                      type="number" min={1} max={50}
                      value={q.customMarks ?? q.marks ?? 1}
                      onChange={e => onUpdateMarks(q.id, parseInt(e.target.value) || 1)}
                    />
                    <span className="s5-marks-label">marks</span>
                  </div>
                  <button className="s5-remove-btn" onClick={() => onRemove(q.id)} title="Remove">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: export options ── */}
        <div className="s5-export-panel">
          <div className="s5-export-card">
            <div className="s5-export-title">📄 Student Copy</div>
            <div className="s5-export-btns">
              <button className="s5-export-btn primary" disabled={total === 0 || anyLoading} onClick={() => download('pdf', 'student')}>
                {isLoading('pdf-student') ? <><div className="s5-loading" /> Generating…</> : '⬇ Download PDF'}
              </button>
              {!isPdfOnly && (
                <button className="s5-export-btn secondary" disabled={total === 0 || anyLoading} onClick={() => download('docx', 'student')}>
                  {isLoading('docx-student') ? <><div className="s5-loading" /> Generating…</> : '⬇ Download Word (.docx)'}
                </button>
              )}
              {isPdfOnly && <div className="pdf-only-note">Upgrade to Teacher Pro to unlock Word downloads.</div>}
            </div>
          </div>

          <div className="s5-export-card">
            <div className="s5-export-title">🔑 Teacher Copy <span style={{fontSize:'0.7rem', color:'var(--muted)'}}>with answers & topics</span></div>
            <div className="s5-export-btns">
              <button className="s5-export-btn gold-btn" disabled={total === 0 || anyLoading} onClick={() => download('pdf', 'teacher')}>
                {isLoading('pdf-teacher') ? <><div className="s5-loading" /> Generating…</> : '⬇ Download PDF (with answers)'}
              </button>
              {!isPdfOnly && (
                <button className="s5-export-btn secondary" disabled={total === 0 || anyLoading} onClick={() => download('docx', 'teacher')}>
                  {isLoading('docx-teacher') ? <><div className="s5-loading" /> Generating…</> : '⬇ Download Word (with answers)'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}