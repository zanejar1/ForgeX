/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f8ff',
          100: '#eaefff',
          200: '#d6dfff',
          300: '#b3c6ff',
          400: '#809fff',
          500: '#4d78ff',
          600: '#2859ff',
          700: '#1b45db',
          800: '#1739b3',
          900: '#132f8f',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.2rem',
      },
    },
  },
  plugins: [],
}
