/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#081223",
        accent: "#f97316",
        sand: "#fff8f1",
      },
      boxShadow: {
        soft: "0 24px 60px rgba(8, 18, 35, 0.18)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at center, rgba(255,255,255,0.16) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
