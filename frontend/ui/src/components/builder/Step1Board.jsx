import { useState, useEffect } from "react";
import api from "../../api";

const styles = `
  .board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
  .board-card {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 16px;
    padding: 1.75rem 1.25rem; cursor: pointer; transition: all 0.2s; text-align: center;
    box-shadow: 0 1px 4px rgba(11,45,114,0.06);
  }
  .board-card:hover { border-color: #0B2D72; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(11,45,114,0.12); }
  .board-card:active { transform: scale(0.97); }
  .board-card.selected { border-color: #0B2D72; background: rgba(11,45,114,0.05); border-left: 4px solid #0B2D72; }
  .board-card-abbr {
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.7rem;
    color: #0992C2; margin-bottom: 0.4rem; letter-spacing: -0.5px;
  }
  .board-card.selected .board-card-abbr { color: #0B2D72; }
  .board-card-name { font-size: 0.78rem; color: #6B7FA3; line-height: 1.4; }
  .waec-neco-card .board-card-abbr { font-size: 1.1rem; }
`;

const WAEC_NECO_MIX = { id: 'mix', name: 'WAEC & NECO Combined', abbreviation: 'WAEC+NECO' };

export default function Step1Board({ onSelect, selected }) {
  const [boards, setBoards]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('exam-boards/').then(r => setBoards(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#6B7FA3', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>Loading exam boards…</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="step-section-title">Select Exam Board</div>
      <div className="step-section-sub">Choose the exam body for the questions in this test.</div>
      <div className="board-grid">
        {[...boards, WAEC_NECO_MIX].map(b => (
          <div key={b.id}
            className={`board-card ${b.id === 'mix' ? 'waec-neco-card' : ''} ${selected?.id === b.id ? 'selected' : ''}`}
            onClick={() => onSelect(b)}>
            <div className="board-card-abbr">{b.abbreviation}</div>
            <div className="board-card-name">{b.name}</div>
          </div>
        ))}
      </div>
    </>
  );
}