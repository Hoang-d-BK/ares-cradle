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
          rust: 'var(--color-mars-rust, #C1440E)',
          'rust-hover': 'var(--mars-rust-hover, #D9531E)',
          'rust-dark': 'var(--mars-rust-dark, #8F2E07)',
          charcoal: 'var(--color-space-charcoal, #0B0E14)',
          surface: 'var(--mars-surface, #121620)',
          elevated: 'var(--mars-elevated, #1A2130)',
          border: 'var(--mars-border, #232D42)',
          'border-bright': 'var(--mars-border-bright, #3B4B6E)',
          cyan: 'var(--color-cyan-visor, #00F0FF)',
          'cyan-dim': 'var(--mars-cyan-dim, rgba(0, 240, 255, 0.15))',
          'cyan-glow': 'var(--mars-cyan-glow, rgba(0, 240, 255, 0.35))',
          amber: 'var(--color-amber-hazard, #FFB020)',
          'amber-dim': 'var(--mars-amber-dim, rgba(255, 176, 32, 0.15))',
          'amber-glow': 'var(--mars-amber-glow, rgba(255, 176, 32, 0.35))',
          emerald: 'var(--mars-emerald, #10B981)',
          'emerald-glow': 'var(--mars-emerald-glow, rgba(16, 185, 129, 0.35))',
          crimson: 'var(--mars-crimson, #EF4444)',
          'crimson-glow': 'var(--mars-crimson-glow, rgba(239, 68, 68, 0.4))'
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
