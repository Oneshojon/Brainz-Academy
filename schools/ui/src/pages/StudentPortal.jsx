/**
 * Real placeholder, not a stub for an unknown concept: the AI Product
 * Vision doc names AI Learning Companion as explicitly per-student, so
 * this points at a named upcoming feature rather than a vague "nothing
 * here yet". Becomes a resource grid (mirroring TeacherPortal's shape)
 * once that feature -- or any other student-facing resource -- actually
 * exists on the backend.
 */
export function StudentPortal({ me }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sp-bg px-4 text-center">
      <p className="font-sp-body text-sm font-bold uppercase tracking-widest text-sp-accent">
        {me.school_name}
      </p>
      <h1 className="font-sp-display text-2xl font-extrabold text-sp-navy sm:text-3xl">
        Your AI Learning Companion is coming soon
      </h1>
      <p className="max-w-md font-sp-body text-sp-navy/60">
        We're building a personal AI tutor for every School Plan student — it'll explain
        concepts, answer questions, and adapt to your pace. Check back soon.
      </p>
    </div>
  );
}