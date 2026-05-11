/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#C0392B', light: '#E74C3C', dark: '#922B21', 50: '#FDF2F1', 100: '#FADBD8' },
        secondary: { DEFAULT: '#1A5276', light: '#2471A3', dark: '#154360', 50: '#EAF2F8', 100: '#D6E8F7' },
      },
      fontFamily: {
        sans:    ['Inter',            '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia',       'serif'],
      },
      boxShadow: {
        'glow-red':  '0 0 24px rgb(192 57 43 / 0.35)',
        'glow-blue': '0 0 24px rgb(26 82 118 / 0.35)',
        'card-md':   '0 4px 20px rgb(0 0 0 / 0.08)',
        'card-lg':   '0 12px 40px rgb(0 0 0 / 0.12)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-overlay':    'linear-gradient(135deg, rgba(26,82,118,0.96) 0%, rgba(26,82,118,0.80) 50%, rgba(192,57,43,0.40) 100%)',
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        ticker: 'ticker 25s linear infinite',
      },
    },
  },
  plugins: [],
}
