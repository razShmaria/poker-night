/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: "#1a5c2a",
          dark: "#0f3d1c",
          light: "#2d7a42",
        },
        gold: {
          DEFAULT: "#d4af37",
          light: "#f0d060",
          dark: "#b8960c",
        },
      },
    },
  },
  plugins: [],
};
