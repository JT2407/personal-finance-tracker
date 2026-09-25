/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Serious money" neutral ramp — cool near-black, not warm paper, not pure black.
        ink: {
          950: '#08090c',
          900: '#0d0f13',
          850: '#12151a',
          800: '#181b21',
          750: '#1e2229',
          700: '#262b33',
          600: '#333a44',
          500: '#4b5360',
          400: '#6b7482',
          300: '#8b94a1',
          200: '#b6bdc7',
          100: '#d7dbe1',
          50: '#eef0f3',
        },
        // Accent — a refined emerald/mint, the "money" green. Single accent locked.
        emerald: {
          DEFAULT: '#10b981',
          soft: '#34d399',
          deep: '#059669',
        },
        gold: '#d4af37',
        rose: {
          DEFAULT: '#f43f5e',
        },
      },
      fontFamily: {
        sans: [
          'Geist',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          'Geist',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'Geist Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      fontSize: {
        // Type scale (per skill: semantic names, tight display, tabular money)
        'display-2xl': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-xl': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-lg': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'display-sm': ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.55' }],
        caption: ['0.8125rem', { lineHeight: '1.45' }],
        micro: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        // Shape consistency lock: concentric system. Interactive=pill, cards=16, inputs=10, controls=8
        control: '0.5rem',
        card: '1rem',
        panel: '1.25rem',
        pill: '9999px',
      },
      boxShadow: {
        // Shadows tinted to surface hue, layered, no pure black on light.
        card: '0 1px 2px rgba(16, 185, 129, 0.04), 0 8px 24px -8px rgba(16, 185, 129, 0.08)',
        'card-lg': '0 2px 4px rgba(16, 185, 129, 0.05), 0 16px 40px -12px rgba(16, 185, 129, 0.12)',
        popover:
          '0 0 0 1px rgba(16, 185, 129, 0.08), 0 8px 24px -8px rgba(0,0,0,0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) both',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
