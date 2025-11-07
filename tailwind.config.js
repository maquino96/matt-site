/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#071A2F',
          800: '#08263C',
          700: '#0B3D91',
          600: '#164E9D'
        },
        accent: '#0EA5E9'
      }
    }
  },
  plugins: []
}

