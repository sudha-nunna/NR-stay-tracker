/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        resident: {
          DEFAULT: '#10B981', // Emerald 500
          light: '#D1FAE5',   // Emerald 100
        },
        rnor: {
          DEFAULT: '#3B82F6', // Blue 500
          light: '#DBEAFE',   // Blue 100
        },
        nri: {
          DEFAULT: '#F59E0B',  // Amber 500
          light: '#FEF3C7',   // Amber 100
        }
      }
    },
  },
  plugins: [],
}