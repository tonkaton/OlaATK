module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif']
      },
      colors: {
        // Aura Template - Clean Professional Palette
        dark: {
          DEFAULT: '#0c1100',
          bg: '#040600',
          lighter: '#1a1f14',
          muted: '#4d4d4d',
          border: '#2d2c2c'
        },
        light: {
          DEFAULT: '#fdfcfc',
          gray: '#fafafa',
          muted: '#eee'
        },
        border: {
          DEFAULT: '#ccc',
          dark: '#2d2c2c',
          light: '#e5e5e5'
        },
        neutral: {
          text: '#333',
          light: '#999',
          bg: '#262626'
        }
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(10, 20, 50, 0.08)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)'
      },
      animation: {
        'marquee-left': 'marquee-left 30s linear infinite',
        'marquee-right': 'marquee-right 30s linear infinite',
        'marquee-fast': 'marquee-left 20s linear infinite',
        'marquee-slow': 'marquee-left 40s linear infinite',
      },
      keyframes: {
        'marquee-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        'marquee-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' }
        }
      },
      backgroundImage: {
        'gradient-soft': 'linear-gradient(135deg, #fdfcfc 0%, #f5f5f5 100%)'
      }
    }
  },
  plugins: [],
}