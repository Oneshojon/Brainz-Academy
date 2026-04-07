import { useState, useEffect, useRef } from "react";
import api from "../../api";

const styles = `
  .theme-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; align-items: start; }
  @media (max-width: 720px) { .theme-layout { grid-template-columns: 1fr; } }

  .theme-panel-label {
    font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em;
    color: #6B7FA3; margin-bottom: 0.65rem;
  }

  .theme-list { display: flex; flex-direction: column; gap: 0.4rem; }

  /* ── Desktop theme item ── */
  .theme-item {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 10px;
    padding: 0.8rem 1rem; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 1px 3px rgba(11,45,114,0.05);
    gap: 0.5rem;
  }
  .theme-item:hover { border-color: #0B2D72; background: #F7FAFD; }
  .theme-item:active { transform: scale(0.99); }
  .theme-item.selected { border-color: #0B2D72; background: rgba(11,45,114,0.05); border-left: 4px solid #0B2D72; }
  .theme-item-name { font-size: 0.875rem; font-weight: 600; color: #0B2D72; flex: 1; min-width: 0; }
  .theme-item-count {
    font-size: 0.7rem; color: #6B7FA3; background: #EDF1F8;
    border: 1px solid #C2D4EC; padding: 0.12rem 0.5rem; border-radius: 100px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600;
    white-space: nowrap; flex-shrink: 0;
  }
  .theme-item.selected .theme-item-count { color: #0B2D72; border-color: #A8BDD8; }

  /* ── Mobile accordion theme item ── */
  .theme-item-mobile {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 10px;
    overflow: hidden; box-shadow: 0 1px 3px rgba(11,45,114,0.05);
    transition: border-color 0.15s;
  }
  .theme-item-mobile.open { border-color: #0B2D72; }

  .theme-item-mobile-header {
    padding: 0.8rem 1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.5rem;
    transition: background 0.15s;
  }
  .theme-item-mobile.open .theme-item-mobile-header { background: rgba(11,45,114,0.05); border-left: 4px solid #0B2D72; }
  .theme-item-mobile-chevron {
    font-size: 0.7rem; color: #6B7FA3; transition: transform 0.25s ease; flex-shrink: 0;
  }
  .theme-item-mobile.open .theme-item-mobile-chevron { transform: rotate(180deg); }

  /* Animated drawer */
  .theme-mobile-drawer {
    display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.28s ease;
  }
  .theme-item-mobile.open .theme-mobile-drawer { grid-template-rows: 1fr; }
  .theme-mobile-drawer-inner { overflow: hidden; }
  .theme-mobile-drawer-content { padding: 0.5rem 0.75rem 0.75rem; background: #F7FAFD; display: flex; flex-direction: column; gap: 0.35rem; border-top: 1px solid #E0EAFB; }

  /* ── Topic panel (desktop) ── */
  .topic-grid { display: flex; flex-direction: column; gap: 0.4rem; }
  .topic-item {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 10px;
    padding: 0.7rem 0.9rem; cursor: pointer; transition: all 0.15s;
    font-size: 0.875rem; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 1px 3px rgba(11,45,114,0.04);
  }
  .topic-item:hover { border-color: #0B2D72; background: #F7FAFD; }
  .topic-item-name { color: #0D1B3E; font-weight: 500; }

  .topic-select-btn {
    background: #0B2D72; color: #ffffff; border: none; border-radius: 100px;
    padding: 0.35rem 0.85rem; font-size: 0.75rem; font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; transition: all 0.15s; white-space: nowrap;
    box-shadow: 0 2px 8px rgba(11,45,114,0.2);
  }
  .topic-select-btn:hover { background: #0a2360; }
  .topic-select-btn:active { transform: scale(0.96); }

  /* Compact topic row for mobile drawer */
  .topic-item-compact {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 8px;
    padding: 0.55rem 0.75rem; display: flex; align-items: center;
    justify-content: space-between; gap: 0.5rem;
  }
  .topic-item-compact .topic-item-name { font-size: 0.82rem; }

  .empty-hint {
    font-size: 0.85rem; color: #6B7FA3; padding: 2rem; text-align: center;
    background: #F7FAFD; border: 1.5px dashed #C2D4EC; border-radius: 12px;
  }
`;

/* ── Shared topic row (used in both desktop and mobile) ── */
function TopicRow({ topic, compact, onSelect }) {
  return (
    <div className={compact ? "topic-item-compact" : "topic-item"}>
      <div>
        <span className="topic-item-name">{topic.name}</span>
        <span style={{
          display: 'block', fontSize: '0.7rem', marginTop: '0.2rem',
          color: topic.question_count > 0 ? '#15803D' : '#6B7FA3',
        }}>
          {topic.question_count === 0
            ? 'No questions yet'
            : `${topic.question_count} question${topic.question_count !== 1 ? 's' : ''} available`}
        </span>
      </div>
      <button
        className="topic-select-btn"
        style={topic.question_count === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
        disabled={topic.question_count === 0}
        onClick={() => topic.question_count > 0 && onSelect(topic)}>
        Browse →
      </button>
    </div>
  );
}

/* ── Mobile accordion item ── */
function MobileThemeItem({ theme, board, onSelect }) {
  const [open, setOpen]       = useState(false);
  const [topics, setTopics]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const toggle = () => {
    if (!open && !fetched) {
      setLoading(true);
      const boardParam = board?.id ? `&exam_board=${board.id}` : '';
      api.get(`topics-by-theme/?theme=${theme.id}${boardParam}`)
        .then(r => { setTopics(r.data); setFetched(true); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    setOpen(o => !o);
  };

  return (
    <div className={`theme-item-mobile${open ? ' open' : ''}`}>
      <div className="theme-item-mobile-header" onClick={toggle}>
        <span className="theme-item-name">{theme.name}</span>
        <span className="theme-item-count" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {theme.topic_count} topic{theme.topic_count !== 1 ? 's' : ''}
        </span>
        <span className="theme-item-mobile-chevron">▼</span>
      </div>
      <div className="theme-mobile-drawer">
        <div className="theme-mobile-drawer-inner">
          <div className="theme-mobile-drawer-content">
            {loading
              ? <div style={{ color: '#6B7FA3', fontSize: '0.82rem', padding: '0.5rem 0' }}>Loading topics…</div>
              : topics.length === 0
                ? <div style={{ color: '#6B7FA3', fontSize: '0.82rem', padding: '0.5rem 0' }}>No topics in this theme yet.</div>
                : topics.map(t => (
                    <TopicRow key={t.id} topic={t} compact onSelect={onSelect} />
                  ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function Step3Theme({ board, subject, onSelect, selected, onBack, onNext }) {
  const [themes, setThemes]             = useState([]);
  const [topics, setTopics]             = useState([]);
  const [activeTheme, setActiveTheme]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const topicPanelRef = useRef(null);

  useEffect(() => {
    if (!subject) return;
    setLoading(true);
    api.get(`themes/?subject=${subject.id}`)
      .then(r => setThemes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subject]);

  const handleThemeClick = (theme) => {
    setActiveTheme(theme);
    setLoadingTopics(true);
    const boardParam = board?.id ? `&exam_board=${board.id}` : '';
    api.get(`topics-by-theme/?theme=${theme.id}${boardParam}`)
      .then(r => setTopics(r.data))
      .catch(() => {})
      .finally(() => setLoadingTopics(false));

    // Scroll to top of the topic panel on desktop
    setTimeout(() => {
      topicPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleTopicSelect = (topic) => {
    onSelect({ ...activeTheme, selectedTopic: topic });
    onNext();
  };

  if (loading) return <div style={{ color: '#6B7FA3', padding: '2rem' }}>Loading themes…</div>;

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 720;

  return (
    <>
      <style>{styles}</style>
      <button className="btn-back-sm" onClick={onBack}>← Back</button>
      <div className="step-section-title">Select Theme & Topic</div>
      <div className="step-section-sub">
        <strong style={{ color: '#0992C2' }}>{subject?.name}</strong> —
        click a theme to see its topics, then select a topic to browse questions.
      </div>

      {themes.length === 0 ? (
        <div className="empty-hint">No themes found for {subject?.name}. Topics can be added via the admin panel.</div>
      ) : (
        <>
          {/* ── Desktop layout ── */}
          <div className="theme-layout" style={{ display: 'none' }} id="desktop-layout">
            {/* left: theme list */}
            <div>
              <div className="theme-panel-label">Themes</div>
              <div className="theme-list">
                {themes.map(t => (
                  <div key={t.id}
                    className={`theme-item ${activeTheme?.id === t.id ? 'selected' : ''}`}
                    onClick={() => handleThemeClick(t)}>
                    <span className="theme-item-name">{t.name}</span>
                    <span className="theme-item-count">
                      {t.topic_count} topic{t.topic_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* right: topic panel, anchored for scroll target */}
            <div ref={topicPanelRef} style={{ scrollMarginTop: '6rem' }}>
              <div className="theme-panel-label">
                {activeTheme ? `Topics in "${activeTheme.name}"` : 'Topics'}
              </div>
              {!activeTheme ? (
                <div className="empty-hint">← Select a theme to see its topics</div>
              ) : loadingTopics ? (
                <div className="empty-hint">Loading topics…</div>
              ) : topics.length === 0 ? (
                <div className="empty-hint">No topics in this theme yet.</div>
              ) : (
                <div className="topic-grid">
                  {topics.map(topic => (
                    <TopicRow key={topic.id} topic={topic} onSelect={handleTopicSelect} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile layout: accordion per theme ── */}
          <div id="mobile-layout" style={{ display: 'none' }}>
            <div className="theme-panel-label" style={{ marginTop: '0.75rem' }}>Themes</div>
            <div className="theme-list">
              {themes.map(t => (
                <MobileThemeItem
                  key={t.id}
                  theme={t}
                  board={board}
                  onSelect={handleTopicSelect}
                />
              ))}
            </div>
          </div>

          {/* Responsive show/hide via inline style injection */}
          <style>{`
            @media (min-width: 721px) {
              #desktop-layout { display: grid !important; }
              #mobile-layout  { display: none  !important; }
            }
            @media (max-width: 720px) {
              #desktop-layout { display: none  !important; }
              #mobile-layout  { display: block !important; }
            }
          `}</style>
        </>
      )}
    </>
  );
}