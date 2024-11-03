/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // tailwind.config.js
  theme: {
    extend: {
      scale: {
        '500': '5',
      },
      spacing: {
        '3.25': '0.8125rem',
        '3.75': '0.9375rem',
      },
      animation: {
        'spin-slow': 'spin-slow 8s linear infinite',
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}