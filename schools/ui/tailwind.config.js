/** @type {import('tailwindcss').Config} */
export default {
  // Scoped to this bundle only — cannot affect frontend/ui or any
  // Django-rendered template elsewhere in the app.
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Pulled directly from the site's existing :root custom properties
      // (see index.css / App.jsx in frontend/ui) — same brand, not a new one.
      colors: {
        'sp-bg': '#f4f6f9',
        'sp-white': '#ffffff',
        'sp-navy': '#0b2d72',
        'sp-accent': '#0992c2',
        'sp-gold': '#f5c842',
        'sp-gold-dim': 'rgba(245, 200, 66, 0.12)',
        'sp-border': 'rgba(11, 45, 114, 0.12)',
        'sp-border-hover': 'rgba(11, 45, 114, 0.25)',
        'sp-muted': 'rgba(11, 45, 114, 0.45)',
        'sp-success': '#15803d',
        'sp-success-bg': '#dcfce7',
        'sp-error': '#f87171',
        'sp-error-bg': 'rgba(248, 113, 113, 0.08)',
      },
      fontFamily: {
        'sp-display': ['"Plus Jakarta Sans"', 'sans-serif'],
        'sp-body': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};