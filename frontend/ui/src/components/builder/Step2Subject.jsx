import { useState, useEffect } from "react";
import api from "../../api";

const styles = `
  .subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.85rem; }
  .subject-card {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 14px;
    padding: 1.1rem 1.1rem; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 0.75rem;
    box-shadow: 0 1px 4px rgba(11,45,114,0.06);
  }
  .subject-card:hover { border-color: #0B2D72; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(11,45,114,0.1); }
  .subject-card:active { transform: scale(0.97); }
  .subject-card.selected { border-color: #0B2D72; background: rgba(11,45,114,0.05); border-left: 4px solid #0B2D72; }

  /* Muted — no questions */
  .subject-card.muted {
    opacity: 0.45; cursor: not-allowed;
    background: #F3F6FA; border-color: #E2EAF4;
    box-shadow: none;
  }
  .subject-card.muted:hover { border-color: #E2EAF4; transform: none; box-shadow: none; }

  .subject-icon { font-size: 1.4rem; flex-shrink: 0; }
  .subject-name { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.9rem; color: #0B2D72; }
  .subject-no-q { font-size: 0.68rem; color: #6B7FA3; margin-top: 0.15rem; font-style: italic; }
`;

const SUBJECT_ICONS = {
  'Biology':'🧬','Chemistry':'⚗️','Physics':'⚡','Mathematics':'📐',
  'English':'📝','Economics':'📊','Geography':'🌍','History':'📜',
  'Government':'🏛️','Literature':'📚','Commerce':'💼','Accounting':'🧾',
  'Agriculture':'🌾','Further Mathematics':'∞',
};

export default function Step2Subject({ board, onSelect, selected, onBack }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
  api.get('subjects/')
    .then(r => setSubjects(r.data.filter(s => (s.question_count ?? 0) > 0)))
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  if (loading) return <div style={{ color: '#6B7FA3', padding: '2rem' }}>Loading subjects…</div>;

  return (
    <>
      <style>{styles}</style>
      <button className="btn-back-sm" onClick={onBack}>← Back</button>
      <div className="step-section-title">Select Subject</div>
      <div className="step-section-sub">
        Building for <strong style={{color:'#0992C2'}}>{board?.abbreviation}</strong>.
        Choose the subject for this test.
      </div>
      <div className="subject-grid">
        {subjects.map(s => {
          const hasQuestions = (s.question_count ?? 1) > 0;
          return (
            <div key={s.id}
              className={`subject-card ${selected?.id === s.id ? 'selected' : ''} ${!hasQuestions ? 'muted' : ''}`}
              onClick={() => hasQuestions && onSelect(s)}>
              <span className="subject-icon">{SUBJECT_ICONS[s.name] || '📖'}</span>
              <div>
                <div className="subject-name">{s.name}</div>
                {!hasQuestions && <div className="subject-no-q">No questions yet</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}