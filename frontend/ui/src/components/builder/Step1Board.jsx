import { useState, useEffect } from "react";
import api from "../../api";

const styles = `
  .step-section-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem;
    margin-bottom: 0.4rem;
  }
  .step-section-sub { font-size: 0.82rem; color: var(--muted); margin-bottom: 1.5rem; line-height: 1.6; }

  .board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
  .board-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 14px;
    padding: 1.5rem 1.25rem; cursor: pointer; transition: all 0.2s; text-align: center;
  }
  .board-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
  .board-card.selected { border-color: var(--accent); background: var(--accent-dim); }
  .board-card-abbr {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.6rem;
    color: var(--accent); margin-bottom: 0.4rem;
  }
  .board-card.selected .board-card-abbr { color: var(--text); }
  .board-card-name { font-size: 0.78rem; color: var(--muted); }

  .waec-neco-card { background: linear-gradient(135deg, var(--card), rgba(156,213,255,0.05)); }
  .waec-neco-card .board-card-abbr { font-size: 1.1rem; }
`;

const WAEC_NECO_MIX = { id: 'mix', name: 'WAEC & NECO Combined', abbreviation: 'WAEC+NECO' };

export default function Step1Board({ onSelect, selected }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('exam-boards/').then(r => {
      setBoards(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading exam boards…</div>;

  const allBoards = [...boards, WAEC_NECO_MIX];

  return (
    <>
      <style>{styles}</style>
      <div className="step-section-title">Select Exam Board</div>
      <div className="step-section-sub">Choose the exam body for the questions in this test.</div>
      <div className="board-grid">
        {allBoards.map(b => (
          <div
            key={b.id}
            className={`board-card ${b.id === 'mix' ? 'waec-neco-card' : ''} ${selected?.id === b.id ? 'selected' : ''}`}
            onClick={() => onSelect(b)}
          >
            <div className="board-card-abbr">{b.abbreviation}</div>
            <div className="board-card-name">{b.name}</div>
          </div>
        ))}
      </div>
    </>
  );
}