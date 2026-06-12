/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A18',
        'ink-muted': '#6B6B67',
        'ink-faint': '#B0B0AC',
        surface: '#F5F4F0',
        'surface-card': '#FFFFFF',
        'surface-alt': '#F0EEEA',
        accent: {
          DEFAULT: '#3B6D11',
          light: '#EAF3DE',
          mid: '#639922',
        },
        danger: '#E24B4A',
        border: 'rgba(0,0,0,0.09)',
        'border-strong': 'rgba(0,0,0,0.16)',
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
      },
      borderRadius: {
        btn: '14px',
        card: '16px',
      },
      maxWidth: {
        phone: '430px',
      },
    },
  },
  plugins: [],
}
