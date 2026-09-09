/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF7F50", // Coral Orange
          light: "#FF9F7D",
          dark: "#E06030",
        },
        secondary: {
          DEFAULT: "#87CEFA", // Light Sky Blue
          light: "#B0E0FF",
          dark: "#5FA8D8",
        },
        background: "#FFFFFF",
        surface: "#F3F4F6", // Light Gray
        text: {
          DEFAULT: "#1F2937", // Gray 800
          muted: "#6B7280", // Gray 500
        },
      },
    },
  },
  plugins: [],
};
