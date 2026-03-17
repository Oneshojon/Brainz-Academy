import { useState, useEffect } from "react";
import api from "../../api";

const styles = `
  .subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
  .subject-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 14px;
    padding: 1.25rem 1.1rem; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 0.75rem;
  }
  .subject-card:hover { border-color: var(--border-hover); transform: translateY(-1px); }
  .subject-card.selected { border-color: var(--accent); background: var(--accent-dim); }
  .subject-icon { font-size: 1.4rem; flex-shrink: 0; }
  .subject-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; }

  .btn-back-sm {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: transparent; border: 1px solid var(--border); color: var(--muted);
    border-radius: 7px; padding: 0.35rem 0.8rem; font-size: 0.8rem;
    cursor: pointer; transition: all 0.15s; margin-bottom: 1.25rem;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-back-sm:hover { color: var(--text); border-color: var(--border-hover); }
`;

const SUBJECT_ICONS = {
  'Biology': '🧬', 'Chemistry': '⚗️', 'Physics': '⚡',
  'Mathematics': '📐', 'English': '📝', 'Economics': '📊',
  'Geography': '🌍', 'History': '📜', 'Government': '🏛️',
  'Literature': '📚', 'Commerce': '💼', 'Accounting': '🧾',
  'Agriculture': '🌾', 'Further Mathematics': '∞',
};

export default function Step2Subject({ board, onSelect, selected, onBack }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('subjects/').then(r => setSubjects(r.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading subjects…</div>;

  return (
    <>
      <style>{styles}</style>
      <button className="btn-back-sm" onClick={onBack}>← Back</button>
      <div className="step-section-title">Select Subject</div>
      <div className="step-section-sub">
        Building for <strong style={{color:'var(--accent)'}}>{board?.abbreviation}</strong>.
        Choose the subject for this test.
      </div>
      <div className="subject-grid">
        {subjects.map(s => (
          <div
            key={s.id}
            className={`subject-card ${selected?.id === s.id ? 'selected' : ''}`}
            onClick={() => onSelect(s)}
          >
            <span className="subject-icon">{SUBJECT_ICONS[s.name] || '📖'}</span>
            <span className="subject-name">{s.name}</span>
          </div>
        ))}
      </div>
    </>
  );
}