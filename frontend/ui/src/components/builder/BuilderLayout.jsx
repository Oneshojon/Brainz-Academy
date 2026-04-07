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
    padding: 0.75rem 1.25rem;            /* ← slightly less padding to reduce height/bulk */
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

  .builder-type-toggle {
    display: flex; gap: 0.25rem; background: #F3F6FA;
    border: 1.5px solid #C2D4EC; padding: 0.2rem; border-radius: 100px;
  }
  .builder-type-btn {
    padding: 0.3rem 0.85rem; border-radius: 100px; border: none;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.75rem;
    cursor: pointer; transition: all 0.15s;
  }
  .builder-type-btn.active { background: #0B2D72; color: #ffffff; }
  .builder-type-btn:not(.active) { background: transparent; color: #6B7FA3; }
  .builder-type-btn:not(.active):hover { color: #0B2D72; }

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
  .builder-copy-btn:hover { background: #EDF1F8; }
  .builder-copy-btn + .builder-copy-btn { border-top: 1px solid #C2D4EC; }
  .s5-copy-badge {
    font-size: 0.6rem; font-weight: 700; padding: 0.1rem 0.4rem;
    border-radius: 4px; text-transform: uppercase; flex-shrink: 0;
  }
  .s5-copy-badge.student { background: rgba(9,146,194,0.1); color: #0992C2; }
  .s5-copy-badge.teacher { background: #FEF3C7; color: #B8860B; }

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



export default function BuilderLayout({ access, onChangeMode }) {
  const [step, setStep]                     = useState(1);
  const [board, setBoard]                   = useState(null);
  const [subject, setSubject]               = useState(null);
  const [theme, setTheme]                   = useState(null);
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [testTitle, setTestTitle]           = useState('');
  const [qTypeFilter, setQTypeFilter]       = useState('');
  const [exportDropdown, setExportDropdown] = useState(null);


const isPopState = useRef(false);

// On mount
useEffect(() => {
  window.history.replaceState({ step: 1 }, '', window.location.pathname);
}, []);

// Push only on forward navigation
useEffect(() => {
  if (step > 1) {
    if (isPopState.current) {
      isPopState.current = false; // reset flag, don't push
    } else {
      window.history.pushState({ step }, '', window.location.pathname);
    }
  }
}, [step]);

// Handle browser back
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

  const totalMarks = savedQuestions.reduce((s, q) => s + (q.customMarks ?? q.marks ?? 1), 0);

  const handleBoardSelect   = (b) => { setBoard(b);   setStep(2); };
  const handleSubjectSelect = (s) => { setSubject(s); setStep(3); };
  const handleThemeSelect   = (t) => { setTheme(t);   setStep(4); };

  const handleAddQuestion    = (q) => {
    if (savedQuestions.find(s => s.id === q.id)) return;
    setSavedQuestions(p => [...p, { ...q, customMarks: q.marks ?? 1 }]);
  };
  const handleRemoveQuestion = (id)      => setSavedQuestions(p => p.filter(q => q.id !== id));
  const handleUpdateMarks    = (id, m)   => setSavedQuestions(p => p.map(q => q.id === id ? { ...q, customMarks: m } : q));
  const handleReorder        = (order)   => setSavedQuestions(order);
  const goBack               = ()        => setStep(s => Math.max(1, s - 1));

  const stepLabels = ['Exam Board', 'Subject', 'Theme & Topic', 'Select Questions', 'Review & Export'];

  const downloadFile = async (fmt, copyType) => {
    try {
      const res = await api.post('questions/download/', {
        question_ids: savedQuestions.map(q => q.id),
        title: testTitle || 'My Test', format: fmt, copy_type: copyType,
      }, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `${(testTitle || 'My_Test').replace(/\s+/g,'_')}_${copyType}.${fmt}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed. Please try again.'); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="builder-wrap">

        {/* Title bar */}
        <div className="builder-title-bar">

          {onChangeMode && (
              <button onClick={onChangeMode}
                style={{background:'#ffffff', border:'1.5px solid #C2D4EC', color:'#0B2D72',
                  borderRadius:'100px', padding:'0.4rem 1rem', fontFamily:'Plus Jakarta Sans, sans-serif',
                  fontWeight:700, fontSize:'0.8rem', cursor:'pointer', marginLeft:'auto'}}>
                ← Change Mode
              </button>
            )}
          <input className="builder-title-input" value={testTitle}
            onChange={e => setTestTitle(e.target.value)}
            placeholder="Name your test..." />

          {step >= 4 && (
            <div className="builder-type-toggle">
              {[['', 'All'], ['OBJ', 'OBJ'], ['THEORY', 'Theory']].map(([val, label]) => (
                <button key={val}
                  className={`builder-type-btn ${qTypeFilter === val ? 'active' : ''}`}
                  onClick={() => setQTypeFilter(val)}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="builder-meta" style={{marginLeft:'auto'}}>
            {board   && <span className="builder-meta-pill">📋 {board.abbreviation}</span>}
            {subject && <span className="builder-meta-pill">📚 {subject.name}</span>}
            {theme   && <span className="builder-meta-pill">🗂️ {theme.name}</span>}
          </div>
        </div>

        {/* Step nav + export */}
        {exportDropdown && <div style={{position:'fixed',inset:0,zIndex:99}} onClick={() => setExportDropdown(null)} />}
        <div className="builder-nav-row">
          <StepNav current={step} labels={stepLabels} onStepClick={setStep}
            maxReached={step} />

          {step === 5 && (
            <div className="builder-export-btns">
              <span className="builder-export-label">Export</span>
              <div style={{position:'relative',display:'inline-block'}}>
                <button className={`builder-fmt-btn ${exportDropdown === 'pdf' ? 'active-pdf' : ''}`}
                  disabled={savedQuestions.length === 0}
                  onClick={() => setExportDropdown(exportDropdown === 'pdf' ? null : 'pdf')}>
                  📄 PDF ▾
                </button>
                {exportDropdown === 'pdf' && (
                  <div className="builder-copy-dropdown">
                    <button className="builder-copy-btn" onClick={() => { downloadFile('pdf','student'); setExportDropdown(null); }}>
                    Questions only
                  </button>
                  <button className="builder-copy-btn" onClick={() => { downloadFile('pdf','teacher'); setExportDropdown(null); }}>
                    Mark scheme
                  </button>
                  </div>
                )}
              </div>
              <div style={{position:'relative',display:'inline-block'}}>
                <button className={`builder-fmt-btn ${exportDropdown === 'docx' ? 'active-docx' : ''}`}
                  disabled={savedQuestions.length === 0}
                  onClick={() => setExportDropdown(exportDropdown === 'docx' ? null : 'docx')}>
                  📝 Word ▾
                </button>
                {exportDropdown === 'docx' && (
                  <div className="builder-copy-dropdown">
                    <button className="builder-copy-btn" onClick={() => { downloadFile('docx','student'); setExportDropdown(null); }}>
                      Questions only
                    </button>
                    <button className="builder-copy-btn" onClick={() => { downloadFile('docx','teacher'); setExportDropdown(null); }}>
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
              &nbsp;·&nbsp; <strong style={{color:'#B8860B'}}>{totalMarks}</strong> total marks
            </div>
            <button className="btn-continue" onClick={() => setStep(5)}>
              Review & Export →
            </button>
          </div>
        )}

        {/* Steps */}
        {step === 1 && <Step1Board onSelect={handleBoardSelect} selected={board} />}
        {step === 2 && <Step2Subject board={board} onSelect={handleSubjectSelect} selected={subject} onBack={goBack} />}
        {step === 3 && <Step3Theme board={board} subject={subject} onSelect={handleThemeSelect} selected={theme} onBack={goBack} onNext={() => setStep(4)} />}
        {step === 4 && (
          <Step4Questions board={board} subject={subject} theme={theme}
            savedQuestions={savedQuestions} onAdd={handleAddQuestion} onRemove={handleRemoveQuestion}
            onBack={goBack} onDone={() => setStep(5)} questionType={qTypeFilter}
            onChangeTheme={() => setStep(3)} access={access} />
        )}
        {step === 5 && (
          <Step5Export savedQuestions={savedQuestions} testTitle={testTitle || 'My Test'}
            access={access} onUpdateMarks={handleUpdateMarks} onRemove={handleRemoveQuestion}
            onReorder={handleReorder} onBack={goBack} qTypeFilter={qTypeFilter}
            onQTypeFilter={setQTypeFilter}
            onNewTest={() => { setStep(1); setBoard(null); setSubject(null); setTheme(null); setSavedQuestions([]); setTestTitle(''); }} />
        )}
      </div>
    </>
  );
}