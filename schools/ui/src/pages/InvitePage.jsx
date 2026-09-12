import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { previewInvite, redeemInvite } from '../api/schoolsApi';
import { useApiResource, useApiMutation, ApiError } from '@brainz/shared-ui';
import { SchoolSeal } from '../components/SchoolSeal';
import { Spinner } from '../components/Spinner';

const ROLE_LABELS = { ADMIN: 'Admin', TEACHER: 'Teacher' };

/**
 * GET /school-plan/invite/:token/
 *
 * Flow:
 *  1. Always previews the token first (GET /schools/invites/<token>/preview/,
 *     AllowAny — no login needed to see this). A STUDENT-role invite is
 *     shown its own "not self-service yet" message right here, since we
 *     already know from the preview that redeeming would fail — no point
 *     sending anyone through a login round-trip just to bounce them.
 *  2. Not logged in + a TEACHER/ADMIN invite -> a login link carries
 *     ?next= back to this exact URL through the OTP round-trip
 *     (Users/views.py: request_otp / verify_otp).
 *  3. Logged in -> automatically calls POST /schools/invites/redeem/ once
 *     the preview has resolved, and shows its result. A valid preview
 *     doesn't guarantee redeem still succeeds (e.g. the invite could be
 *     exhausted by someone else in between) — redeemError is always
 *     rendered verbatim rather than assumed away.
 */
export function InvitePage() {
  const { token } = useParams();
  const isAuthenticated = typeof window !== 'undefined' ? window.IS_AUTHENTICATED === true : false;

  const {
    data: preview,
    loading: previewLoading,
    error: previewError,
  } = useApiResource(`invite-preview:${token}`, (signal) => previewInvite(token, signal));

  const { mutate: runRedeem, loading: redeeming, error: redeemError } = useApiMutation(redeemInvite);
  const [redeemResult, setRedeemResult] = useState(null);
  const attemptedRef = useRef(false);

  const isSupportedRole = preview && preview.role in ROLE_LABELS;

  useEffect(() => {
    if (!isAuthenticated || !isSupportedRole || attemptedRef.current) return;
    attemptedRef.current = true;
    runRedeem(token)
      .then(setRedeemResult)
      .catch(() => {
        // redeemError from useApiMutation already holds the ApiError for
        // the panel below.
      });
  }, [isAuthenticated, isSupportedRole, runRedeem, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sp-bg px-4 py-12 sm:px-8">
      <div className="w-full max-w-sm rounded-2xl border border-sp-border bg-white p-8 text-center">
        {previewLoading && (
          <div role="status" className="flex flex-col items-center gap-3 py-6">
            <Spinner decorative />
            <p className="text-sm text-sp-navy/60">Checking your invite…</p>
          </div>
        )}

        {!previewLoading && previewError instanceof ApiError && (
          <>
            <h1 className="font-sp-display text-xl font-bold text-sp-navy">
              {previewError.status === 404 ? "That invite link isn't valid" : "This invite can't be used"}
            </h1>
            <p role="alert" className="mt-3 text-sm text-sp-navy/70">{previewError.message}</p>
            <a
              href="/"
              className="mt-6 inline-block rounded-full bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy/90"
            >
              Back to BrainzAcademy
            </a>
          </>
        )}

        {!previewLoading && preview && !isSupportedRole && (
          <>
            <SchoolSeal schoolName={preview.school_name} size="lg" />
            <h1 className="mt-4 font-sp-display text-xl font-bold text-sp-navy">
              Student invites aren't self-service yet
            </h1>
            <p className="mt-3 text-sm text-sp-navy/70">
              You've been invited to join <strong>{preview.school_name}</strong> as a student, but
              joining this way isn't supported yet. Please ask your school to enroll you directly.
            </p>
          </>
        )}

        {!previewLoading && preview && isSupportedRole && !isAuthenticated && (
          <>
            <SchoolSeal schoolName={preview.school_name} size="lg" />
            <h1 className="mt-4 font-sp-display text-xl font-bold text-sp-navy">You've been invited</h1>
            <p className="mt-3 text-sm text-sp-navy/70">
              Join <strong>{preview.school_name}</strong> as a{' '}
              <strong>{ROLE_LABELS[preview.role]}</strong>. Sign in (or create an account) to accept.
            </p>
            <a
              href={`/get-otp/?next=${encodeURIComponent(`/school-plan/invite/${token}/`)}`}
              className="mt-6 inline-block rounded-full bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy/90"
            >
              Sign in to accept
            </a>
          </>
        )}

        {!previewLoading && preview && isSupportedRole && isAuthenticated && redeeming && (
          <div role="status" className="flex flex-col items-center gap-3 py-6">
            <Spinner decorative />
            <p className="text-sm text-sp-navy/60">Joining {preview.school_name}…</p>
          </div>
        )}

        {!previewLoading && isAuthenticated && redeemResult && (
          <>
            <SchoolSeal schoolName={preview.school_name} size="lg" />
            <h1 className="mt-4 font-sp-display text-xl font-bold text-sp-navy">You're in!</h1>
            <p className="mt-3 text-sm text-sp-navy/70">
              You've joined <strong>{preview.school_name}</strong> as a{' '}
              <strong>{ROLE_LABELS[redeemResult.role] ?? redeemResult.role}</strong>.
            </p>
            <a
              href="/school-plan/portal/"
              className="mt-6 inline-block rounded-full bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy/90"
            >
              Go to your portal
            </a>
          </>
        )}

        {!previewLoading && isAuthenticated && !redeeming && redeemError instanceof ApiError && (
          <>
            <h1 className="font-sp-display text-xl font-bold text-sp-navy">We couldn't add you</h1>
            <p role="alert" className="mt-3 text-sm text-sp-navy/70">{redeemError.message}</p>
            {redeemError.message === "You're already part of a school." && (
              <a
                href="/school-plan/portal/"
                className="mt-6 inline-block rounded-full bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy/90"
              >
                Go to your portal
              </a>
            )}
          </>
        )}
      </div>
    </main>
  );
}