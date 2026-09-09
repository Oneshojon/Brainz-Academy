import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';

// Extracted into a workspace package (packages/lesson-plan-generator) during
// the school-portal build so schools/ui can mount the same component tree
// under its own path -- see that package's LessonPlansLayout for why
// logoTo/backLinks are passed explicitly rather than hardcoded there.
const LessonPlansRouter = lazy(() => import('@brainz/lesson-plan-generator'));

const LESSON_PLANS_LOGO_TO = '/';
const LESSON_PLANS_BACK_LINKS = [
  { label: '← Test Builder', to: '/' },
  { label: '← Dashboard', href: '/teacher/' },
];

export default function AppRouter() {
  return (
    <BrowserRouter basename="/tools">
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/lesson-plans/*"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <LessonPlansRouter logoTo={LESSON_PLANS_LOGO_TO} backLinks={LESSON_PLANS_BACK_LINKS} />
            </Suspense>
          }
        />
        {/* Any unmatched /tools/* path bounces here instead of rendering
            blank -- this is what would have turned today's silent blank
            page into an immediately-visible "something's wrong" signal. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RouteLoadingFallback() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#6B7FA3' }}>
      Loading…
    </div>
  );
}