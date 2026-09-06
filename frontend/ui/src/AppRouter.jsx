import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';

const LessonPlansRouter = lazy(() => import('./features/lessonPlans/LessonPlansRouter'));

export default function AppRouter() {
  return (
    <BrowserRouter basename="/tools">
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/lesson-plans/*"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <LessonPlansRouter />
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