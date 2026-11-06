/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mars: {
          rust: '#C1440E',
          'rust-hover': '#D9531E',
          'rust-dark': '#8F2E07',
          charcoal: '#0B0E14',
          surface: '#121620',
          elevated: '#1A2130',
          border: '#232D42',
          cyan: '#00F0FF',
          'cyan-glow': 'rgba(0, 240, 255, 0.25)',
          amber: '#FFB020',
          'amber-glow': 'rgba(255, 176, 32, 0.25)',
          emerald: '#10B981',
          crimson: '#EF4444'
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"Fira Code"', 'monospace'],
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'hud-glow': '0 0 15px rgba(0, 240, 255, 0.25), inset 0 0 15px rgba(0, 240, 255, 0.1)',
        'hud-amber': '0 0 15px rgba(255, 176, 32, 0.25), inset 0 0 15px rgba(255, 176, 32, 0.1)',
        'hud-rust': '0 0 20px rgba(193, 68, 14, 0.35)',
        'tactile-depressed': 'inset 0 3px 6px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(0, 240, 255, 0.2)',
        'tactile-raised': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      transitionTimingFunction: {
        'spring-snappy': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'spring-gentle': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'tactile': 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    },
  },
  plugins: [],
}
