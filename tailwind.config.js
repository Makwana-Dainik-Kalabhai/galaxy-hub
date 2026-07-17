/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#00D4FF',
        darkbg: '#0A0A1A',
        cardbg: '#1A1A2E',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'neon-pulse': 'neonPulse 2s infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        neonPulse: {
          '0%': { boxShadow: '0 0 4px #6C63FF, 0 0 10px #6C63FF' },
          '100%': { boxShadow: '0 0 12px #00D4FF, 0 0 24px #00D4FF' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
