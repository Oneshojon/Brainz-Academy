import { useEffect, useState } from "react";
import api from "../api";

const SITTINGS = [
  { value: "", label: "All Sittings" },
  { value: "MAY_JUNE", label: "May/June" },
  { value: "NOV_DEC", label: "Nov/Dec" },
  { value: "MOCK", label: "Mock" },
  { value: "OTHER", label: "Other" },
];

const DIFFICULTIES = [
  { value: "", label: "Any Difficulty" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const QUESTION_TYPES = [
  { value: "", label: "Both (OBJ + Theory)" },
  { value: "OBJ", label: "Objective Only" },
  { value: "THEORY", label: "Theory Only" },
];

const formStyles = `
  .gen-form {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.75rem;
  }

  .form-head {
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .form-head h2 {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 1.1rem; letter-spacing: -0.3px;
    margin-bottom: 0.25rem;
  }
  .form-head p { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }

  .form-section {
    margin-bottom: 1.25rem;
  }
  .form-section-label {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .form-section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  .form-group { margin-bottom: 0.75rem; }
  .form-label {
    display: block; font-size: 0.78rem; font-weight: 500;
    color: var(--muted-light); margin-bottom: 0.35rem;
  }
  .form-label .hint {
    font-weight: 400; font-style: italic; color: var(--muted);
  }

  .form-select, .form-input {
    width: 100%;
    background: var(--deep); border: 1px solid var(--border);
    color: var(--text); padding: 0.6rem 0.85rem;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; transition: border-color 0.2s, box-shadow 0.2s;
    outline: none; appearance: none;
  }
  .form-select:focus, .form-input:focus {
    border-color: rgba(156,213,255,0.45);
    box-shadow: 0 0 0 3px rgba(156,213,255,0.08);
  }
  .form-select option { background: #1e3347; }

  .multi-select-wrapper {
    position: relative;
  }
  .multi-select {
    width: 100%;
    background: var(--deep); border: 1px solid var(--border);
    color: var(--text); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
    outline: none; transition: border-color 0.2s;
    min-height: 90px;
    padding: 0.35rem;
  }
  .multi-select:focus { border-color: rgba(156,213,255,0.45); }
  .multi-select option {
    background: var(--deep); padding: 0.4rem 0.6rem;
    border-radius: 4px; cursor: pointer;
  }
  .multi-select option:checked {
    background: rgba(156,213,255,0.15);
    color: var(--accent);
  }
  .multi-select:disabled { opacity: 0.4; cursor: not-allowed; }
  .select-hint {
    font-size: 0.7rem; color: var(--muted); margin-top: 0.3rem;
    font-style: italic;
  }

  .selected-tags {
    display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem;
  }
  .selected-tag {
    background: var(--accent-dim); border: 1px solid rgba(156,213,255,0.25);
    color: var(--accent); font-size: 0.72rem; font-weight: 600;
    padding: 0.2rem 0.6rem; border-radius: 100px;
    display: flex; align-items: center; gap: 0.3rem;
  }
  .selected-tag button {
    background: none; border: none; color: var(--accent);
    cursor: pointer; font-size: 0.8rem; padding: 0; line-height: 1;
  }

  .num-row {
    display: flex; gap: 0.5rem; align-items: center;
  }
  .num-row .form-input {
    width: 80px; text-align: center;
  }
  .quick-nums {
    display: flex; gap: 0.4rem; flex-wrap: wrap;
  }
  .quick-num {
    background: var(--deep); border: 1px solid var(--border);
    color: var(--muted-light); font-size: 0.78rem; font-weight: 600;
    padding: 0.35rem 0.7rem; border-radius: 6px; cursor: pointer;
    transition: all 0.15s; font-family: 'DM Sans', sans-serif;
  }
  .quick-num:hover, .quick-num.active {
    background: var(--accent-dim); border-color: rgba(156,213,255,0.3);
    color: var(--accent);
  }

  .type-toggle {
    display: flex; gap: 0.375rem;
  }
  .type-btn {
    flex: 1; padding: 0.55rem 0.5rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep);
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    text-align: center;
  }
  .type-btn.active { background: var(--accent-dim); border-color: rgba(156,213,255,0.3); color: var(--accent); }
  .type-btn:hover:not(.active) { color: var(--text); border-color: var(--border-hover); }

  .diff-toggle {
    display: flex; gap: 0.375rem;
  }
  .diff-btn {
    flex: 1; padding: 0.5rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep);
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    text-align: center;
  }
  .diff-btn.easy.active { background: var(--accent-dim); border-color: rgba(156,213,255,0.3); color: var(--accent); }
  .diff-btn.medium.active { background: rgba(245,200,66,0.12); border-color: rgba(245,200,66,0.3); color: var(--gold); }
  .diff-btn.hard.active { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.3); color: var(--red); }
  .diff-btn:hover:not(.active) { color: var(--text); border-color: var(--border-hover); }

  .form-error {
    background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2);
    color: var(--red); font-size: 0.825rem; padding: 0.7rem 1rem;
    border-radius: 8px; margin-bottom: 1rem;
  }

  .submit-btn {
    width: 100%; padding: 0.85rem;
    background: var(--accent); color: var(--black);
    border: none; border-radius: 10px;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem;
    cursor: pointer; transition: all 0.25s;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .submit-btn:hover:not(:disabled) {
    background: #c2e8ff;
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(156,213,255,0.2);
  }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .clear-btn {
    width: 100%; padding: 0.6rem;
    background: transparent; color: var(--muted);
    border: 1px solid var(--border); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 0.825rem;
    cursor: pointer; transition: all 0.2s; margin-top: 0.6rem;
  }
  .clear-btn:hover { color: var(--text); border-color: var(--border-hover); }

  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(14,31,44,0.3);
    border-top-color: var(--black); border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function QuestionGeneratorForm({ onResults, onClear }) {
  const [subjects, setSubjects] = useState([]);
  const [examBoards, setExamBoards] = useState([]);
  const [topics, setTopics] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const [form, setForm] = useState({
    subject: "",
    exam_board: "",
    years: [],
    sitting: "",
    question_type: "",
    topics: [],
    difficulty: "",
    num_questions: 20,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("subjects/")
      .then((res) => setSubjects(res.data))
      .catch(() => {});
    api
      .get("exam-boards/")
      .then((res) => setExamBoards(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.subject) {
      api
        .get(`topics/?subject=${form.subject}`)
        .then((res) => setTopics(res.data))
        .catch(() => {});
    } else {
      setTopics([]);
      setForm((f) => ({ ...f, topics: [] }));
    }
  }, [form.subject]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (form.subject) params.set("subject", form.subject);
    if (form.exam_board) params.set("exam_board", form.exam_board);
    if (form.subject || form.exam_board) {
      api
        .get(`years/?${params}`)
        .then((res) => setAvailableYears(res.data.years))
        .catch(() => {});
    } else {
      setAvailableYears([]);
      setForm((f) => ({ ...f, years: [] }));
    }
  }, [form.subject, form.exam_board]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleMulti = (key, val) => {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      };
    });
  };

  const getLabel = (arr, id) => arr.find((i) => String(i.id) === String(id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject) {
      setError("Please select a subject.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("questions/generate/", {
        ...form,
        years: form.years.map(Number),
        topics: form.topics.map(Number),
        num_questions: Number(form.num_questions),
      });
      onResults(res.data);
    } catch (err) {
      const msg =
        err.response?.status === 403
          ? "Access denied. Make sure you are logged in as a teacher."
          : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm({
      subject: "",
      exam_board: "",
      years: [],
      sitting: "",
      question_type: "",
      topics: [],
      difficulty: "",
      num_questions: 20,
    });
    onClear();
  };

  const QUICK_NUMS = [10, 20, 30, 50];

  return (
    <>
      <style>{formStyles}</style>
      <form className="gen-form" onSubmit={handleSubmit}>
        <div className="form-head">
          <h2>🛠️ Question Builder</h2>
          <p>Filter and generate a custom question set for your class.</p>
        </div>

        {/* Exam context */}
        <div className="form-section">
          <div className="form-section-label">Exam Context</div>

          <div className="form-group">
            <label className="form-label">
              Subject <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <select
              className="form-select"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
            >
              <option value="">— Select Subject —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Exam Board</label>
            <select
              className="form-select"
              value={form.exam_board}
              onChange={(e) => set("exam_board", e.target.value)}
            >
              <option value="">— Any Board —</option>
              {examBoards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.abbreviation})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sitting</label>
            <select
              className="form-select"
              value={form.sitting}
              onChange={(e) => set("sitting", e.target.value)}
            >
              {SITTINGS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Years */}
        <div className="form-section">
          <div className="form-section-label">Years</div>
          <div className="form-group">
            <label className="form-label">
              Select Years <span className="hint">(click to toggle)</span>
            </label>
            {availableYears.length === 0 ? (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontStyle: "italic",
                }}
              >
                {form.subject || form.exam_board
                  ? "No years found for selection."
                  : "Select a subject or exam board first."}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  marginTop: "0.25rem",
                }}
              >
                {availableYears.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={`quick-num ${form.years.includes(String(y)) ? "active" : ""}`}
                    onClick={() => toggleMulti("years", String(y))}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
            {form.years.length > 0 && (
              <div className="selected-tags" style={{ marginTop: "0.6rem" }}>
                {form.years.map((y) => (
                  <span key={y} className="selected-tag">
                    {y}
                    <button
                      type="button"
                      onClick={() => toggleMulti("years", y)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Topics */}
        <div className="form-section">
          <div className="form-section-label">Topics</div>
          <div className="form-group">
            <label className="form-label">
              Filter by Topics <span className="hint">(optional)</span>
            </label>
            {topics.length === 0 ? (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontStyle: "italic",
                }}
              >
                {form.subject
                  ? "No topics found for this subject."
                  : "Select a subject to see topics."}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  maxHeight: "180px",
                  overflowY: "auto",
                  padding: "0.25rem",
                }}
              >
                {topics.map((t) => (
                  <label
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      cursor: "pointer",
                      padding: "0.3rem 0.5rem",
                      borderRadius: "6px",
                      transition: "background 0.15s",
                      background: form.topics.includes(String(t.id))
                        ? "var(--accent-dim)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.topics.includes(String(t.id))}
                      onChange={() => toggleMulti("topics", String(t.id))}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: form.topics.includes(String(t.id))
                          ? "var(--accent)"
                          : "var(--text)",
                      }}
                    >
                      {t.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {form.topics.length > 0 && (
              <div className="selected-tags">
                {form.topics.map((id) => {
                  const t = getLabel(topics, id);
                  return t ? (
                    <span key={id} className="selected-tag">
                      {t.name}
                      <button
                        type="button"
                        onClick={() => toggleMulti("topics", id)}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Question settings */}
        <div className="form-section">
          <div className="form-section-label">Question Settings</div>

          <div className="form-group">
            <label className="form-label">Question Type</label>
            <div className="type-toggle">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-btn ${form.question_type === t.value ? "active" : ""}`}
                  onClick={() => set("question_type", t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <div className="diff-toggle">
              <button
                type="button"
                className={`diff-btn ${form.difficulty === "" ? "active easy" : ""}`}
                onClick={() => set("difficulty", "")}
              >
                Any
              </button>
              <button
                type="button"
                className={`diff-btn easy ${form.difficulty === "EASY" ? "active" : ""}`}
                onClick={() => set("difficulty", "EASY")}
              >
                Easy
              </button>
              <button
                type="button"
                className={`diff-btn medium ${form.difficulty === "MEDIUM" ? "active" : ""}`}
                onClick={() => set("difficulty", "MEDIUM")}
              >
                Medium
              </button>
              <button
                type="button"
                className={`diff-btn hard ${form.difficulty === "HARD" ? "active" : ""}`}
                onClick={() => set("difficulty", "HARD")}
              >
                Hard
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Number of Questions</label>
            <div className="quick-nums" style={{ marginBottom: "0.5rem" }}>
              {QUICK_NUMS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`quick-num ${form.num_questions === n ? "active" : ""}`}
                  onClick={() => set("num_questions", n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="form-input"
              value={form.num_questions}
              onChange={(e) => set("num_questions", Number(e.target.value))}
              min={1}
              max={200}
              style={{ width: "100px" }}
            />
          </div>
        </div>

        {error && <div className="form-error">⚠️ {error}</div>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner"></div> Generating...
            </>
          ) : (
            <>Generate Questions →</>
          )}
        </button>
        <button type="button" className="clear-btn" onClick={handleClear}>
          Clear All
        </button>
      </form>
    </>
  );
}
