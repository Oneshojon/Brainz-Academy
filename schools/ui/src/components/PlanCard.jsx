/**
 * @param {Object} props
 * @param {Object} props.plan - { id, name, duration, price, seat_limit, description, features_list }
 * @param {boolean} [props.highlighted]
 * @param {(planId: number) => void} props.onSelect
 */
export function PlanCard({ plan, highlighted = false, onSelect }) {
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(plan.price));

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-7 ${
        highlighted ? 'border-sp-gold' : 'border-sp-border'
      }`}
    >
      {highlighted && (
        <span
          className="absolute -top-3 right-6 rounded-full bg-sp-gold-dim px-3 py-1 font-sp-body text-xs font-bold uppercase tracking-wide text-sp-navy"
          aria-hidden="true"
        >
          Most chosen
        </span>
      )}

      <h3 className="font-sp-display text-xl font-bold text-sp-navy">{plan.name}</h3>
      <p className="mt-1 text-sm uppercase tracking-wide text-sp-muted">{plan.duration}</p>

      <p className="mt-4 font-sp-display text-3xl font-extrabold text-sp-navy">
        {formattedPrice}
        <span className="ml-1 font-sp-body text-sm font-normal text-sp-muted">
          / {plan.duration.toLowerCase()}
        </span>
      </p>

      <p className="mt-2 text-sm text-sp-muted">Up to {plan.seat_limit.toLocaleString()} students</p>

      {plan.description && <p className="mt-4 text-sm text-sp-navy/80">{plan.description}</p>}

      {plan.features_list?.length > 0 && (
        <ul className="mt-5 space-y-2 text-sm text-sp-navy/80">
          {plan.features_list.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span aria-hidden="true" className="text-sp-success">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        className="mt-6 w-full rounded-full bg-sp-navy px-4 py-2.5 font-sp-body text-sm font-semibold text-white transition-colors hover:bg-sp-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sp-accent"
      >
        Choose {plan.name}
      </button>
    </article>
  );
}