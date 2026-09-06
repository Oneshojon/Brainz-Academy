import { Routes, Route } from 'react-router-dom';
import LessonPlansLayout from './LessonPlansLayout';
import LessonPlanListPage from './LessonPlanListPage';
import LessonPlanFormPage from './LessonPlanFormPage';
import LessonPlanDetailPage from './LessonPlanDetailPage';

/**
 * Nested route tree mounted by AppRouter at "/lesson-plans/*". Paths here
 * are relative to that mount point — React Router resolves "/" as
 * "/lesson-plans/", "new" as "/lesson-plans/new", etc.
 */
export default function LessonPlansRouter() {
  return (
    <Routes>
      <Route element={<LessonPlansLayout />}>
        <Route path="/" element={<LessonPlanListPage />} />
        <Route path="new" element={<LessonPlanFormPage />} />
        <Route path=":id" element={<LessonPlanDetailPage />} />
      </Route>
    </Routes>
  );
}