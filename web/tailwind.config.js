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
        primary: '#165DFF',
        success: '#00B42A',
        warning: '#FF7D00',
        error: '#F53F3F',
        idle: '#86909C',
        'page-bg': '#121418',
        'card-bg': '#1E2128',
        'dark-border': 'rgba(255, 255, 255, 0.08)',
        'dark-card': '#1E2128',
      },
      width: {
        'sidebar': '260px',
      },
      fontFamily: {
        sans: ['Inter', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
