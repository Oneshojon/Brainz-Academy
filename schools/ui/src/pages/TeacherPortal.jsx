import { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Spinner } from '../components/Spinner';

// Lazy-loaded so a School Plan teacher who never opens Lesson Plan
// Generator doesn't pay for its bundle (marked, the 4 page components,
// etc.) on first portal load. See vite.config.js for the chunkFileNames
// fix this required.
const LessonPlansRouter = lazy(() => import('@brainz/lesson-plan-generator'));

// Absolute (basename-relative) on purpose, not "." or ".." -- these point
// *out* of the lesson-plan-generator package entirely, back to this
// portal's own home. See that package's LessonPlansLayout docstring for
// why a relative path here would be the wrong kind of fix.
const LESSON_PLANS_LOGO_TO = '/portal/';
const LESSON_PLANS_BACK_LINKS = [{ label: '← Teacher Portal', to: '/portal/' }];

/**
 * Data-driven on purpose, even with only one entry today: 6 more
 * resources are planned (AI Product Vision doc), each following the same
 * AIFeature/SchoolFeatureAccess grant pattern Lesson Plan Generator
 * already proves out. Adding the next one should be a data change here,
 * not a UI rewrite.
 *
 * `roles` gates which school_role sees the card at all -- Lesson Plan
 * Generator returns a 403 for ADMIN-role staff today (see
 * lesson_plans/tests/test_views.py::test_school_admin_staff_cannot_create_plan),
 * so showing the card to an admin would just be a guaranteed dead end.
 */
const TEACHER_RESOURCES = [
  {
    key: 'lesson_plan_generator',
    title: 'Lesson Plan Generator',
    description: 'Generate curriculum-aligned lesson plans in minutes.',
    icon: '📋',
    to: 'lesson-plans',
    roles: ['TEACHER'],
  },
];

export function TeacherPortal({ me }) {
  return (
    <Routes>
      <Route path="/" element={<TeacherPortalHome me={me} />} />
      <Route
        path="lesson-plans/*"
        element={
          <Suspense fallback={<PortalRouteLoading />}>
            <LessonPlansRouter logoTo={LESSON_PLANS_LOGO_TO} backLinks={LESSON_PLANS_BACK_LINKS} />
          </Suspense>
        }
      />
    </Routes>
  );
}

function TeacherPortalHome({ me }) {
  const resources = TEACHER_RESOURCES.filter((r) => r.roles.includes(me.school_role));

  return (
    <div className="min-h-screen bg-sp-bg px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="font-sp-body text-sm font-bold uppercase tracking-widest text-sp-accent">
            {me.school_name}
          </p>
          <h1 className="mt-1 font-sp-display text-2xl font-extrabold text-sp-navy sm:text-3xl">
            Teacher Portal
          </h1>
        </header>

        {resources.length === 0 ? (
          <p className="font-sp-body text-sp-navy/60">
            Nothing's been set up for your account yet — check back soon.
          </p>
        ) : (
          <section aria-label="Available resources" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Link
                key={resource.key}
                to={resource.to}
                relative="path"
                className="flex flex-col gap-2 rounded-2xl border border-sp-border bg-white p-6 transition hover:border-sp-border-hover hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden="true">{resource.icon}</span>
                <span className="font-sp-display text-lg font-bold text-sp-navy">{resource.title}</span>
                <span className="font-sp-body text-sm text-sp-navy/60">{resource.description}</span>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function PortalRouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sp-bg">
      <Spinner label="Loading…" />
    </div>
  );
}