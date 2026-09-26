/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teamax: {
          primary: '#E8D5A3',
          secondary: '#A89870',
          accent: '#C9A227',
          dark: '#050505',
          surface: '#111111',
          border: '#3A3118',
          light: '#1C1C1C',
          gold: '#D4AF37',
          warm: '#0A0A0A'
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'serif'],
        display: ['Cinzel', 'serif'],
        script: ['Playfair Display', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        gold: '0 0 24px rgba(212, 175, 55, 0.18)',
        'gold-lg': '0 20px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(212, 175, 55, 0.18)'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
};
