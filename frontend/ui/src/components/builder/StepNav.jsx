const styles = `
  .step-nav {
    display: flex; align-items: center;
    margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.25rem;
  }
  .step-nav::-webkit-scrollbar { height: 3px; }
  .step-nav::-webkit-scrollbar-thumb { background: var(--base); border-radius: 2px; }

  .step-item {
    display: flex; align-items: center; gap: 0; flex-shrink: 0;
  }
  .step-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: none; border: none; cursor: pointer;
    padding: 0.5rem 0.75rem; border-radius: 8px;
    transition: all 0.15s; white-space: nowrap;
  }
  .step-btn:disabled { cursor: default; }
  .step-num {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.75rem;
    transition: all 0.2s;
  }
  .step-num.done    { background: var(--green); color: var(--black); }
  .step-num.active  { background: var(--accent); color: var(--black); box-shadow: 0 0 0 3px rgba(156,213,255,0.25); }
  .step-num.future  { background: var(--base); color: var(--muted); }
  .step-label {
    font-size: 0.78rem; font-weight: 600; transition: color 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .step-label.done   { color: var(--green); }
  .step-label.active { color: var(--text); }
  .step-label.future { color: var(--muted); }
  .step-connector {
    width: 32px; height: 1px; background: var(--border); flex-shrink: 0; margin: 0 0.1rem;
  }
  .step-connector.done { background: var(--green); opacity: 0.4; }
`;

export default function StepNav({ current, labels, onStepClick, maxReached }) {
  return (
    <>
      <style>{styles}</style>
      <div className="step-nav">
        {labels.map((label, i) => {
          const num    = i + 1;
          const isDone = num < current;
          const isActive = num === current;
          const canClick = num <= maxReached;
          const stateClass = isDone ? 'done' : isActive ? 'active' : 'future';

          return (
            <div key={num} className="step-item">
              <button
                className="step-btn"
                disabled={!canClick}
                onClick={() => canClick && onStepClick(num)}
              >
                <span className={`step-num ${stateClass}`}>
                  {isDone ? '✓' : num}
                </span>
                <span className={`step-label ${stateClass}`}>{label}</span>
              </button>
              {i < labels.length - 1 && (
                <div className={`step-connector ${isDone ? 'done' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}