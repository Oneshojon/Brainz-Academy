import { SchoolSeal } from './SchoolSeal';

/**
 * Shared topbar for every School Plan portal surface (Teacher, Student,
 * eventually Admin). The seal badge + school name replace the uppercase
 * "SCHOOL PLAN" eyebrow label pattern used elsewhere in this app --
 * gives each school's own portal a quiet sense of identity without that
 * generic tracked-out-caps treatment.
 *
 * "Sign out" links straight to the Django view (/logout_view/) rather
 * than anything React-side -- this SPA has no client-side auth state of
 * its own to clear, same reasoning as LessonPlansLayout's cross-app links.
 */
export function PortalHeader({ schoolName }) {
  return (
    <header className="flex items-center justify-between border-b border-sp-border bg-white px-4 py-3 sm:px-8">
      <div className="flex items-center gap-3">
        <SchoolSeal schoolName={schoolName} />
        <span className="font-sp-display text-base font-bold text-sp-navy sm:text-lg">{schoolName}</span>
      </div>
      <a
        href="/logout_view/"
        className="font-sp-body text-sm font-semibold text-sp-navy/60 transition hover:text-sp-navy"
      >
        Sign out
      </a>
    </header>
  );
}