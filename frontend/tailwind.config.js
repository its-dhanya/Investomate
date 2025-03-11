/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",  // Ensures Tailwind works inside src/
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
