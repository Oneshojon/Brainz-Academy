const styles = `
  .step-nav {
    display: flex; align-items: center;
    margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.25rem;
  }
  .step-nav::-webkit-scrollbar { height: 3px; }
  .step-nav::-webkit-scrollbar-thumb { background: var(--border, #C2D4EC); border-radius: 2px; }

  .step-item { display: flex; align-items: center; gap: 0; flex-shrink: 0; }

  .step-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: none; border: none; cursor: pointer;
    padding: 0.45rem 0.6rem; border-radius: 8px;
    transition: all 0.15s; white-space: nowrap;
  }
  .step-btn:disabled { cursor: default; }
  .step-btn:not(:disabled):hover { background: rgba(11,45,114,0.04); }

  .step-num {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 0.75rem;
    transition: all 0.2s;
  }
  .step-num.done   { background: #15803D; color: #ffffff; }
  .step-num.active { background: #0B2D72; color: #ffffff; box-shadow: 0 0 0 3px rgba(11,45,114,0.18); }
  .step-num.future { background: #EDF1F8; color: #6B7FA3; border: 1.5px solid #C2D4EC; }

  .step-label {
    font-size: 0.78rem; font-weight: 600; transition: color 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .step-label.done   { color: #15803D; }
  .step-label.active { color: #0B2D72; }
  .step-label.future { color: #6B7FA3; }

  .step-connector {
    width: 32px; height: 2px; background: #D1DCF0; flex-shrink: 0; margin: 0 0.1rem; border-radius: 1px;
  }
  .step-connector.done { background: #15803D; opacity: 0.5; }
`;

export default function StepNav({ current, labels, onStepClick, maxReached }) {
  return (
    <>
      <style>{styles}</style>
      <div className="step-nav">
        {labels.map((label, i) => {
          const num      = i + 1;
          const isDone   = num < current;
          const isActive = num === current;
          const canClick = num <= maxReached;
          const state    = isDone ? 'done' : isActive ? 'active' : 'future';
          return (
            <div key={num} className="step-item">
              <button className="step-btn" disabled={!canClick}
                onClick={() => canClick && onStepClick(num)}>
                <span className={`step-num ${state}`}>{isDone ? '✓' : num}</span>
                <span className={`step-label ${state}`}>{label}</span>
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