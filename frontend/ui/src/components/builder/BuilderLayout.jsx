import api from "../../api";
import StepNav from "./StepNav";
import Step1Board from "./Step1Board";
import Step2Subject from "./Step2Subject";
import Step3Theme from "./Step3Theme";
import Step4Questions from "./Step4Questions";
import Step5Export from "./Step5Export";
import { useState, useEffect, useRef } from "react";

const styles = `
  @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap");

.builder-wrap {
    max-width: 1200px; margin: 0 auto;   
    font-family: 'Inter', sans-serif;
  }

  /* ── Title bar ── */
  .builder-title-bar {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    background: #ffffff; border: 1.5px solid #C2D4EC; border-radius: 14px;
    padding: 0.75rem 1.25rem;
    box-shadow: 0 2px 10px rgba(11,45,114,0.07);
  }
  .builder-title-input {
    background: transparent; border: none; border-bottom: 1.5px solid #C2D4EC;
    color: #0D1B3E; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    font-size: 1.2rem; outline: none; padding: 0.25rem 0; min-width: 260px;
    transition: border-color 0.2s;
  }
  .builder-title-input:focus { border-color: #0992C2; }
  .builder-title-input::placeholder { color: #6B7FA3; }

  .builder-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .builder-meta-pill {
    font-size: 0.75rem; color: #6B7FA3;
    background: #EDF1F8; border: 1.5px solid #C2D4EC;
    padding: 0.2rem 0.65rem; border-radius: 100px; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .builder-meta-pill span { color: #0992C2; font-weight: 700; }

  /* ── Saved bar ── */
  .saved-count-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: #DCFCE7; border: 1px solid rgba(21,128,61,0.25);
    border-radius: 10px; padding: 0.65rem 1rem; margin-bottom: 1.25rem;
    flex-wrap: wrap; gap: 0.75rem;
  }
  .saved-count-bar-left { display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; color: #6B7FA3; }
  .saved-count-bar-left strong { color: #15803D; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1rem; }

  .btn-continue {
    background: #0B2D72; color: #ffffff; border: none; border-radius: 100px;
    padding: 0.5rem 1.2rem; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    font-size: 0.82rem; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 4px 12px rgba(11,45,114,0.2);
  }
  .btn-continue:hover { background: #0a2360; }
  .btn-continue:active { transform: scale(0.97); }
  .btn-continue:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── Nav row with export ── */
  .builder-nav-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
  .builder-nav-row .step-nav { flex: 1; margin-bottom: 0; }
  .builder-export-btns { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
  .builder-export-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #6B7FA3; }

  .builder-fmt-btn {
    padding: 0.4rem 0.85rem; border-radius: 100px; border: 1.5px solid #C2D4EC;
    background: #ffffff; color: #0D1B3E;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.75rem;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
    display: inline-flex; align-items: center; gap: 0.3rem;
    box-shadow: 0 1px 3px rgba(11,45,114,0.06);
  }
  .builder-fmt-btn:hover:not(:disabled) { border-color: #0B2D72; color: #0B2D72; }
  .builder-fmt-btn.active-pdf  { border-color: #0992C2; color: #0992C2; background: rgba(9,146,194,0.08); }
  .builder-fmt-btn.active-docx { border-color: #B8860B; color: #B8860B; background: #FEF3C7; }
  .builder-fmt-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .builder-copy-dropdown {
    position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
    min-width: 210px; background: #ffffff; border: 1.5px solid #C2D4EC;
    border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(11,45,114,0.15);
  }
  .builder-copy-btn {
    width: 100%; padding: 0.6rem 0.9rem; background: transparent; border: none;
    color: #0D1B3E; font-family: 'Inter', sans-serif; font-size: 0.82rem;
    cursor: pointer; text-align: left; transition: background 0.12s;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .builder-copy-btn:hover:not(:disabled) { background: #EDF1F8; }
  .builder-copy-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .builder-copy-btn + .builder-copy-btn { border-top: 1px solid #C2D4EC; }

  /* ── Download spinner ── */
  .bl-spinner {
    display: inline-block; width: 10px; height: 10px;
    border: 2px solid rgba(11,45,114,0.2); border-top-color: #0B2D72;
    border-radius: 50%; animation: bl-spin 0.6s linear infinite; flex-shrink: 0;
  }
  @keyframes bl-spin { to { transform: rotate(360deg); } }

  /* ── Shared step styles ── */
  .step-section-title {
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.1rem;
    color: #0B2D72; margin-bottom: 0.4rem;
  }
  .step-section-sub { font-size: 0.85rem; color: #6B7FA3; margin-bottom: 1.5rem; line-height: 1.6; }

  .btn-back-sm {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: #ffffff; border: 1.5px solid #C2D4EC; color: #6B7FA3;
    border-radius: 100px; padding: 0.38rem 0.9rem; font-size: 0.8rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s; margin-bottom: 1.25rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 1px 3px rgba(11,45,114,0.06);
  }
  .btn-back-sm:hover { color: #0B2D72; border-color: #0B2D72; }
  .btn-back-sm:active { transform: scale(0.97); }
`;

export default function BuilderLayout({ access, onChangeMode, onOpenMyTests, resumeTest }) {
  // If resumeTest is provided (teacher opened a test from My Tests),
  // pre-populate state and jump straight to Step 5.
  const [step, setStep]                     = useState(resumeTest ? 5 : 1);
  const [board, setBoard]                   = useState(null);
  const [subject, setSubject]               = useState(null);
  const [theme, setTheme]                   = useState(null);
  const [savedQuestions, setSavedQuestions] = useState(
    resumeTest ? resumeTest.questions : []
  );
  const [testTitle, setTestTitle]           = useState(resumeTest?.title ?? '');
  const [qTypeFilter, setQTypeFilter]       = useState('');
  const [exportDropdown, setExportDropdown] = useState(null);
  const [downloading, setDownloading]       = useState(null);

  // Initialise with the resumed test's ID so re-downloads update in place
  const [savedTestId, setSavedTestId]       = useState(resumeTest?.savedTestId ?? null);

  const isPopState = useRef(false);

  // ── Browser history ────────────────────────────────────────────────────────
  useEffect(() => {
    window.history.replaceState({ step: 1 }, '', window.location.pathname);
  }, []);

  useEffect(() => {
    if (step > 1) {
      if (isPopState.current) {
        isPopState.current = false;
      } else {
        window.history.pushState({ step }, '', window.location.pathname);
      }
    }
  }, [step]);

  useEffect(() => {
    const handlePop = (e) => {
      const prevStep = e.state?.step;
      if (prevStep && prevStep >= 1) {
        isPopState.current = true;
        setStep(prevStep);
      } else {
        onChangeMode?.();
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onChangeMode]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalMarks = savedQuestions.reduce((s, q) => s + (q.customMarks ?? q.marks ?? 1), 0);

  // ── Question management ────────────────────────────────────────────────────
  const handleBoardSelect    = (b) => { setBoard(b);   setStep(2); };
  const handleSubjectSelect  = (s) => { setSubject(s); setStep(3); };
  const handleThemeSelect    = (t) => { setTheme(t);   setStep(4); };
  const handleAddQuestion    = (q) => {
    if (savedQuestions.find(s => s.id === q.id)) return;
    setSavedQuestions(p => [...p, { ...q, customMarks: q.marks ?? 1 }]);
  };
  const handleRemoveQuestion = (id)    => setSavedQuestions(p => p.filter(q => q.id !== id));
  const handleUpdateMarks    = (id, m) => setSavedQuestions(p => p.map(q => q.id === id ? { ...q, customMarks: m } : q));
  const handleReorder        = (order) => setSavedQuestions(order);
  const goBack               = ()      => setStep(s => Math.max(1, s - 1));

  const stepLabels = ['Exam Board', 'Subject', 'Theme & Topic', 'Select Questions', 'Review & Export'];

  // ── Download ───────────────────────────────────────────────────────────────
  const downloadFile = async (fmt, copyType) => {
    const key = `${fmt}-${copyType}`;
    setDownloading(key);
    setExportDropdown(null);

    // Build custom_marks map: { "<question_id>": marks }
    const customMarksMap = {};
    savedQuestions.forEach(q => {
      customMarksMap[String(q.id)] = q.customMarks ?? q.marks ?? 1;
    });

    try {
      const res = await api.post(
        'questions/download/',
        {
          question_ids:  savedQuestions.map(q => q.id),
          title:         testTitle || 'My Test',
          format:        fmt,
          copy_type:     copyType,
          builder_mode:  'manual',
          custom_marks:  customMarksMap,
          total_marks:   totalMarks,
          saved_test_id: savedTestId ?? null,  // null = create new, int = update existing
        },
        { responseType: 'blob' }
      );

      // Capture the SavedTest PK from response header for future downloads
      const returnedId = res.headers?.['x-saved-test-id'];
      if (returnedId) setSavedTestId(Number(returnedId));

      // Trigger file download in browser
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `${(testTitle || 'My_Test').replace(/\s+/g, '_')}_${copyType}.${fmt}`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      // Try to parse error message from blob response
      try {
        const text = await err.response?.data?.text?.();
        const parsed = JSON.parse(text || '{}');
        alert(parsed.error || 'Download failed. Please try again.');
      } catch {
        alert('Download failed. Please try again.');
      }
    } finally {
      setDownloading(null);
    }
  };

  // Reset savedTestId when starting a completely new test
  const handleNewTest = () => {
    setStep(1);
    setBoard(null);
    setSubject(null);
    setTheme(null);
    setSavedQuestions([]);
    setTestTitle('');
    setSavedTestId(null);  // ← next download will create a fresh record
  };

  const anyDownloading = !!downloading;

  return (
    <>
      <style>{styles}</style>
      <div className="builder-wrap">

        {/* Title bar */}
        <div className="builder-title-bar">

          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
            <img src={window.LOGO_URL} alt="BrainzAcademy" style={{ height: '36px', width: 'auto' }} />
          </a>

          {/* Test title input */}
          <input className="builder-title-input" value={testTitle}
            onChange={e => setTestTitle(e.target.value)}
            placeholder="Name your test..." />

          {/* Selection pills + Change Mode pushed to the right */}
          <div className="builder-meta" style={{ marginLeft: 'auto' }}>
            {board   && <span className="builder-meta-pill">📋 {board.abbreviation}</span>}
            {subject && <span className="builder-meta-pill">📚 {subject.name}</span>}
            {theme   && <span className="builder-meta-pill">🗂️ {theme.name}</span>}
          </div>

          {onChangeMode && (
            <button onClick={onChangeMode} style={{
              background: '#ffffff', border: '1.5px solid #C2D4EC', color: '#0B2D72',
              borderRadius: '100px', padding: '0.4rem 1rem',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0,
            }}>
              ← Change Mode
            </button>
          )}

        </div>

        {/* Step nav + export */}
        {exportDropdown && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setExportDropdown(null)} />
        )}
        <div className="builder-nav-row">
          <StepNav current={step} labels={stepLabels} onStepClick={setStep} maxReached={step} />

          {step === 5 && (
            <div className="builder-export-btns">
              <span className="builder-export-label">Export</span>

              {/* PDF dropdown */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  className={`builder-fmt-btn ${exportDropdown === 'pdf' ? 'active-pdf' : ''}`}
                  disabled={savedQuestions.length === 0 || anyDownloading}
                  onClick={() => setExportDropdown(exportDropdown === 'pdf' ? null : 'pdf')}>
                  {(downloading === 'pdf-student' || downloading === 'pdf-teacher')
                    ? <span className="bl-spinner" />
                    : '📄'} PDF ▾
                </button>
                {exportDropdown === 'pdf' && (
                  <div className="builder-copy-dropdown">
                    <button className="builder-copy-btn"
                      disabled={anyDownloading}
                      onClick={() => downloadFile('pdf', 'student')}>
                      {downloading === 'pdf-student' ? <span className="bl-spinner" /> : '📄'}
                      Questions only
                    </button>
                    <button className="builder-copy-btn"
                      disabled={anyDownloading}
                      onClick={() => downloadFile('pdf', 'teacher')}>
                      {downloading === 'pdf-teacher' ? <span className="bl-spinner" /> : '📄'}
                      Mark scheme
                    </button>
                  </div>
                )}
              </div>

              {/* Word dropdown */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  className={`builder-fmt-btn ${exportDropdown === 'docx' ? 'active-docx' : ''}`}
                  disabled={savedQuestions.length === 0 || anyDownloading}
                  onClick={() => setExportDropdown(exportDropdown === 'docx' ? null : 'docx')}>
                  {(downloading === 'docx-student' || downloading === 'docx-teacher')
                    ? <span className="bl-spinner" />
                    : '📝'} Word ▾
                </button>
                {exportDropdown === 'docx' && (
                  <div className="builder-copy-dropdown">
                    <button className="builder-copy-btn"
                      disabled={anyDownloading}
                      onClick={() => downloadFile('docx', 'student')}>
                      {downloading === 'docx-student' ? <span className="bl-spinner" /> : '📝'}
                      Questions only
                    </button>
                    <button className="builder-copy-btn"
                      disabled={anyDownloading}
                      onClick={() => downloadFile('docx', 'teacher')}>
                      {downloading === 'docx-teacher' ? <span className="bl-spinner" /> : '📝'}
                      Mark scheme
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Saved questions bar */}
        {(step === 3 || step === 4) && savedQuestions.length > 0 && (
          <div className="saved-count-bar">
            <div className="saved-count-bar-left">
              ✅ <strong>{savedQuestions.length}</strong> question{savedQuestions.length !== 1 ? 's' : ''}
              &nbsp;·&nbsp; <strong style={{ color: '#B8860B' }}>{totalMarks}</strong> total marks
            </div>
            <button className="btn-continue" onClick={() => setStep(5)}>
              Review & Export →
            </button>
          </div>
        )}

        {/* Steps */}
        {step === 1 && <Step1Board onSelect={handleBoardSelect} selected={board} access={access} />}
        {step === 2 && <Step2Subject board={board} onSelect={handleSubjectSelect} selected={subject} onBack={goBack} />}
        {step === 3 && <Step3Theme board={board} subject={subject} onSelect={handleThemeSelect} selected={theme} onBack={goBack} onNext={() => setStep(4)} />}
        {step === 4 && (
          <Step4Questions board={board} subject={subject} theme={theme}
            qTypeFilter={qTypeFilter}
            onQTypeFilter={setQTypeFilter}
            savedQuestions={savedQuestions} onAdd={handleAddQuestion} onRemove={handleRemoveQuestion}
            onBack={goBack} onDone={() => setStep(5)} questionType={qTypeFilter}
            onChangeTheme={() => setStep(3)} access={access} />
        )}
        {step === 5 && (
          <Step5Export
            savedQuestions={savedQuestions} testTitle={testTitle || 'My Test'}
            access={access} onUpdateMarks={handleUpdateMarks} onRemove={handleRemoveQuestion}
            onReorder={handleReorder} onBack={goBack} qTypeFilter={qTypeFilter}
            onQTypeFilter={setQTypeFilter}
            downloading={downloading}
            onDownload={downloadFile}
            onOpenMyTests={onOpenMyTests}
            onNewTest={handleNewTest} />
        )}
      </div>
    </>
  );
}