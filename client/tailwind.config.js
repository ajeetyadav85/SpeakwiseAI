/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#7c98fb',
          500: '#6366f1', // Primary Indigo
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          violet: '#8b5cf6',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
        dark: {
          bg: '#161922',
          card: '#161922',
          border: '#242936',
          hover: '#1d212d',
        },
        neu: {
          bg: '#e6ebf2',
          card: '#e6ebf2',
          darkBg: '#161922',
          darkCard: '#161922',
        }
      },
      boxShadow: {
        'neu-flat': '8px 8px 16px #b8c2d1, -8px -8px 16px #ffffff',
        'neu-pressed': 'inset 4px 4px 8px #b8c2d1, inset -4px -4px 8px #ffffff',
        'neu-flat-dark': '8px 8px 18px #0d0f15, -8px -8px 18px #1f232f',
        'neu-pressed-dark': 'inset 4px 4px 8px #0d0f15, inset -4px -4px 8px #1f232f',
        'neu-glow': '0 0 20px rgba(99, 102, 241, 0.35)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(99, 102, 241, 0.8)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
