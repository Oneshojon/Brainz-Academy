import { useState, useEffect } from "react";
import api from "./api";
import QuestionGeneratorForm, {
  getTestBuilderAccess,
} from "./components/QuestionGeneratorForm";
import QuestionList from "./components/QuestionList";
import BuilderLayout from "./components/builder/BuilderLayout";
import MyTestsModal from "./components/builder/MyTestsModal";

const appStyles = `
  @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap");

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg, #E8EDF5); color: var(--text, #0D1B3E); font-family: 'Inter', sans-serif; }

  .app-shell { min-height: 100vh; display: flex; flex-direction: column; }

  .app-topbar {
    position: sticky; top: 0; z-index: 50;
    background: #0B2D72;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 0 2rem; height: 62px;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .app-logo {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 1.3rem;
    color: #ffffff; letter-spacing: -0.5px; text-decoration: none;
  }
  .app-logo span { color: #0AC4E0; }

  .topbar-right { display: flex; align-items: center; gap: 0.75rem; }
  .user-chip {
    display: flex; align-items: center; gap: 0.5rem;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
    padding: 0.35rem 0.75rem; border-radius: 100px;
    font-size: 0.8rem; color: rgba(255,255,255,0.9);
  }
  .role-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em;
  }
  .role-badge.teacher { background: #ffffff; color: #0B2D72; }
  .role-badge.student { background: #ffffff; color: #0B2D72; }

  .app-main { flex: 1; padding: 2rem; max-width: 1400px; margin: 0 auto; width: 100%; }

  .mode-selector { max-width: 900px; margin: 3rem auto; text-align: center; }
  .mode-selector h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.6rem; margin-bottom: 0.5rem; letter-spacing: -0.5px; color: #0B2D72; }
  .mode-selector p { font-size: 0.9rem; color: #6B7FA3; margin-bottom: 2rem; line-height: 1.6; }
  .mode-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  .mode-card {
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 16px;
    padding: 1.75rem 1.5rem; cursor: pointer; transition: all 0.2s; text-align: left;
    box-shadow: 0 2px 12px rgba(11,45,114,0.07);
  }
  .mode-card:hover { border-color: #0B2D72; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(11,45,114,0.12); }
  .mode-card.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
  .mode-card.my-tests { border-color: rgba(9,146,194,0.3); background: rgba(9,146,194,0.03); }
  .mode-card.my-tests:hover { border-color: #0992C2; }
  .mode-card-icon { font-size: 2rem; margin-bottom: 0.75rem; display: block; }
  .mode-card-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 0.4rem; color: #0B2D72; }
  .mode-card-desc { font-size: 0.8rem; color: #6B7FA3; line-height: 1.6; }
  .mode-card-badge {
    display: inline-block; margin-top: 0.75rem; font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2rem 0.6rem;
    border-radius: 100px; background: rgba(9,146,194,0.1); color: #0992C2;
    border: 1px solid rgba(9,146,194,0.2);
  }
  .mode-card-badge.saved { background: rgba(21,128,61,0.1); color: #15803D; border-color: rgba(21,128,61,0.2); }

  .teacher-layout { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; align-items: start; }
  .form-sidebar { position: sticky; top: 80px; }
  .results-panel { min-height: 400px; }
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .panel-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; }
  .results-count { font-size: 0.78rem; color: #15803D; background: #DCFCE7; border: 1px solid rgba(21,128,61,0.2); padding: 0.25rem 0.7rem; border-radius: 100px; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; background: #ffffff; border: 1px solid #C2D4EC; border-radius: 16px; text-align: center; }
  .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .empty-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 0.4rem; color: #0D1B3E; }
  .empty-desc { font-size: 0.82rem; color: #6B7FA3; line-height: 1.6; }

  .btn-back {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.9); border-radius: 100px; padding: 0.38rem 0.9rem;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
  }
  .btn-back:hover { background: rgba(255,255,255,0.2); }

  @media (max-width: 900px) {
    .teacher-layout { grid-template-columns: 1fr; }
    .form-sidebar { position: static; }
    .mode-cards { grid-template-columns: 1fr; }
  }
`;

export default function App() {
  const [access, setAccess]       = useState(null);
  const [userRole, setUserRole]   = useState(window.USER_ROLE || "STUDENT");
  const [mode, setMode]           = useState(null); // null | 'random' | 'manual'
  const [questions, setQuestions] = useState([]);
  const [count, setCount]         = useState(null);
  const [filterMeta, setFilterMeta] = useState(null);
  const [flags, setFlags]         = useState({ random: true, manual: true });

  // My Tests modal state
  const [showMyTests, setShowMyTests]           = useState(false);
  // When a manual test is opened from My Tests, pre-populate the builder
  const [resumeTest, setResumeTest]             = useState(null); // { savedTestId, title, questions }

  useEffect(() => {
    if (window.USER_ROLE) setUserRole(window.USER_ROLE);
    getTestBuilderAccess()
      .then(setAccess)
      .catch(() =>
        setAccess({
          allowed: true, is_free: false, trials_remaining: 9999,
          max_questions: 9999, pdf_only: false, reason: '',
        })
      );
    api.get('/api/catalog/feature-flags/')
      .then(r => {
        const f = r.data;
        setFlags({
          random: f.test_builder_random !== false,
          manual: f.test_builder_manual !== false,
        });
      })
      .catch(() => {});
  }, []);

  const isTeacher = userRole === 'TEACHER';

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

  // Called from MyTestsModal when teacher clicks "Open" on a manual test
  const handleOpenTest = (testData) => {
    setResumeTest(testData);
    setShowMyTests(false);
    setMode('manual');
  };

  const handleChangeMode = () => {
    setMode(null);
    setResumeTest(null);
    handleClear();
  };

  return (
    <>
      <style>{appStyles}</style>
      <div className="app-shell">

        {/* ── Topbar ── */}
        <header className="app-topbar">
          <a href="/" className="app-logo">
            <img
              src="/static/Users/images/brainz_logo.png"
              alt="Brainz Academy"
              style={{ height: '36px', width: 'auto' }}
            />
          </a>
          <div className="topbar-right">
            {isTeacher && mode === 'random' && (
              <button className="btn-back" onClick={handleChangeMode}>
                ← Change Mode
              </button>
            )}
            {isTeacher && (
              <a href="/teacher/"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.9)',
                  borderRadius: '100px', padding: '0.38rem 0.9rem',
                  textDecoration: 'none',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
                }}>
                ← Dashboard
              </a>
            )}
            <div className="user-chip">
              <span>👤</span>
              <span className={`role-badge ${isTeacher ? 'teacher' : 'student'}`}>
                {isTeacher ? 'Teacher' : 'Student'}
              </span>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="app-main">
          {!isTeacher ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6B7FA3' }}>
              Test builder is for teachers only.
            </div>

          ) : mode === null ? (
            /* ── Mode selector ── */
            <div className="mode-selector">
              <h2>🛠️ Test Builder</h2>
              <p>Choose how you want to build your question set.</p>
              <div className="mode-cards">
                <div
                  className={`mode-card ${!flags.random ? 'disabled' : ''}`}
                  onClick={() => flags.random && setMode('random')}>
                  <span className="mode-card-icon">🎲</span>
                  <div className="mode-card-title">Random / Filter</div>
                  <div className="mode-card-desc">
                    Set filters — subject, year, topic, difficulty — and let the
                    system pick questions automatically. Fast and great for mixed practice sets.
                  </div>
                  <span className="mode-card-badge">Quick Generate</span>
                </div>

                <div
                  className={`mode-card ${!flags.manual ? 'disabled' : ''}`}
                  onClick={() => flags.manual && setMode('manual')}>
                  <span className="mode-card-icon">✋</span>
                  <div className="mode-card-title">Manual Selection</div>
                  <div className="mode-card-desc">
                    Browse questions by theme and topic. Hand-pick exactly which
                    questions go in your test, preview each one before adding.
                  </div>
                  <span className="mode-card-badge">Full Control</span>
                </div>

                <div
                  className="mode-card my-tests"
                  onClick={() => setShowMyTests(true)}>
                  <span className="mode-card-icon">📂</span>
                  <div className="mode-card-title">My Tests</div>
                  <div className="mode-card-desc">
                    View, re-download, or continue editing your previously built tests.
                    Manual tests can be reopened in the builder.
                  </div>
                  <span className="mode-card-badge saved">Saved Tests</span>
                </div>
              </div>
            </div>

          ) : mode === 'random' ? (
            /* ── Random generator ── */
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
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="results-count">
                          ✓ {count} question{count !== 1 ? 's' : ''} found
                        </span>
                        <button
                          onClick={() => setShowMyTests(true)}
                          style={{
                            background: '#ffffff', border: '1.5px solid #C2D4EC',
                            color: '#6B7FA3', borderRadius: '100px',
                            padding: '0.25rem 0.7rem', fontSize: '0.75rem',
                            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                          📂 My Tests
                        </button>
                      </div>
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
            /* ── Manual builder ── */
            <BuilderLayout
              access={access}
              resumeTest={resumeTest}
              onChangeMode={handleChangeMode}
              onOpenMyTests={() => setShowMyTests(true)}
            />
          )}
        </main>
      </div>

      {/* ── My Tests modal (available from all modes) ── */}
      {showMyTests && (
        <MyTestsModal
          onClose={() => setShowMyTests(false)}
          onOpenTest={handleOpenTest}
        />
      )}
    </>
  );
}