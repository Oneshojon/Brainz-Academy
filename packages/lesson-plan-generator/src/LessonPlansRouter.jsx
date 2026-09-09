import { Routes, Route } from 'react-router-dom';
import LessonPlansLayout from './LessonPlansLayout';
import LessonPlanListPage from './LessonPlanListPage';
import LessonPlanFormPage from './LessonPlanFormPage';
import LessonPlanDetailPage from './LessonPlanDetailPage';

/**
 * Nested route tree mounted by a host app at ".../lesson-plans/*". Paths
 * here are relative to wherever the host mounts this router — e.g. under
 * frontend/ui that's "/tools/lesson-plans/*"; under schools/ui it's
 * "/school-plan/portal/teacher/lesson-plans/*". Every internal link
 * (list → detail, list → new, detail → back) uses a *relative* `to`, so it
 * resolves correctly regardless of mount depth — only `logoTo`/`backLinks`,
 * which point *outside* this route tree, need to be supplied by the host.
 *
 * @param {string} logoTo - see LessonPlansLayout.
 * @param {{label: string, to?: string, href?: string}[]} backLinks - see LessonPlansLayout.
 */
export default function LessonPlansRouter({ logoTo, backLinks }) {
  return (
    <Routes>
      <Route element={<LessonPlansLayout logoTo={logoTo} backLinks={backLinks} />}>
        <Route path="/" element={<LessonPlanListPage />} />
        <Route path="new" element={<LessonPlanFormPage />} />
        <Route path=":id" element={<LessonPlanDetailPage />} />
      </Route>
    </Routes>
  );
}