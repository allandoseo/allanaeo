import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#17324D',
        brand: { DEFAULT: '#245B88', dark: '#1C4A70' },
        steel: '#426F96',
        sky: '#EAF2FA',
        canvas: '#F4F7FA',
        ink: '#1D2B38',
        muted: '#687887',
        line: '#DCE4EB',
        ok: '#27845A',
        danger: '#B42318',
        warn: '#9A5B00',
      },
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { DEFAULT: '6px' },
      maxWidth: { page: '1280px' },
    },
  },
  plugins: [],
} satisfies Config;
