/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark Mode / Modern Finance Palette
        apple: {
          bg: '#0F1115',       // Deep sleek background
          surface: '#1A1D24',  // Slightly lighter card background
          ink: '#F2F4F7',      // Primary text
          secondary: '#9EA3AE',// Secondary text
          tertiary: '#6E7381',
          border: 'rgba(255,255,255,0.08)',
          divider: 'rgba(255,255,255,0.05)',
          blue: '#3B82F6',
          'blue-bg': 'rgba(59,130,246,0.15)',
          green: '#10B981',
          'green-bg': 'rgba(16,185,129,0.15)',
          red: '#EF4444',
          'red-bg': 'rgba(239,68,68,0.15)',
          amber: '#F59E0B',
          glass: 'rgba(26,29,36,0.72)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:  ['12px', '16px'],
        sm:  ['13px', '18px'],
        base:['15px', '22px'],
        lg:  ['17px', '24px'],
        xl:  ['20px', '28px'],
        '2xl':['24px', '30px'],
        '3xl':['30px', '36px'],
        '4xl':['38px', '44px'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)',
        'card-md': '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.2)',
        'card-lg': '0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.2)',
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
}
