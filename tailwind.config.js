/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dairy: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
        },
        morning: {
          light: '#fffbeb',
          badge: '#fef3c7',
          text: '#b45309',
          border: '#fde68a',
          solid: '#d97706',
        },
        evening: {
          light: '#eff6ff',
          badge: '#dbeafe',
          text: '#1d4ed8',
          border: '#bfdbfe',
          solid: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
