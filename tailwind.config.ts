import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1920px',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 234, 167, 0.8), 0 0 40px rgba(255, 234, 167, 0.6), 0 0 60px rgba(255, 234, 167, 0.4), 0 0 80px rgba(255, 234, 167, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(255, 234, 167, 1), 0 0 60px rgba(255, 234, 167, 0.8), 0 0 90px rgba(255, 234, 167, 0.6), 0 0 120px rgba(255, 234, 167, 0.4)',
          },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config




