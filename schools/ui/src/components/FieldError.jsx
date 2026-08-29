/**
 * Renders a DRF-style field error list under a form input, or nothing.
 * Wire the returned id to the input's aria-describedby.
 */
export function FieldError({ id, errors }) {
  if (!errors?.length) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-sp-error">
      {errors.join(' ')}
    </p>
  );
}