/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-cairo)', 'sans-serif'],
        arabic: ['var(--font-cairo)', 'var(--font-jakarta)', 'sans-serif'],
      },
      colors: {
        awfar: {
          primary: '#0B6E4F',
          primaryDark: '#064E3B',
          primaryLight: '#ECFDF5',
          secondary: '#D97706',
          secondaryLight: '#FEF3C7',
          accent: '#4F46E5',
          dark: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};
