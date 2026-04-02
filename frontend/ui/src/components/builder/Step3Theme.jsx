import { useState, useEffect } from "react";
import api from "../../api";

const styles = `
  .theme-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; align-items: start; }
  @media (max-width: 720px) { .theme-layout { grid-template-columns: 1fr; } }

  .theme-panel-label {
    font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em;
    color: #6B7FA3; margin-bottom: 0.65rem;
  }

  .theme-list { display: flex; flex-direction: column; gap: 0.4rem; }
  .theme-item {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 10px;
    padding: 0.8rem 1rem; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 1px 3px rgba(11,45,114,0.05);
  }
  .theme-item:hover { border-color: #0B2D72; background: #F7FAFD; }
  .theme-item:active { transform: scale(0.99); }
  .theme-item.selected { border-color: #0B2D72; background: rgba(11,45,114,0.05); border-left: 4px solid #0B2D72; }
  .theme-item-name { font-size: 0.875rem; font-weight: 600; color: #0B2D72; }
  .theme-item-count {
    font-size: 0.7rem; color: #6B7FA3; background: #EDF1F8;
    border: 1px solid #C2D4EC; padding: 0.12rem 0.5rem; border-radius: 100px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600;
  }
  .theme-item.selected .theme-item-count { color: #0B2D72; border-color: #A8BDD8; }

  .topic-panel { }
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

  .empty-hint {
    font-size: 0.85rem; color: #6B7FA3; padding: 2rem; text-align: center;
    background: #F7FAFD; border: 1.5px dashed #C2D4EC; border-radius: 12px;
  }
`;

export default function Step3Theme({ board, subject, onSelect, selected, onBack, onNext }) {
  const [themes, setThemes]             = useState([]);
  const [topics, setTopics]             = useState([]);
  const [activeTheme, setActiveTheme]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (!subject) return;
    setLoading(true);
    api.get(`themes/?subject=${subject.id}`).then(r => setThemes(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [subject]);

  const handleThemeClick = (theme) => {
  setActiveTheme(theme);
  setLoadingTopics(true);
  const boardParam = board?.id ? `&exam_board=${board.id}` : '';
  api.get(`topics-by-theme/?theme=${theme.id}${boardParam}`)
    .then(r => setTopics(r.data))
    .catch(() => {})
    .finally(() => setLoadingTopics(false));
};

  const handleTopicSelect = (topic) => {
    onSelect({ ...activeTheme, selectedTopic: topic });
    onNext();
  };

  if (loading) return <div style={{ color: '#6B7FA3', padding: '2rem' }}>Loading themes…</div>;

  return (
    <>
      <style>{styles}</style>
      <button className="btn-back-sm" onClick={onBack}>← Back</button>
      <div className="step-section-title">Select Theme & Topic</div>
      <div className="step-section-sub">
        <strong style={{color:'#0992C2'}}>{subject?.name}</strong> —
        click a theme to see its topics, then select a topic to browse questions.
      </div>

      {themes.length === 0 ? (
        <div className="empty-hint">No themes found for {subject?.name}. Topics can be added via the admin panel.</div>
      ) : (
        <div className="theme-layout">
          <div>
            <div className="theme-panel-label">Themes</div>
            <div className="theme-list">
              {themes.map(t => (
                <div key={t.id}
                  className={`theme-item ${activeTheme?.id === t.id ? 'selected' : ''}`}
                  onClick={() => handleThemeClick(t)}>
                  <span className="theme-item-name">{t.name}</span>
                  <span className="theme-item-count">{t.topic_count} topic{t.topic_count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="topic-panel">
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
                <div key={topic.id} className="topic-item">
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
                    style={topic.question_count === 0 ? {opacity: 0.4, cursor: 'not-allowed'} : {}}
                    disabled={topic.question_count === 0}
                    onClick={() => topic.question_count > 0 && handleTopicSelect(topic)}>
                    Browse Questions →
                  </button>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}