import { useState } from "react";
import StepNav from "./StepNav";
import Step1Board from "./Step1Board";
import Step2Subject from "./Step2Subject";
import Step3Theme from "./Step3Theme";
import Step4Questions from "./Step4Questions";
import Step5Export from "./Step5Export";

const styles = `
  .builder-wrap { max-width: 1200px; margin: 0 auto; }

  .builder-title-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
  }
  .builder-title-input {
    background: transparent; border: none; border-bottom: 1px solid var(--border);
    color: var(--text); font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 1.3rem; outline: none; padding: 0.25rem 0; min-width: 280px;
    transition: border-color 0.2s;
  }
  .builder-title-input:focus { border-color: var(--accent); }
  .builder-title-input::placeholder { color: var(--muted); }

  .builder-meta {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  }
  .builder-meta-pill {
    font-size: 0.75rem; color: var(--muted-light);
    background: var(--deep); border: 1px solid var(--border);
    padding: 0.25rem 0.7rem; border-radius: 100px;
  }
  .builder-meta-pill span { color: var(--accent); font-weight: 700; }

  .saved-count-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.2);
    border-radius: 10px; padding: 0.65rem 1rem; margin-bottom: 1.25rem;
    flex-wrap: wrap; gap: 0.75rem;
  }
  .saved-count-bar-left { display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; color: var(--muted-light); }
  .saved-count-bar-left strong { color: var(--green); font-family: 'Syne', sans-serif; font-size: 1rem; }
  .btn-continue {
    background: var(--accent); color: var(--black); border: none; border-radius: 8px;
    padding: 0.5rem 1.2rem; font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
  }
  .btn-continue:hover { background: #c2e8ff; }
  .btn-continue:disabled { opacity: 0.4; cursor: not-allowed; }
`;

export default function BuilderLayout({ access }) {
  const [step, setStep]                   = useState(1);
  const [board, setBoard]                 = useState(null);    // {id, name, abbreviation}
  const [subject, setSubject]             = useState(null);    // {id, name}
  const [theme, setTheme]                 = useState(null);    // {id, name}
  const [savedQuestions, setSavedQuestions] = useState([]);    // [{...q, customMarks}]
  const [testTitle, setTestTitle]         = useState('');

  // Total marks across all saved questions
  const totalMarks = savedQuestions.reduce((sum, q) => sum + (q.customMarks ?? q.marks ?? 1), 0);

  const handleBoardSelect = (b) => { setBoard(b); setStep(2); };
  const handleSubjectSelect = (s) => { setSubject(s); setStep(3); };
  const handleThemeSelect = (t) => { setTheme(t); setStep(4); };

  const handleAddQuestion = (question) => {
    if (savedQuestions.find(q => q.id === question.id)) return; // already added
    setSavedQuestions(prev => [...prev, { ...question, customMarks: question.marks ?? 1 }]);
  };

  const handleRemoveQuestion = (id) => {
    setSavedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleUpdateMarks = (id, marks) => {
    setSavedQuestions(prev =>
      prev.map(q => q.id === id ? { ...q, customMarks: marks } : q)
    );
  };

  const handleReorder = (newOrder) => {
    setSavedQuestions(newOrder);
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  const stepLabels = ['Exam Board', 'Subject', 'Theme & Topic', 'Select Questions', 'Review & Export'];

  return (
    <>
      <style>{styles}</style>
      <div className="builder-wrap">

        {/* Title + meta */}
        <div className="builder-title-bar">
          <input
            className="builder-title-input"
            value={testTitle}
            onChange={e => setTestTitle(e.target.value)}
            placeholder="Name your test..."
          />
          <div className="builder-meta">
            {board    && <span className="builder-meta-pill">📋 {board.abbreviation}</span>}
            {subject  && <span className="builder-meta-pill">📚 {subject.name}</span>}
            {theme    && <span className="builder-meta-pill">🗂️ {theme.name}</span>}
          </div>
        </div>

        {/* Step nav */}
        <StepNav current={step} labels={stepLabels} onStepClick={setStep} maxReached={
          step === 1 ? 1 :
          step === 2 ? 2 :
          step === 3 ? 3 :
          step === 4 ? 4 : 5
        } />

        {/* Saved questions bar — shown on steps 3 & 4 */}
        {(step === 3 || step === 4) && savedQuestions.length > 0 && (
          <div className="saved-count-bar">
            <div className="saved-count-bar-left">
              ✅ <strong>{savedQuestions.length}</strong> question{savedQuestions.length !== 1 ? 's' : ''} saved
              &nbsp;·&nbsp; <strong style={{color:'var(--gold)'}}>{totalMarks}</strong> total marks
            </div>
            <button className="btn-continue" onClick={() => setStep(5)}>
              Review & Export →
            </button>
          </div>
        )}

        {/* Step content */}
        {step === 1 && (
          <Step1Board onSelect={handleBoardSelect} selected={board} />
        )}
        {step === 2 && (
          <Step2Subject
            board={board} onSelect={handleSubjectSelect}
            selected={subject} onBack={goBack}
          />
        )}
        {step === 3 && (
          <Step3Theme
            board={board} subject={subject}
            onSelect={handleThemeSelect} selected={theme}
            onBack={goBack} onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4Questions
            board={board} subject={subject} theme={theme}
            savedQuestions={savedQuestions}
            onAdd={handleAddQuestion} onRemove={handleRemoveQuestion}
            onBack={goBack} onDone={() => setStep(5)}
            onChangeTheme={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Step5Export
            savedQuestions={savedQuestions}
            testTitle={testTitle || 'My Test'}
            access={access}
            onUpdateMarks={handleUpdateMarks}
            onRemove={handleRemoveQuestion}
            onReorder={handleReorder}
            onBack={goBack}
          />
        )}
      </div>
    </>
  );
}