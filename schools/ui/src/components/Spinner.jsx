/**
 * Small inline spinner for buttons/inline "working" states.
 *
 * By default this announces `label` to screen readers via role="status"
 * + a visually-hidden span — use this when the spinner is the only
 * indication that something is loading.
 *
 * Pass `decorative` when the spinner sits next to its own visible status
 * text (e.g. a button that already shows "Preparing checkout…") — in
 * that case the icon itself needs no separate accessible name, since
 * announcing it too would have screen readers read the same status twice.
 */
export function Spinner({ label = 'Loading', decorative = false }) {
  if (decorative) {
    return (
      <svg
        className="h-4 w-4 motion-safe:animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    );
  }

  return (
    <span role="status" className="inline-flex items-center gap-2">
      <svg className="h-4 w-4 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}