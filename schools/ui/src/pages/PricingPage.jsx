import { useNavigate } from 'react-router-dom';
import { listPlans } from '../api/schoolsApi';
import { useApiResource } from '../hooks/useApiResource';
import { PlanCard } from '../components/PlanCard';

function PlanCardSkeleton() {
  return <div className="h-80 animate-pulse rounded-2xl border border-sp-border bg-white/60" aria-hidden="true" />;
}

export function PricingPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useApiResource('school-plans', (signal) => listPlans(signal));

  const handleSelect = (planId) => navigate(`/register?plan=${planId}`);

  return (
    <main className="min-h-screen bg-sp-bg px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center sm:mb-14">
          <p className="font-sp-body text-sm font-bold uppercase tracking-widest text-sp-accent">
            School Plan
          </p>
          <h1 className="mt-2 font-sp-display text-3xl font-extrabold text-sp-navy sm:text-4xl">
            Bring your whole school onto BrainzAcademy
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sp-navy/70">
            One subscription for cohorts, class groups, and staff — set up once per
            term, ready for WAEC, NECO, and JAMB prep.
          </p>
        </header>

        {error && (
          <div role="alert" className="mx-auto mb-8 max-w-md rounded-2xl border border-sp-error/40 bg-sp-error-bg p-4 text-center text-sp-error">
            {error.message}
          </div>
        )}

        <section aria-label="Available school plans" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <PlanCardSkeleton key={i} />)}

          {!loading &&
            data?.plans?.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} highlighted={index === 1} onSelect={handleSelect} />
            ))}

          {!loading && data?.plans?.length === 0 && (
            <p className="col-span-full text-center text-sp-navy/60">
              No plans are available right now — check back soon.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}