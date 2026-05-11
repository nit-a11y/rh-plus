/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/js/**/*.js",
    "./backend/views/**/*.ejs"
  ],
  theme: {
    extend: {
      colors: {
        nordeste: { 
          red: '#D32F2F', 
          darkRed: '#B71C1C', 
          black: '#121212', 
          gray: '#F4F7F9' 
        }
      }
    }
  },
  plugins: [],
}
