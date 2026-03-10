module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        olaBlue: '#0B63D6',
        olaTosca: '#06C7A7',
        olabutton: '#06a7c7ff',
        startupPurple: '#4B1D9E'
        
      },
      boxShadow: {
        'lg-soft': '0 10px 30px rgba(229, 230, 235, 0.08)'
      }
    }
  },
  plugins: [],
}
