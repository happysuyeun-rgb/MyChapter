/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#3B352D',
        'ink-muted': '#756D62',
        'ink-faint': '#A79D90',
        surface: '#F7F2E8',
        'surface-card': '#FFFDF8',
        'surface-alt': '#EEE5D7',
        accent: {
          DEFAULT: '#3B352D',
          light: '#EFE6D8',
          mid: '#7C8D78',
        },
        sage: '#7C8D78',
        terracotta: '#C87959',
        danger: '#B85C4A',
        border: 'rgba(59,53,45,0.12)',
        'border-strong': 'rgba(59,53,45,0.24)',
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
      },
      borderRadius: { btn: '14px', card: '18px' },
      maxWidth: { phone: '430px' },
      boxShadow: { paper: '0 8px 28px rgba(59,53,45,0.08)' },
    },
  },
  plugins: [],
}
