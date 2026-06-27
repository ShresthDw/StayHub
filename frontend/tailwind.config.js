/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heroTitle: ['Satisfy', '"Dancing Script"', 'Courgette', '"Kaushan Script"', 'Caveat', 'cursive'],
        heroSubtitle: ['Plus Jakarta Sans', 'Manrope', 'sans-serif'],
      },
      colors: {
        brandDark: '#334147',
        gray: {
          50: '#f8fafc',
          100: '#f8fafc',
          200: '#e1ecf1',
          300: '#c2d4dc',
          400: '#9db4be',
          500: '#728b96',
          600: '#556c76',
          700: '#43555d',
          800: '#243035', // Rich elevated card & modal background in dark mode
          850: '#1b2529', // Input/nested surface background in dark mode
          900: '#334147', // Page background across ALL pages in dark mode (#334147)
          950: '#141d21', // Deep cinematic background for hero / footer
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        }
      }
    },
  },
  plugins: [],
}
