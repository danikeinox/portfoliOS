/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'ios': '1.75rem',
        'squircle': '22.5%',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        'system-blue': '#007AFF',
        'system-green': '#34C759',
        'system-red': '#FF3B30',
        'system-yellow': '#FFCC00',
        'system-orange': '#FF9500',
      },
      animation: {
        'in': 'animate-in .3s ease-out',
        'in-zoom': 'animate-in-zoom .3s ease-out',
      },
      keyframes: {
        'animate-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'animate-in-zoom': {
          '0%': { opacity: '0', transform: 'scale(.90)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
