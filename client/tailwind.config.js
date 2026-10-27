/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F5F0E7',
          subtle: '#EDE5D8',
          card: '#FFFCF6',
        },
        surface: {
          DEFAULT: '#FFFCF6',
          card: '#FFFCF6',
          subtle: '#FAF6EE',
          elevated: '#FFFFFF',
          muted: '#EDE5D8',
          hover: '#F7F2E8',
        },
        ink: {
          DEFAULT: '#302C27',
          primary: '#302C27',
          secondary: '#777064',
          muted: '#9A9285',
          light: '#C2BAAC',
        },
        line: {
          DEFAULT: '#DED5C7',
          subtle: '#EAE2D5',
          strong: '#C9BEAD',
        },
        olive: {
          50: '#F4F6F3',
          100: '#E8ECE6',
          200: '#D2DACD',
          DEFAULT: '#68745B',
          hover: '#56614A',
          subtle: '#EEF2EC',
          border: '#C5CDC0',
          dark: '#424B3A',
        },
        caramel: {
          50: '#FAF6F1',
          100: '#F4ECE2',
          DEFAULT: '#B78A65',
          hover: '#A07451',
          subtle: '#F9F3EC',
          border: '#DFCEBD',
        },
        parchment: {
          DEFAULT: '#DCC9A9',
          subtle: '#F5EFE4',
          border: '#CDB795',
        },
        terracotta: {
          50: '#FDF6F5',
          100: '#FBEBE8',
          DEFAULT: '#B94A3E',
          hover: '#A03B30',
          subtle: '#FBEBE8',
          border: '#E8BDB7',
        },
        forest: {
          50: '#F5F8F5',
          100: '#EEF3EE',
          DEFAULT: '#4E6B50',
          hover: '#3E5740',
          subtle: '#EEF3EE',
          border: '#C0D1C2',
        },
        ochre: {
          50: '#FDF8F3',
          100: '#FBF2E9',
          DEFAULT: '#C87A3E',
          hover: '#AF662E',
          subtle: '#FBF2E9',
          border: '#E7CCA8',
        },
        // Legacy bridge mappings to prevent broken classes
        brand: {
          50: '#F4F6F3',
          100: '#E8ECE6',
          200: '#D2DACD',
          300: '#B0BEA8',
          400: '#89987A',
          500: '#68745B',
          600: '#68745B',
          700: '#56614A',
          800: '#424B3A',
          900: '#2F362A',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 3px rgba(48, 44, 39, 0.05), 0 3px 8px rgba(48, 44, 39, 0.03)',
        'paper-elevated': '0 4px 16px rgba(48, 44, 39, 0.07), 0 1px 4px rgba(48, 44, 39, 0.04)',
        'paper-modal': '0 12px 36px rgba(48, 44, 39, 0.16), 0 2px 8px rgba(48, 44, 39, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'fade-up': 'fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
