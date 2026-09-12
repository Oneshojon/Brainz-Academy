import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { registerSchool } from '../api/schoolsApi';
import { useApiMutation, ApiError } from '@brainz/shared-ui';
import { FieldError } from '../components/FieldError';
import { Spinner } from '../components/Spinner';

export function RegisterPage() {
  // Read fresh on every render (set by the Django template at page load)
  // rather than frozen at module-import time — a module-level constant
  // here would never reflect a change to window.IS_AUTHENTICATED after
  // the bundle first loads.
  const isAuthenticated = typeof window !== 'undefined' ? window.IS_AUTHENTICATED !== false : true;
  // Same reasoning — read live, not at import time.
  const userEmail = typeof window !== 'undefined' ? window.USER_EMAIL ?? '' : '';

  const [searchParams] = useSearchParams();
  const initialPlanId = searchParams.get('plan') ?? '';

  const [form, setForm] = useState({
    name: '',
    state: '',
    // contact_email is no longer user-editable (see below) -- it always
    // equals the logged-in account's own email. The backend enforces this
    // independently too (SchoolRegistrationSerializer.validate() forces
    // it server-side), so this is a clarity measure, not the real control.
    contact_email: userEmail,
    plan_id: initialPlanId,
  });
  const [banner, setBanner] = useState(null);

  const { mutate, loading, error } = useApiMutation(registerSchool);
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : null;

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sp-bg px-4 py-12 sm:px-8">
        <div className="max-w-sm rounded-2xl border border-sp-border bg-white p-8 text-center">
          <h1 className="font-sp-display text-xl font-bold text-sp-navy">Log in to continue</h1>
          <p className="mt-2 text-sm text-sp-navy/70">
            Registering a school needs a BrainzAcademy account first.
          </p>
          <a
            // Points at the actual login view (/get-otp/), not the
            // homepage -- the homepage's own window.requireAuth() helper
            // already builds links this same way (Users/index.html), so
            // this now matches that existing, if previously-unhonored,
            // convention. Users/views.py:request_otp/verify_otp carry
            // ?next= through the OTP round-trip and land back here.
            href={`/get-otp/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
            className="mt-6 inline-block rounded-full bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy/90"
          >
            Go to login
          </a>
        </div>
      </main>
    );
  }

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);
    try {
      const result = await mutate({ ...form, plan_id: Number(form.plan_id) });
      // Full navigation, not a router Link — Paystack is a different origin.
      window.location.href = result.authorization_url;
    } catch (err) {
      if (err instanceof ApiError && err.status !== 400) {
        setBanner(err.message);
      }
    }
  };

  return (
    <main className="min-h-screen bg-sp-bg px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-md">
        <header className="mb-8 text-center">
          <p className="font-sp-body text-sm font-bold uppercase tracking-widest text-sp-accent">
            School Plan
          </p>
          <h1 className="mt-2 font-sp-display text-2xl font-extrabold text-sp-navy sm:text-3xl">
            Register your school
          </h1>
        </header>

        {banner && (
          <div role="alert" className="mb-6 rounded-2xl border border-sp-error/40 bg-sp-error-bg p-4 text-sp-error">
            {banner}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-sp-border bg-white p-6 sm:p-8">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-sp-navy">School name</label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange('name')}
              aria-invalid={Boolean(fieldErrors?.name)}
              aria-describedby={fieldErrors?.name ? 'name-error' : undefined}
              className="mt-1 w-full rounded-lg border border-sp-border px-3 py-2 text-sp-navy focus:border-sp-accent focus:outline-none"
            />
            <FieldError id="name-error" errors={fieldErrors?.name} />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-sp-navy">State</label>
            <input
              id="state"
              type="text"
              required
              placeholder="e.g. Lagos"
              value={form.state}
              onChange={handleChange('state')}
              aria-invalid={Boolean(fieldErrors?.state)}
              aria-describedby={fieldErrors?.state ? 'state-error' : undefined}
              className="mt-1 w-full rounded-lg border border-sp-border px-3 py-2 text-sp-navy focus:border-sp-accent focus:outline-none"
            />
            <FieldError id="state-error" errors={fieldErrors?.state} />
          </div>

          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-sp-navy">Contact email</label>
            <input
              id="contact_email"
              type="email"
              required
              readOnly
              disabled
              value={form.contact_email}
              aria-invalid={Boolean(fieldErrors?.contact_email)}
              aria-describedby={fieldErrors?.contact_email ? 'contact_email-error' : 'contact_email-hint'}
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-sp-border bg-sp-bg px-3 py-2 text-sp-navy/70"
            />
            <p id="contact_email-hint" className="mt-1 text-xs text-sp-navy/50">
              This is tied to your account and becomes the school's registered admin contact — it can't be changed here.
            </p>
            <FieldError id="contact_email-error" errors={fieldErrors?.contact_email} />
          </div>

          <div>
            <label htmlFor="plan_id" className="block text-sm font-medium text-sp-navy">Plan ID</label>
            <input
              id="plan_id"
              type="number"
              required
              min="1"
              value={form.plan_id}
              onChange={handleChange('plan_id')}
              aria-invalid={Boolean(fieldErrors?.plan_id)}
              aria-describedby={fieldErrors?.plan_id ? 'plan_id-error' : undefined}
              className="mt-1 w-full rounded-lg border border-sp-border px-3 py-2 text-sp-navy focus:border-sp-accent focus:outline-none"
            />
            <FieldError id="plan_id-error" errors={fieldErrors?.plan_id} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-sp-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sp-navy/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner decorative />
                Preparing checkout…
              </>
            ) : (
              'Continue to payment'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}