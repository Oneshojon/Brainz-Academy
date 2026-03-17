import { useState, useEffect } from "react";
import api from "../../api";

const styles = `
  .theme-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start; }
  @media (max-width: 720px) { .theme-layout { grid-template-columns: 1fr; } }

  .theme-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .theme-item {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 0.85rem 1rem; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: space-between;
  }
  .theme-item:hover { border-color: var(--border-hover); }
  .theme-item.selected { border-color: var(--accent); background: var(--accent-dim); }
  .theme-item-name { font-size: 0.875rem; font-weight: 600; }
  .theme-item-count { font-size: 0.72rem; color: var(--muted); background: var(--deep); border: 1px solid var(--border); padding: 0.15rem 0.5rem; border-radius: 100px; }
  .theme-item.selected .theme-item-count { color: var(--accent); border-color: rgba(156,213,255,0.3); }

  .topic-panel { }
  .topic-panel-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--muted-light); }
  .topic-grid { display: flex; flex-direction: column; gap: 0.4rem; }
  .topic-item {
    background: var(--deep); border: 1px solid var(--border); border-radius: 8px;
    padding: 0.65rem 0.9rem; cursor: pointer; transition: all 0.15s;
    font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between;
  }
  .topic-item:hover { border-color: var(--border-hover); }
  .topic-item.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
  .topic-select-btn {
    background: var(--accent); color: var(--black); border: none; border-radius: 6px;
    padding: 0.3rem 0.75rem; font-size: 0.72rem; font-weight: 700;
    font-family: 'Syne', sans-serif; cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .topic-select-btn:hover { background: #c2e8ff; }

  .empty-hint { font-size: 0.82rem; color: var(--muted); padding: 1.5rem; text-align: center; }
`;

export default function Step3Theme({ board, subject, onSelect, selected, onBack, onNext }) {
  const [themes, setThemes]   = useState([]);
  const [topics, setTopics]   = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);

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
    api.get(`topics-by-theme/?theme=${theme.id}`)
      .then(r => setTopics(r.data))
      .catch(() => {})
      .finally(() => setLoadingTopics(false));
  };

  const handleTopicSelect = (topic) => {
    onSelect({ ...activeTheme, selectedTopic: topic });
    onNext();
  };

  if (loading) return <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading themes…</div>;

  return (
    <>
      <style>{styles}</style>
      <button className="btn-back-sm" onClick={onBack}>← Back</button>
      <div className="step-section-title">Select Theme & Topic</div>
      <div className="step-section-sub">
        <strong style={{color:'var(--accent)'}}>{subject?.name}</strong> —
        click a theme to see its topics, then select a topic to browse questions.
      </div>

      {themes.length === 0 ? (
        <div className="empty-hint">
          No themes found for {subject?.name}. Topics can be added via the admin panel.
        </div>
      ) : (
        <div className="theme-layout">
          {/* Theme list */}
          <div>
            <div className="topic-panel-title">Themes</div>
            <div className="theme-list">
              {themes.map(t => (
                <div
                  key={t.id}
                  className={`theme-item ${activeTheme?.id === t.id ? 'selected' : ''}`}
                  onClick={() => handleThemeClick(t)}
                >
                  <span className="theme-item-name">{t.name}</span>
                  <span className="theme-item-count">{t.topic_count} topic{t.topic_count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topics panel */}
          <div className="topic-panel">
            {!activeTheme ? (
              <div className="empty-hint">← Select a theme to see its topics</div>
            ) : loadingTopics ? (
              <div className="empty-hint">Loading topics…</div>
            ) : topics.length === 0 ? (
              <div className="empty-hint">No topics in this theme yet.</div>
            ) : (
              <>
                <div className="topic-panel-title">Topics in "{activeTheme.name}"</div>
                <div className="topic-grid">
                  {topics.map(topic => (
                    <div key={topic.id} className="topic-item">
                      <span>{topic.name}</span>
                      <button className="topic-select-btn" onClick={() => handleTopicSelect(topic)}>
                        Browse Questions →
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}