/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.jsx",                        // legacy monolith root file (kept for reference)
    "./src/**/*.{js,ts,jsx,tsx}",     // all restructured source files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
