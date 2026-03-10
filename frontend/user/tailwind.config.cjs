module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        olaBlue: '#0B63D6',
        olaLight: '#E8F3FF',
        olaTosca: '#06C7A7',
        olaMuted: '#F6F9FB'
      },
      boxShadow: {
        'lg-soft': '0 10px 30px rgba(10, 20, 50, 0.08)'
      }
    }
  },
  plugins: [],
}
