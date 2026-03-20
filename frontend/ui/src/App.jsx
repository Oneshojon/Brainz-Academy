import { useState, useEffect } from "react";
import api from "./api";
import QuestionGeneratorForm, {
  getTestBuilderAccess,
} from "./components/QuestionGeneratorForm";
import QuestionList from "./components/QuestionList";
import BuilderLayout from "./components/builder/BuilderLayout";

const appStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
  --navy: #0B2D72; --blue: #0992C2; --cyan: #0AC4E0;
  --bg: #EDF1F8; --card: #ffffff; --border: #C2D4EC;
  --border-hover: #A8BDD8; --text: #0D1B3E; --muted: #6B7FA3;
  --gold: #B8860B; --green: #15803D; --red: #DC2626;
  --accent: #0992C2; --accent-dim: rgba(9,146,194,0.08);
  --deep: #F3F6FA;
}

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--black); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .app-shell { min-height: 100vh; display: flex; flex-direction: column; }

  .app-topbar {
    position: sticky; top: 0; z-index: 50;
    background: rgba(14,31,44,0.95); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0.9rem 2rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .app-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.2rem; color: var(--text); letter-spacing: -0.5px; text-decoration: none; }
  .app-logo span { color: var(--accent); }

  .topbar-right { display: flex; align-items: center; gap: 0.75rem; }
  .user-chip { display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 0.35rem 0.75rem; border-radius: 100px; font-size: 0.8rem; color: rgba(255,255,255,0.85); }
  .role-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; }
  .role-badge.teacher { background: #ffffff; color: #0B2D72; border: 1px solid #C2D4EC; }
  .role-badge.student { background: #ffffff; color: #0B2D72; border: 1px solid #C2D4EC; }

  .app-main { flex: 1; padding: 2rem; max-width: 1400px; margin: 0 auto; width: 100%; }

  /* ── Mode selector ── */
  .mode-selector { max-width: 680px; margin: 3rem auto; text-align: center; }
.mode-selector h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.6rem; margin-bottom: 0.5rem; letter-spacing: -0.5px; color: #0B2D72; }
.mode-selector p { font-size: 0.9rem; color: #6B7FA3; margin-bottom: 2rem; line-height: 1.6; }
.mode-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.mode-card {
  background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 16px;
  padding: 1.75rem 1.5rem; cursor: pointer; transition: all 0.2s; text-align: left;
  box-shadow: 0 2px 12px rgba(11,45,114,0.07);
}
.mode-card:hover { border-color: #0B2D72; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(11,45,114,0.12); }
.mode-card.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
.mode-card-icon { font-size: 2rem; margin-bottom: 0.75rem; display: block; }
.mode-card-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 0.4rem; color: #0B2D72; }
.mode-card-desc { font-size: 0.8rem; color: #6B7FA3; line-height: 1.6; }
.mode-card-badge {
  display: inline-block; margin-top: 0.75rem; font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2rem 0.6rem;
  border-radius: 100px; background: rgba(9,146,194,0.1); color: #0992C2;
  border: 1px solid rgba(9,146,194,0.2);
}
  /* ── Random mode layout ── */
  .teacher-layout { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; align-items: start; }
  .form-sidebar { position: sticky; top: 80px; }
  .results-panel { min-height: 400px; }
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .panel-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; }
  .results-count { font-size: 0.78rem; color: var(--green); background: var(--green-dim); border: 1px solid rgba(74,222,128,0.2); padding: 0.25rem 0.7rem; border-radius: 100px; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; background: var(--card); border: 1px solid var(--border); border-radius: 16px; text-align: center; }
  .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .empty-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 0.4rem; }
  .empty-desc { font-size: 0.82rem; color: var(--muted); line-height: 1.6; }

  .btn-back {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: var(--card); border: 1px solid var(--border);
    color: var(--text); border-radius: 8px; padding: 0.4rem 0.9rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500;
    cursor: pointer; transition: all 0.2s; margin-bottom: 1.5rem;
  }
  .btn-back:hover { border-color: var(--border-hover); }

  @media (max-width: 900px) {
    .teacher-layout { grid-template-columns: 1fr; }
    .form-sidebar { position: static; }
    .mode-cards { grid-template-columns: 1fr; }
  }
`;

export default function App() {
  const [access, setAccess] = useState(null);
  const [userRole, setUserRole] = useState(window.USER_ROLE || "STUDENT");
  const [mode, setMode] = useState(null); // null | 'random' | 'manual'
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(null);
  const [filterMeta, setFilterMeta] = useState(null);

  // Feature flags for disabling modes
  const [flags, setFlags] = useState({ random: true, manual: true });

  useEffect(() => {
    if (window.USER_ROLE) setUserRole(window.USER_ROLE);
    getTestBuilderAccess()
      .then(setAccess)
      .catch(() =>
        setAccess({
          allowed: false,
          is_free: true,
          trials_remaining: 0,
          max_questions: 15,
          pdf_only: true,
          reason: "",
        }),
      );
    // Fetch feature flags to check if modes are enabled
    api
      .get("/api/catalog/feature-flags/")
      .then((r) => {
        const f = r.data;
        setFlags({
          random: f.test_builder_random !== false,
          manual: f.test_builder_manual !== false,
        });
      })
      .catch(() => {}); // silently fail — defaults to both enabled
  }, []);

  const isTeacher = userRole === "TEACHER";

  const handleResults = (data) => {
    setQuestions(data.questions);
    setCount(data.total);
    setFilterMeta(data.filter_meta || null);
  };

  const handleClear = () => {
    setQuestions([]);
    setCount(null);
    setFilterMeta(null);
  };

  return (
    <>
      <style>{appStyles}</style>
      <div className="app-shell">
        {/* ── Topbar ── */}
        <header className="app-topbar">
          <a href="/" className="app-logo">
            Exam<span>Prep</span>
          </a>

          <div className="topbar-right">
            
            {isTeacher && mode === "random" && (
              <button
                className="btn-back"
                onClick={() => {
                  setMode(null);
                  handleClear();
                }}
              >
                ← Change Mode
              </button>
            )}
            {isTeacher && (
              <a
                href="/teacher/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "#ffffff",
                  border: "1px solid #C2D4EC",
                  color: "#0B2D72",
                  borderRadius: "8px",
                  padding: "0.4rem 0.9rem",
                  textDecoration: "none",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
              >
                ← Dashboard
              </a>
            )}
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

        {/* ── Main content ── */}
        <main className="app-main">
          {!isTeacher ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                color: "var(--muted)",
              }}
            >
              Test builder is for teachers only.
            </div>
          ) : mode === null ? (
            /* Mode selector */
            <div className="mode-selector">
              <h2>🛠️ Test Builder</h2>
              <p>Choose how you want to build your question set.</p>
              <div className="mode-cards">
                <div
                  className={`mode-card ${!flags.random ? "disabled" : ""}`}
                  onClick={() => flags.random && setMode("random")}
                >
                  <span className="mode-card-icon">🎲</span>
                  <div className="mode-card-title">Random / Filter</div>
                  <div className="mode-card-desc">
                    Set filters — subject, year, topic, difficulty — and let the
                    system pick questions automatically. Fast and great for
                    mixed practice sets.
                  </div>
                  <span className="mode-card-badge">Quick Generate</span>
                </div>
                <div
                  className={`mode-card ${!flags.manual ? "disabled" : ""}`}
                  onClick={() => flags.manual && setMode("manual")}
                >
                  <span className="mode-card-icon">✋</span>
                  <div className="mode-card-title">Manual Selection</div>
                  <div className="mode-card-desc">
                    Browse questions by theme and topic. Hand-pick exactly which
                    questions go in your test, preview each one before adding.
                  </div>
                  <span className="mode-card-badge">Full Control</span>
                </div>
              </div>
            </div>
          ) : mode === "random" ? (
            /* Existing random generator */
            <div className="teacher-layout">
              <aside className="form-sidebar">
                <QuestionGeneratorForm
                  onResults={handleResults}
                  onClear={handleClear}
                  access={access}
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
                      <div className="panel-title">Generated Questions</div>
                      <span className="results-count">
                        ✓ {count} question{count !== 1 ? "s" : ""} found
                      </span>
                    </div>
                    <QuestionList
                      questions={questions}
                      filterMeta={filterMeta}
                      access={access}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            /* New manual builder */
            <BuilderLayout access={access} onChangeMode={() => { setMode(null); handleClear(); }} />
          )}
        </main>
      </div>
    </>
  );
}
