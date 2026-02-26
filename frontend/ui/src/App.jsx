import { useState, useEffect } from "react";
import QuestionGeneratorForm from "./components/QuestionGeneratorForm";
import QuestionList from "./components/QuestionList";

const appStyles = `
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-topbar {
    position: sticky; top: 0; z-index: 50;
    background: rgba(14, 31, 44, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0.9rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
  }

  .app-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 1.2rem; color: var(--text); letter-spacing: -0.5px;
  }
  .app-logo span { color: var(--accent); }

  .mode-tabs {
    display: flex; gap: 0.375rem;
    background: var(--deep); border: 1px solid var(--border);
    padding: 0.25rem; border-radius: 10px;
  }
  .mode-tab {
    padding: 0.45rem 1.1rem; border-radius: 7px; font-size: 0.85rem;
    font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .mode-tab.active {
    background: var(--accent); color: var(--black);
  }
  .mode-tab.inactive {
    background: transparent; color: var(--muted);
  }
  .mode-tab.inactive:hover { color: var(--text); }
  .mode-tab.locked { opacity: 0.4; cursor: not-allowed; }

  .topbar-right {
    display: flex; align-items: center; gap: 0.75rem;
  }
  .user-chip {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--card); border: 1px solid var(--border);
    padding: 0.4rem 0.9rem; border-radius: 8px;
    font-size: 0.825rem; color: var(--muted-light);
  }
  .user-chip .role-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .role-badge.teacher { background: var(--gold-dim); color: var(--gold); }
  .role-badge.student { background: var(--accent-dim); color: var(--accent); }

  .app-main {
    flex: 1;
    display: flex;
    max-width: 1300px;
    margin: 0 auto;
    width: 100%;
    padding: 2rem;
    gap: 2rem;
  }

  /* Teacher layout: sidebar form + main results */
  .teacher-layout {
    display: flex; width: 100%; gap: 2rem; align-items: flex-start;
  }
  .form-sidebar {
    width: 360px; flex-shrink: 0;
    position: sticky; top: 80px;
  }
  .results-panel {
    flex: 1; min-width: 0;
  }

  /* Student layout: centered */
  .student-layout {
    width: 100%; max-width: 700px; margin: 0 auto;
  }

  .panel-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 1.4rem;
    letter-spacing: -0.5px; margin-bottom: 0.35rem;
  }
  .panel-sub {
    font-size: 0.875rem; color: var(--muted); margin-bottom: 1.5rem; line-height: 1.6;
  }

  .results-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;
  }
  .results-count {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--accent-dim); border: 1px solid rgba(156,213,255,0.25);
    color: var(--accent); font-size: 0.825rem; font-weight: 700;
    padding: 0.35rem 0.9rem; border-radius: 100px;
  }

  .empty-state {
    text-align: center;
    padding: 5rem 2rem;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px;
  }
  .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  .empty-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--muted-light); }
  .empty-desc { font-size: 0.875rem; color: var(--muted); }

  @media (max-width: 900px) {
    .teacher-layout { flex-direction: column; }
    .form-sidebar { width: 100%; position: static; }
    .app-main { padding: 1.25rem; }
  }
`;

export default function App() {
  const [mode, setMode] = useState("teacher");
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(null);
  const [userRole, setUserRole] = useState("TEACHER"); // read from Django context if available

  // Read mode from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode");
    if (m === "student" || m === "teacher") setMode(m);

    // Try to read user role injected by Django
    if (window.USER_ROLE) setUserRole(window.USER_ROLE);
  }, []);

  const handleResults = (data) => {
    setQuestions(data.questions);
    setCount(data.count);
  };

  const handleClear = () => {
    setQuestions([]);
    setCount(null);
  };

  const isTeacher = userRole === "TEACHER";

  return (
    <>
      <style>{appStyles}</style>
      <div className="app-shell">
        {/* Top bar */}
        <header className="app-topbar">
          <a href="/" className="app-logo" style={{ textDecoration: "none" }}>
            Exam<span>Prep</span>
          </a>

          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === "student" ? "active" : "inactive"}`}
              onClick={() => {
                setMode("student");
                handleClear();
              }}
            >
              🎓 Student
            </button>
            <button
              className={`mode-tab ${mode === "teacher" ? "active" : "inactive"} ${!isTeacher ? "locked" : ""}`}
              onClick={() => {
                if (isTeacher) {
                  setMode("teacher");
                  handleClear();
                }
              }}
              title={!isTeacher ? "Teachers only" : ""}
            >
              🏫 Teacher
            </button>
          </div>

          <div className="topbar-right">
            <div className="user-chip">
              <span>👤</span>
              <span
                className={`role-badge ${isTeacher ? "teacher" : "student"}`}
              >
                {isTeacher ? "Teacher" : "Student"}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="app-main">
          {mode === "teacher" && isTeacher && (
            <div className="teacher-layout">
              <aside className="form-sidebar">
                <QuestionGeneratorForm
                  onResults={handleResults}
                  onClear={handleClear}
                />
              </aside>
              <div className="results-panel">
                {count === null ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-title">No questions yet</div>
                    <div className="empty-desc">
                      Use the filters on the left to generate a question set.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="results-header">
                      <div>
                        <div className="panel-title">Generated Questions</div>
                      </div>
                      <span className="results-count">
                        ✓ {count} question{count !== 1 ? "s" : ""} found
                      </span>
                    </div>
                    <QuestionList questions={questions} />
                  </>
                )}
              </div>
            </div>
          )}

          {mode === "student" && (
            <div className="student-layout">
              <div className="panel-title">Practice Mode</div>
              <p className="panel-sub">
                Coming soon — timed practice sessions and progress tracking.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
