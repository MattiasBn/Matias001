import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderColor: {
        border: "hsl(var(--border))",
      },
      colors: {
        border: "hsl(var(--border))",
      }
    },
  },

  plugins: [forms],
};






export default config;
