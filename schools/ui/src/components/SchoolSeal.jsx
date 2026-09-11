/**
 * Circular seal badge standing in for a generic logo/avatar -- draws on
 * school-crest/exam-certificate-seal vernacular rather than a generic
 * avatar circle or uppercase eyebrow label. Shows the school name's
 * first letter, ringed in gold.
 */
export function SchoolSeal({ schoolName, size = 'md' }) {
  const initial = schoolName?.trim()?.[0]?.toUpperCase() ?? '?';
  const sizeClasses = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-base';

  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${sizeClasses} shrink-0 items-center justify-center rounded-full border-2 border-sp-gold bg-sp-navy font-sp-display font-bold text-sp-gold`}
    >
      {initial}
    </span>
  );
}