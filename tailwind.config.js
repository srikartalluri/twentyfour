/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'huge': '10rem', // Adjust the size as needed
      },

      fontFamily: {
        adlam: ['Source Sans Pro', 'Helvetica', 'sans-serif']
      },
      gridTemplateColumns: {
        '75': 'repeat(auto-fit, minmax(75px, 1fr))'
      }
    },
  },
  plugins: [],
}

