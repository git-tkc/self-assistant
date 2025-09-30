/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        cybozu: "#3b82f6",
        gmail: "#ef4444",
        asana: "#a855f7",
      },
    },
  },
  plugins: [],
};
