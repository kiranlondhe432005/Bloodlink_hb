/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E53E3E', // Vibrant Red for emergency
        secondary: '#ED8936', // Orange
        success: '#48BB78', // Green
        dark: '#1A202C',
        light: '#F7FAFC'
      }
    },
  },
  plugins: [],
}
