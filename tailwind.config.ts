import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ice: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a4f12',
          900: '#7c2d12',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
