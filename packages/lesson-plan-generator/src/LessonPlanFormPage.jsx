import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiMutation, invalidateResource } from '@brainz/shared-ui';
import { createLessonPlan, listSubjects } from './api';
import { CURRICULUM_CHOICES, CLASS_LEVEL_CHOICES_BY_CURRICULUM, ABILITY_CHOICES } from './constants';

export default function LessonPlanFormPage() {
  const navigate = useNavigate();
  const { mutate: submitPlan, loading: submitting, error: submitError } = useApiMutation(createLessonPlan);

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);

  const [form, setForm] = useState({
    subject: '',
    curriculum: 'NIGERIAN',
    class_level: '',
    coverage: '',
    duration_minutes: 40,
    class_size: '',
    student_ability: 'MIXED',
    additional_notes: '',
    school_name: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    listSubjects(controller.signal)
      .then((data) => setSubjects(data))
      .catch((err) => { if (err?.name !== 'AbortError') setSubjectsError(err); })
      .finally(() => setSubjectsLoading(false));
    return () => controller.abort();
  }, []);

  const classLevelOptions = CLASS_LEVEL_CHOICES_BY_CURRICULUM[form.curriculum] ?? [];

  const handleCurriculumChange = (e) => {
    const curriculum = e.target.value;
    setForm((f) => ({
      ...f,
      curriculum,
      // Reset class_level only if it doesn't belong to the newly-selected
      // curriculum's list — e.g. switching NIGERIAN -> IGCSE while SS2 was
      // selected must not silently submit an SS2/IGCSE combination.
      class_level: (CLASS_LEVEL_CHOICES_BY_CURRICULUM[curriculum] ?? []).some((c) => c.value === f.class_level)
        ? f.class_level
        : '',
    }));
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const fieldError = (field) => submitError?.fieldErrors?.[field]?.[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        subject: form.subject ? Number(form.subject) : undefined,
        duration_minutes: Number(form.duration_minutes),
        class_size: form.class_size ? Number(form.class_size) : undefined,
      };
      const plan = await submitPlan(payload);
      invalidateResource('lesson-plans');
      // relative: 'path' — same mount-depth-independence reasoning as the
      // Link fixes in LessonPlanListPage/LessonPlanDetailPage. Current URL
      // here is ".../lesson-plans/new"; this strips "new" and appends the
      // new plan's id, landing on ".../lesson-plans/<id>" regardless of
      // how deep this package is mounted in the host app.
      navigate(`${plan.id}`, { relative: 'path' });
    } catch {
      // submitError from useApiMutation already holds the ApiError for the banner/field errors below.
    }
  };

  return (
    <div className="lp-page">
      <div className="lp-page-header">
        <h1 className="lp-page-title">New Lesson Plan</h1>
      </div>

      {submitError && !submitError.fieldErrors && (
        <div className="lp-error-banner">{submitError.message}</div>
      )}

      <form className="lp-form" onSubmit={handleSubmit}>
        <div className="lp-field">
          <label className="lp-label" htmlFor="lp-subject">Subject</label>
          {subjectsLoading ? (
            <div className="lp-inline-hint">Loading subjects…</div>
          ) : subjectsError ? (
            <div className="lp-inline-hint lp-inline-hint-error">Could not load subjects — refresh to try again.</div>
          ) : (
            <select
              id="lp-subject"
              className="lp-input"
              value={form.subject}
              onChange={handleChange('subject')}
              required
            >
              <option value="" disabled>Select a subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {fieldError('subject') && <div className="lp-field-error">{fieldError('subject')}</div>}
        </div>

        <div className="lp-field-row">
          <div className="lp-field">
            <label className="lp-label" htmlFor="lp-curriculum">Curriculum</label>
            <select id="lp-curriculum" className="lp-input" value={form.curriculum} onChange={handleCurriculumChange}>
              {CURRICULUM_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="lp-class-level">Class level</label>
            <select
              id="lp-class-level"
              className="lp-input"
              value={form.class_level}
              onChange={handleChange('class_level')}
              required
            >
              <option value="" disabled>Select…</option>
              {classLevelOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {fieldError('class_level') && <div className="lp-field-error">{fieldError('class_level')}</div>}
          </div>
        </div>

        <div className="lp-field">
          <label className="lp-label" htmlFor="lp-coverage">What does this lesson cover?</label>
          <textarea
            id="lp-coverage"
            className="lp-input lp-textarea"
            value={form.coverage}
            onChange={handleChange('coverage')}
            placeholder="e.g. Hooke's Law and simple harmonic motion basics"
            rows={3}
            required
          />
          {fieldError('coverage') && <div className="lp-field-error">{fieldError('coverage')}</div>}
        </div>

        <div className="lp-field-row">
          <div className="lp-field">
            <label className="lp-label" htmlFor="lp-duration">Duration (minutes)</label>
            <input
              id="lp-duration"
              type="number"
              className="lp-input"
              min={1}
              max={300}
              value={form.duration_minutes}
              onChange={handleChange('duration_minutes')}
              required
            />
            {fieldError('duration_minutes') && <div className="lp-field-error">{fieldError('duration_minutes')}</div>}
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="lp-class-size">Class size (optional)</label>
            <input
              id="lp-class-size"
              type="number"
              className="lp-input"
              min={1}
              value={form.class_size}
              onChange={handleChange('class_size')}
            />
          </div>
        </div>

        <div className="lp-field">
          <label className="lp-label" htmlFor="lp-ability">Student ability</label>
          <select id="lp-ability" className="lp-input" value={form.student_ability} onChange={handleChange('student_ability')}>
            {ABILITY_CHOICES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div className="lp-field">
          <label className="lp-label" htmlFor="lp-notes">Additional context (optional)</label>
          <textarea
            id="lp-notes"
            className="lp-input lp-textarea"
            value={form.additional_notes}
            onChange={handleChange('additional_notes')}
            placeholder="Resources on hand, prior lesson, exam focus, etc."
            rows={2}
          />
        </div>

        <div className="lp-field">
          <label className="lp-label" htmlFor="lp-school">School name (optional)</label>
          <input
            id="lp-school"
            type="text"
            className="lp-input"
            value={form.school_name}
            onChange={handleChange('school_name')}
            placeholder="Defaults to your school, or 'Brainz Academy' if left blank"
          />
        </div>

        <button type="submit" className="lp-btn lp-btn-primary lp-btn-block" disabled={submitting}>
          {submitting ? (<><span className="lp-spinner" /> Creating…</>) : 'Create Draft'}
        </button>
      </form>
    </div>
  );
}