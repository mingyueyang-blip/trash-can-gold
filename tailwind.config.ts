import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "card": "1.5rem",
        "glass": "24px",
      },
      colors: {
        gradient: {
          start: "#E0C3FC",
          end: "#8EC5FC",
        },
      },
      backgroundImage: {
        "gradient-alchemy": "linear-gradient(to bottom right, #E0C3FC, #8EC5FC)",
      },
    },
  },
  plugins: [],
};

export default config;
