import { Link } from 'react-router-dom';
import { useApiResource } from '@brainz/shared-ui';
import { listLessonPlans } from './api';

// `relative="path"` (below) makes these links resolve against the actual
// browser URL rather than the abstract route-config depth — the one
// unambiguous way to keep "new" correct whether this package is mounted
// at /tools/lesson-plans/ (frontend/ui) or nested deeper under
// /school-plan/portal/teacher/lesson-plans/ (schools/ui). See
// LessonPlansLayout's docstring for the fuller version of this gotcha.

const CURRICULUM_LABELS = { NIGERIAN: 'Nigerian', IGCSE: 'IGCSE' };

export default function LessonPlanListPage() {
  const { data: plans, loading, error, refetch } = useApiResource('lesson-plans', listLessonPlans);

  return (
    <div className="lp-page">
      <div className="lp-page-header">
        <h1 className="lp-page-title">Lesson Plan Generator</h1>
        <Link to="new" relative="path" className="lp-btn lp-btn-primary">+ New Plan</Link>
      </div>

      {loading && <div className="lp-loading">Loading your lesson plans…</div>}

      {error && (
        <div className="lp-error-banner">
          {error.message}
          <button className="lp-btn lp-btn-ghost" onClick={refetch}>Retry</button>
        </div>
      )}

      {!loading && !error && plans?.length === 0 && (
        <div className="lp-empty">
          <div className="lp-empty-icon">📋</div>
          <div className="lp-empty-title">No lesson plans yet</div>
          <div className="lp-empty-desc">
            Create your first plan — tell us what you're covering and we'll draft objectives,
            activities, timing, and assessment for you.
          </div>
          <Link to="new" relative="path" className="lp-btn lp-btn-primary">Create a Lesson Plan</Link>
        </div>
      )}

      {!loading && !error && plans?.length > 0 && (
        <ul className="lp-list">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link to={`${plan.id}`} relative="path" className="lp-list-item">
                <div className="lp-list-item-main">
                  <div className="lp-list-item-title">{plan.short_title}</div>
                  <div className="lp-list-item-meta">
                    {CURRICULUM_LABELS[plan.curriculum] ?? plan.curriculum} · {plan.class_level} · {plan.duration_minutes} min
                  </div>
                </div>
                <span className={`lp-badge ${plan.is_generated ? 'lp-badge-generated' : 'lp-badge-draft'}`}>
                  {plan.is_generated ? 'Generated' : 'Draft'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}