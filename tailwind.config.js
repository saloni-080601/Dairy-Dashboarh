/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: '#f4f1ea',
        ink: {
          50: '#f7f6f3',
          100: '#ece9e2',
          200: '#d8d3c8',
          300: '#b8b0a2',
          400: '#8d8578',
          500: '#6b6459',
          600: '#4e4941',
          700: '#39362f',
          800: '#26241f',
          900: '#161512',
        },
        forest: {
          50: '#eef6f0',
          100: '#d5eadb',
          200: '#add4b8',
          300: '#78b48b',
          400: '#4a9164',
          500: '#2f734b',
          600: '#1f5b3a',
          700: '#18492f',
          800: '#133a26',
          900: '#0f2d1e',
        },
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
      },
      boxShadow: {
        panel: '0 1px 2px rgba(22, 21, 18, 0.04), 0 10px 24px -16px rgba(22, 21, 18, 0.18)',
      },
    },
  },
  plugins: [],
}
