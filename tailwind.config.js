// tailwind.config.js
module.exports = {
  // In Tailwind v2 (which is used with create-react-app v4), the property is 'purge'
  // It tells Tailwind to scan these files and remove any unused CSS in production builds.
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      // You can add custom animations, colors, etc. here.
      // For example, the fade-in animation for the profile card:
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
