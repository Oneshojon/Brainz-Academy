import { Outlet, Link } from 'react-router-dom';

const styles = `
  @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap");

  .lp-shell * { box-sizing: border-box; }
  .lp-shell { min-height: 100vh; display: flex; flex-direction: column; background: #E8EDF5; color: #0D1B3E; font-family: 'Inter', sans-serif; }

  .lp-topbar {
    position: sticky; top: 0; z-index: 50;
    background: #0B2D72;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 0 2rem; height: 62px;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .lp-logo { display: flex; align-items: center; }
  .lp-topbar-right { display: flex; align-items: center; gap: 0.6rem; }
  .lp-btn-back {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.9); border-radius: 100px; padding: 0.38rem 0.9rem;
    text-decoration: none; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.82rem; font-weight: 600; transition: all 0.15s;
  }
  .lp-btn-back:hover { background: rgba(255,255,255,0.2); }

  .lp-main { flex: 1; padding: 2rem; max-width: 900px; margin: 0 auto; width: 100%; }

  .lp-page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .lp-page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.4rem; color: #0B2D72; letter-spacing: -0.5px; }
  .lp-page-subtitle { font-size: 0.85rem; color: #6B7FA3; margin-top: 0.25rem; }

  .lp-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.85rem;
    border-radius: 10px; padding: 0.65rem 1.1rem; cursor: pointer; border: none;
    text-decoration: none; transition: all 0.15s;
  }
  .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lp-btn-primary { background: #0B2D72; color: #ffffff; }
  .lp-btn-primary:hover:not(:disabled) { background: #0a2560; }
  .lp-btn-ghost { background: #ffffff; border: 1.5px solid #C2D4EC; color: #0B2D72; }
  .lp-btn-danger { background: #DC2626; color: #ffffff; }
  .lp-btn-danger-ghost { background: #ffffff; border: 1.5px solid #FCA5A5; color: #DC2626; }
  .lp-btn-block { width: 100%; }

  .lp-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; padding: 0; margin: 0; }
  .lp-list-item {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 14px;
    padding: 1rem 1.25rem; text-decoration: none; color: inherit; transition: all 0.15s;
  }
  .lp-list-item:hover { border-color: #0B2D72; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(11,45,114,0.08); }
  .lp-list-item-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.95rem; color: #0B2D72; }
  .lp-list-item-meta { font-size: 0.78rem; color: #6B7FA3; margin-top: 0.2rem; }
  .lp-badge { font-size: 0.68rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
  .lp-badge-generated { background: #DCFCE7; color: #15803D; border: 1px solid rgba(21,128,61,0.2); }
  .lp-badge-draft { background: #FEF3C7; color: #92400E; border: 1px solid rgba(146,64,14,0.2); }

  .lp-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.6rem; padding: 4rem 2rem; background: #ffffff; border: 1px solid #C2D4EC; border-radius: 16px; }
  .lp-empty-icon { font-size: 2.5rem; }
  .lp-empty-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; color: #0D1B3E; }
  .lp-empty-desc { font-size: 0.85rem; color: #6B7FA3; max-width: 420px; }

  .lp-form { display: flex; flex-direction: column; gap: 1.1rem; background: #ffffff; border: 1px solid #C2D4EC; border-radius: 16px; padding: 1.75rem; }
  .lp-field { display: flex; flex-direction: column; gap: 0.4rem; }
  .lp-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  .lp-label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.82rem; color: #0D1B3E; }
  .lp-input {
    font-family: 'Inter', sans-serif; font-size: 0.9rem; padding: 0.65rem 0.8rem;
    border: 1.5px solid #C2D4EC; border-radius: 10px; background: #ffffff; color: #0D1B3E;
  }
  .lp-input:focus { outline: none; border-color: #0B2D72; }
  .lp-textarea { resize: vertical; font-family: inherit; }
  .lp-field-error { font-size: 0.78rem; color: #DC2626; }
  .lp-inline-hint { font-size: 0.82rem; color: #6B7FA3; }
  .lp-inline-hint-error { color: #DC2626; }

  .lp-loading { padding: 3rem; text-align: center; color: #6B7FA3; }
  .lp-error-banner {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B;
    border-radius: 12px; padding: 0.9rem 1.1rem; font-size: 0.85rem; margin-bottom: 1rem;
  }
  .lp-error-upsell { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; }

  .lp-confirm-banner {
    background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B;
    border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: 1rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  }
  .lp-confirm-actions { display: flex; gap: 0.6rem; }

  .lp-card { background: #ffffff; border: 1px solid #C2D4EC; border-radius: 14px; padding: 1.25rem 1.4rem; }
  .lp-input-summary { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .lp-input-summary-label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6B7FA3; margin-top: 0.5rem; }

  .lp-generate-panel { display: flex; flex-direction: column; gap: 0.75rem; }

  .lp-sections { display: flex; flex-direction: column; gap: 1rem; }
  .lp-section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.9rem; color: #0B2D72; margin-bottom: 0.5rem; }
  .lp-section-body { font-size: 0.88rem; line-height: 1.65; white-space: pre-wrap; }

  .lp-spinner {
    width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #ffffff;
    border-radius: 50%; display: inline-block; animation: lp-spin 0.7s linear infinite;
  }
  .lp-btn-ghost .lp-spinner, .lp-btn-danger-ghost .lp-spinner { border-color: rgba(11,45,114,0.3); border-top-color: #0B2D72; }
  @keyframes lp-spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .lp-main { padding: 1.25rem; }
    .lp-field-row { grid-template-columns: 1fr; }
    .lp-topbar { padding: 0 1rem; }
  }

  .lp-download-row { display: flex; gap: 0.6rem; margin-bottom: 1rem; flex-wrap: wrap; }

  /* Rendered markdown inside section cards */
  .lp-section-body h1, .lp-section-body h2, .lp-section-body h3 {
    font-family: 'Plus Jakarta Sans', sans-serif; color: #0B2D72; margin: 1rem 0 0.5rem;
  }
  .lp-section-body h1:first-child, .lp-section-body h2:first-child, .lp-section-body h3:first-child { margin-top: 0; }
  .lp-section-body p { margin: 0.5rem 0; }
  .lp-section-body ul, .lp-section-body ol { margin: 0.5rem 0; padding-left: 1.4rem; }
  .lp-section-body li { margin: 0.25rem 0; }
  .lp-section-body strong { color: #0D1B3E; }
  .lp-section-body hr { border: none; border-top: 1px solid #C2D4EC; margin: 1rem 0; }
  .lp-section-body table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; font-size: 0.85rem; }
  .lp-section-body th, .lp-section-body td { border: 1.5px solid #C2D4EC; padding: 0.45rem 0.7rem; text-align: left; }
  .lp-section-body th { background: #EDF1F8; font-weight: 700; color: #0B2D72; }
  .lp-section-body tr:nth-child(even) { background: #F7FAFD; }
`;

/**
 * Shared shell for every /tools/lesson-plans/* page — topbar + page
 * container. Self-contained styling (see module comment in the handoff
 * chat) since App.jsx's own <style> tag isn't present on this route tree.
 */
export default function LessonPlansLayout() {
  return (
    <>
      <style>{styles}</style>
      <div className="lp-shell">
        <header className="lp-topbar">
          <Link to="/" className="lp-logo">
            <img
              src="/static/Users/images/brainz_logo.png"
              alt="Brainz Academy"
              style={{ height: '36px', width: 'auto' }}
            />
          </Link>
          <div className="lp-topbar-right">
            <Link to="/" className="lp-btn-back">← Test Builder</Link>
            <a href="/teacher/" className="lp-btn-back">← Dashboard</a>
          </div>
        </header>
        <main className="lp-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}