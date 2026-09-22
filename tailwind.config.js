/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF6F0',
          100: '#FBECE0',
          200: '#F7D6BF',
          300: '#F2B895',
          400: '#EC9162',
          500: '#E4572E', // Signature fivenest.in terracotta orange
          600: '#D4431B',
          700: '#B03312',
          800: '#8E2B12',
          900: '#742612',
          DEFAULT: '#E4572E',
        },
        orange: {
          400: '#fb923c',
          500: '#E4572E',
          600: '#ea580c',
        },
        surface: {
          bg: '#F5F3EF', // Warm ivory page background
          card: '#FFFFFF',
          muted: '#EFECE6',
          border: '#E8E4DE',
          borderDark: '#D8D5CF',
        },
        ink: {
          primary: '#171717',
          secondary: '#52525B',
          muted: '#71717A',
          subtle: '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 30px -10px rgba(0, 0, 0, 0.06)',
        'brand': '0 4px 14px 0 rgba(228, 87, 46, 0.3)',
        'brand-lg': '0 10px 25px -3px rgba(228, 87, 46, 0.4)',
        'card': '0 0 0 1px #E8E4DE, 0 2px 8px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'beam': 'beam 8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'marquee': 'marquee 30s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
