import { useState, useEffect } from "react";
import api from "../../api";

const styles = `
  .board-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  .board-card {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 16px;
    padding: 2rem 1.5rem;
    cursor: pointer; transition: all 0.2s; text-align: center;
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

  /* ── Access banners (shared pattern with QuestionGeneratorForm) ── */
  .s1-access-banner {
    display: flex; align-items: flex-start; gap: 0.6rem;
    padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1.25rem;
    font-size: 0.8rem; line-height: 1.5;
  }
  .s1-access-banner.free {
    background: rgba(245,200,66,0.07);
    border: 1px solid rgba(245,200,66,0.25);
    color: #92740a;
  }
  .s1-access-banner.free strong { color: #b8860b; }

  .s1-blocked-banner {
    background: linear-gradient(120deg, rgba(245,200,66,0.08), rgba(156,213,255,0.06));
    border: 1px solid rgba(245,200,66,0.3);
    border-radius: 12px;
    padding: 1rem 1.1rem;
    margin-bottom: 1.5rem;
  }
  .s1-blocked-inner {
    display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.75rem;
  }
  .s1-blocked-title {
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    font-size: 0.88rem; color: #b8860b; margin-bottom: 0.15rem;
  }
  .s1-blocked-reason {
    font-size: 0.78rem; color: #6B7FA3; line-height: 1.5;
  }
  .s1-upgrade-btn {
    display: block; width: 100%; padding: 0.6rem;
    background: #b8860b; color: #ffffff; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    font-size: 0.85rem; text-decoration: none; text-align: center;
    box-sizing: border-box; transition: background 0.15s;
  }
  .s1-upgrade-btn:hover { background: #a07608; }

  .s1-boards-blocked {
    opacity: 0.4; pointer-events: none; user-select: none;
  }
`;

const WAEC_NECO_MIX = { id: 'mix', name: 'WAEC & NECO Combined', abbreviation: 'WAEC+NECO' };

export default function Step1Board({ onSelect, selected, access }) {
  const [boards, setBoards]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('exam-boards/').then(r => setBoards(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const isFree    = access?.is_free ?? true;
  const isBlocked = access ? !access.allowed : false;
  const maxQ      = access?.max_questions ?? 15;

  if (loading) return <div style={{ color: '#6B7FA3', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>Loading exam boards…</div>;

  return (
    <>
      <style>{styles}</style>

      <div className="step-section-title">Select Exam Board</div>
      <div className="step-section-sub">Choose the exam body for the questions in this test.</div>

      {/* ── Free tier banner ── */}
      {access && isFree && !isBlocked && (
        <div className="s1-access-banner free">
          <span>🏷️</span>
          <div style={{ flex: 1 }}>
            <strong>
              {access.trials_remaining} free trial{access.trials_remaining !== 1 ? 's' : ''} remaining.
            </strong>{' '}
            Up to {maxQ} questions per trial · PDF download only.
          </div>
          <a
            href="/pricing/?tab=teacher"
            style={{
              display: 'inline-block', padding: '0.35rem 0.8rem',
              background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.35)',
              borderRadius: '7px', color: '#b8860b', fontWeight: 700,
              fontSize: '0.75rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Upgrade →
          </a>
        </div>
      )}

      {/* ── Blocked banner ── */}
      {access && isBlocked && (
        <div className="s1-blocked-banner">
          <div className="s1-blocked-inner">
            <span style={{ fontSize: '1.1rem' }}>🔒</span>
            <div>
              <div className="s1-blocked-title">Free Trials Exhausted</div>
              <div className="s1-blocked-reason">
                {access.reason || "You've used both free test builder trials."}
              </div>
            </div>
          </div>
          <a href="/pricing/?tab=teacher" className="s1-upgrade-btn">
            Upgrade to Teacher Pro →
          </a>
        </div>
      )}

      {/* Board grid — dimmed and non-interactive when blocked */}
      <div className={`board-grid ${isBlocked ? 's1-boards-blocked' : ''}`}>
        {[...boards, WAEC_NECO_MIX].map(b => (
          <div key={b.id}
            className={`board-card ${b.id === 'mix' ? 'waec-neco-card' : ''} ${selected?.id === b.id ? 'selected' : ''}`}
            onClick={() => !isBlocked && onSelect(b)}>
            <div className="board-card-abbr">{b.abbreviation}</div>
            <div className="board-card-name">{b.name}</div>
          </div>
        ))}
      </div>
    </>
  );
}