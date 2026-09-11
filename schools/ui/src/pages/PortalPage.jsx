import { useApiResource } from '@brainz/shared-ui';
import { getMe } from '../api/schoolsApi';
import { TeacherPortal } from './TeacherPortal';
import { StudentPortal } from './StudentPortal';
import { Spinner } from '../components/Spinner';

/**
 * Single entry point for every School Plan member post-login (see
 * Users/views.py's verify_otp redirect). Calls GET /schools/me/ once and
 * dispatches to TeacherPortal or StudentPortal based on the response --
 * SchoolStaff and CohortEnrollment are unrelated models with mostly
 * disjoint resources, so this stays a plain dispatcher rather than one
 * component branching internally on role everywhere.
 */
export function PortalPage() {
  const { data: me, loading, error } = useApiResource('school-me', (signal) => getMe(signal));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sp-bg">
        <Spinner label="Loading your portal…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sp-bg px-4 text-center">
        <p className="font-sp-body text-sp-navy/70">{error.message}</p>
      </div>
    );
  }

  if (me.is_staff) return <TeacherPortal me={me} />;
  if (me.is_student) return <StudentPortal me={me} />;

  // /schools/me/ only ever resolves successfully when is_staff or
  // is_student is true (anything else is a 404, caught as `error` above)
  // -- this branch is unreachable today. Kept rather than assumed away so
  // a future backend change to that contract can't silently render
  // nothing here.
  return (
    <div className="flex min-h-screen items-center justify-center bg-sp-bg px-4 text-center">
      <p className="font-sp-body text-sp-navy/70">We couldn't determine your role. Please contact support.</p>
    </div>
  );
}