import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F3', mist: '#F5F5F7', night: '#0D0809', paper: '#FFFEFB', rose: { soft: '#F3E6E8', DEFAULT: '#E3C6CC' },
        wine: { DEFAULT: '#521328', dark: '#3A0D1C' }, terracotta: '#C2664A', gold: { DEFAULT: '#C9A45C', deep: '#94722D' }, ink: '#1D1A1C', muted: '#6E6A6C',
      },
      fontFamily: { display: ['var(--font-display)', 'Georgia', 'serif'], sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      boxShadow: { soft: '0 6px 24px -12px rgba(78,20,33,.25)' },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
export default config;
