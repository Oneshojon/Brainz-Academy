import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import { useApiResource, useApiMutation, invalidateResource } from '../../shared/useApiResource';
import { getLessonPlan, generateLessonPlan, deleteLessonPlan, downloadLessonPlan } from './api';

const CURRICULUM_LABELS = { NIGERIAN: 'Nigerian (WAEC / NECO / JAMB)', IGCSE: 'British (IGCSE)' };

/**
 * The ai_lesson_plans FeatureFlag-off case and a genuine "plan not found"
 * both surface as a 404 from the API — distinguished here by message text
 * (the backend's wording is stable/tested) purely to pick the right UI,
 * not for any access-control decision.
 */
function isAdminDisabledError(error) {
  return error?.status === 404 && typeof error.message === 'string'
    && error.message.toLowerCase().includes('disabled by the admin');
}

/**
 * Reads a failed blob download's error body. Axios delivers a failed
 * blob-responseType request's error body as a Blob too (not parsed JSON),
 * so this is separate from the shared apiClient normalizeError(), which
 * assumes error.response.data is already JSON.
 */
async function readBlobErrorMessage(error, fallback) {
  try {
    const text = await error?.response?.data?.text?.();
    const parsed = JSON.parse(text || '{}');
    return parsed.error || fallback;
  } catch {
    return fallback;
  }
}

export default function LessonPlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cacheKey = `lesson-plan:${id}`;

  const { data: plan, loading, error, refetch } = useApiResource(cacheKey, (signal) => getLessonPlan(id, signal));
  const { mutate: runGenerate, loading: generating, error: generateError } = useApiMutation(() => generateLessonPlan(id));
  const { mutate: runDelete, loading: deleting } = useApiMutation(() => deleteLessonPlan(id));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [downloading, setDownloading] = useState(null); // 'pdf' | 'docx' | null
  const [downloadError, setDownloadError] = useState(null);

  const handleGenerate = async () => {
    try {
      await runGenerate();
      invalidateResource(cacheKey);
      refetch();
    } catch {
      // generateError from useApiMutation already holds the ApiError for the panel below.
    }
  };

  const handleDelete = async () => {
    await runDelete();
    invalidateResource('lesson-plans');
    navigate('/lesson-plans/');
  };

  const handleDownload = async (format) => {
    setDownloading(format);
    setDownloadError(null);
    try {
      const blob = await downloadLessonPlan(id, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(plan.short_title || 'Lesson_Plan').replace(/\s+/g, '_')}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(await readBlobErrorMessage(err, 'Download failed. Please try again.'));
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="lp-page"><div className="lp-loading">Loading lesson plan…</div></div>;

  if (error) {
    return (
      <div className="lp-page">
        <div className="lp-error-banner">
          {error.status === 404 ? "This lesson plan couldn't be found." : error.message}
        </div>
        <Link to="/lesson-plans/" className="lp-btn lp-btn-ghost">← Back to Lesson Plans</Link>
      </div>
    );
  }

  return (
    <div className="lp-page">
      <div className="lp-page-header">
        <div>
          <h1 className="lp-page-title">{plan.short_title}</h1>
          <div className="lp-page-subtitle">
            {CURRICULUM_LABELS[plan.curriculum] ?? plan.curriculum} · {plan.class_level} · {plan.duration_minutes} min
            {plan.class_size ? ` · ${plan.class_size} students` : ''} · {plan.effective_school_name}
          </div>
        </div>
        <button
          className="lp-btn lp-btn-danger-ghost"
          onClick={() => setConfirmingDelete(true)}
          disabled={deleting}
        >
          Delete
        </button>
      </div>

      {confirmingDelete && (
        <div className="lp-confirm-banner">
          Delete this lesson plan? This can't be undone.
          <div className="lp-confirm-actions">
            <button className="lp-btn lp-btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button className="lp-btn lp-btn-ghost" onClick={() => setConfirmingDelete(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="lp-card lp-input-summary">
        <div className="lp-input-summary-label">Coverage</div>
        <div>{plan.coverage}</div>
        {plan.additional_notes && (
          <>
            <div className="lp-input-summary-label">Additional context</div>
            <div>{plan.additional_notes}</div>
          </>
        )}
      </div>

      {!plan.is_generated ? (
        <div className="lp-generate-panel">
          <button className="lp-btn lp-btn-primary lp-btn-block" onClick={handleGenerate} disabled={generating}>
            {generating ? (<><span className="lp-spinner" /> Generating your lesson plan…</>) : 'Generate Lesson Plan'}
          </button>

          {generateError && (
            isAdminDisabledError(generateError) ? (
              <div className="lp-error-banner">
                The Lesson Plan Generator is currently disabled by the admin.
                <a href="/contact/" className="lp-btn lp-btn-ghost">Contact Us</a>
              </div>
            ) : generateError.status === 503 ? (
              <div className="lp-error-banner">
                {generateError.message}
                <button className="lp-btn lp-btn-ghost" onClick={handleGenerate}>Try Again</button>
              </div>
            ) : generateError.status === 403 ? (
              <div className="lp-error-banner lp-error-upsell">{generateError.message}</div>
            ) : (
              <div className="lp-error-banner">{generateError.message}</div>
            )
          )}
        </div>
      ) : (
        <>
          <div className="lp-download-row">
            <button
              className="lp-btn lp-btn-ghost"
              onClick={() => handleDownload('pdf')}
              disabled={downloading !== null}
            >
              {downloading === 'pdf' ? (<><span className="lp-spinner" /> Preparing PDF…</>) : '📄 Download PDF'}
            </button>
            <button
              className="lp-btn lp-btn-ghost"
              onClick={() => handleDownload('docx')}
              disabled={downloading !== null}
            >
              {downloading === 'docx' ? (<><span className="lp-spinner" /> Preparing DOCX…</>) : '📝 Download DOCX'}
            </button>
          </div>

          {downloadError && <div className="lp-error-banner">{downloadError}</div>}

          <div className="lp-sections">
            <LessonSectionCard title="Objectives" content={plan.objectives} />
            <LessonSectionCard title="Activities" content={plan.activities} />
            <LessonSectionCard title="Timing Breakdown" content={plan.timing_breakdown} />
            <LessonSectionCard title="Assessment" content={plan.assessment} />
          </div>
        </>
      )}
    </div>
  );
}

function LessonSectionCard({ title, content }) {
  return (
    <div className="lp-card lp-section-card">
      <div className="lp-section-title">{title}</div>
      <div className="lp-section-body" dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }} />
    </div>
  );
}