const listStyles = `
  .q-list { display: flex; flex-direction: column; gap: 1.25rem; }

  .q-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 1.75rem;
    transition: border-color 0.2s;
    position: relative; overflow: hidden;
  }
  .q-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
  }
  .q-card.obj::before { background: var(--mid); }
  .q-card.theory::before { background: var(--gold); }
  .q-card:hover { border-color: var(--border-hover); }

  .q-card-header {
    display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .q-num {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.8rem;
    color: var(--muted); letter-spacing: 0.05em;
  }
  .q-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .q-badge.obj { background: var(--mid-dim); color: var(--accent); }
  .q-badge.theory { background: var(--gold-dim); color: var(--gold); }
  .q-badge.easy { background: rgba(0,232,122,0.12); color: var(--accent); }
  .q-badge.medium { background: var(--gold-dim); color: var(--gold); }
  .q-badge.hard { background: rgba(248,113,113,0.12); color: var(--red); }

  .q-marks {
    margin-left: auto; font-size: 0.75rem; color: var(--muted);
    background: var(--deep); border: 1px solid var(--border);
    padding: 0.2rem 0.6rem; border-radius: 6px;
  }

  .q-content {
    font-size: 0.975rem; line-height: 1.7; color: var(--text);
    margin-bottom: 1.25rem;
  }

  .q-image {
    max-width: 100%; border-radius: 8px; margin-bottom: 1.25rem;
    border: 1px solid var(--border);
  }

  /* Choices */
  .choices { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .choice-item {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.75rem 1rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep);
    transition: all 0.15s;
  }
  .choice-item.correct {
    background: rgba(156,213,255,0.06);
    border-color: rgba(156,213,255,0.2);
  }
  .choice-label {
    font-weight: 700; font-size: 0.875rem; flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--card); border: 1px solid var(--border);
    font-family: 'Syne', sans-serif;
  }
  .choice-item.correct .choice-label {
    background: var(--accent); color: var(--black); border-color: var(--accent);
  }
  .choice-body { flex: 1; }
  .choice-text { font-size: 0.9rem; line-height: 1.5; }
  .choice-item.correct .choice-text { color: var(--accent); }
  .correct-tick {
    font-size: 0.75rem; color: var(--accent); font-weight: 700;
    margin-left: auto; flex-shrink: 0;
  }

  .choice-explanation {
    font-size: 0.8rem; color: var(--muted); margin-top: 0.4rem;
    line-height: 1.5; font-style: italic;
  }

  /* Theory answer */
  .theory-answer {
    background: var(--deep); border: 1px solid rgba(245,200,66,0.15);
    border-radius: 10px; padding: 1.25rem; margin-top: 0.5rem;
  }
  .theory-answer-title {
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--gold); margin-bottom: 0.75rem;
  }
  .theory-answer-content {
    font-size: 0.9rem; line-height: 1.7; color: var(--muted-light);
  }
  .marking-guide {
    margin-top: 0.75rem;
    border-top: 1px solid var(--border); padding-top: 0.75rem;
  }
  .marking-guide summary {
    font-size: 0.78rem; font-weight: 600; color: var(--muted);
    cursor: pointer; user-select: none; transition: color 0.15s;
  }
  .marking-guide summary:hover { color: var(--text); }
  .marking-guide p {
    font-size: 0.85rem; color: var(--muted); line-height: 1.6;
    margin-top: 0.5rem;
  }

  /* Video link */
  .video-link {
    display: inline-flex; align-items: center; gap: 0.4rem;
    margin-top: 0.75rem;
    font-size: 0.8rem; font-weight: 600; color: var(--mid);
    text-decoration: none; padding: 0.35rem 0.8rem;
    background: var(--mid-dim); border: 1px solid rgba(122,170,206,0.2);
    border-radius: 6px; transition: all 0.2s;
  }
  .video-link:hover {
    background: var(--mid-dim);
    transform: translateX(2px);
  }

  /* Topics */
  .q-topics { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 1rem; }
  .topic-tag {
    font-size: 0.72rem; color: var(--muted); background: var(--deep);
    border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 100px;
  }
`

export default function QuestionList({ questions }) {
  if (!questions.length) return null

  return (
    <>
      <style>{listStyles}</style>
      <div className="q-list">
        {questions.map((q) => (
          <div key={q.id} className={`q-card ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>

            {/* Header */}
            <div className="q-card-header">
              <span className="q-num">Q{q.question_number}</span>
              <span className={`q-badge ${q.question_type === 'OBJ' ? 'obj' : 'theory'}`}>
                {q.question_type === 'OBJ' ? 'Objective' : 'Theory'}
              </span>
              {q.difficulty && (
                <span className={`q-badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
              )}
              <span className="q-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
            </div>

            {/* Content */}
            <p className="q-content">{q.content}</p>

            {q.image && <img src={q.image} alt={`Q${q.question_number}`} className="q-image" />}

            {/* Objective choices */}
            {q.question_type === 'OBJ' && q.choices?.length > 0 && (
              <ul className="choices">
                {q.choices.map(c => (
                  <li key={c.id} className={`choice-item ${c.is_correct ? 'correct' : ''}`}>
                    <span className="choice-label">{c.label}</span>
                    <div className="choice-body">
                      <div className="choice-text">{c.choice_text}</div>
                      {c.is_correct && c.explanation && (
                        <div className="choice-explanation">💡 {c.explanation}</div>
                      )}
                      {c.video_url && (
                        <a href={c.video_url} target="_blank" rel="noreferrer" className="video-link">
                          ▶ Watch explanation
                        </a>
                      )}
                    </div>
                    {c.is_correct && <span className="correct-tick">✓</span>}
                  </li>
                ))}
              </ul>
            )}

            {/* Theory answer */}
            {q.question_type === 'THEORY' && q.theory_answer && (
              <div className="theory-answer">
                <div className="theory-answer-title">Model Answer</div>
                <div className="theory-answer-content">{q.theory_answer.content}</div>
                {q.theory_answer.marking_guide && (
                  <details className="marking-guide">
                    <summary>📋 View Marking Guide</summary>
                    <p>{q.theory_answer.marking_guide}</p>
                  </details>
                )}
                {q.theory_answer.video_url && (
                  <a href={q.theory_answer.video_url} target="_blank" rel="noreferrer" className="video-link">
                    ▶ Watch walkthrough
                  </a>
                )}
              </div>
            )}

            {/* Topics */}
            {q.topics?.length > 0 && (
              <div className="q-topics">
                {q.topics.map(t => <span key={t.id} className="topic-tag">{t.name}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}