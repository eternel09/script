import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F7FA",
        surface: "#FFFFFF",
        line: "#E3E8EF",
        ink: "#12202F",
        ink2: "#4A5563",
        muted: "#5A6472",
        navy: { DEFAULT: "#1F3A5F", dark: "#172C49" },
        accent: { DEFAULT: "#B85A0E", dark: "#9A4A0B", light: "#F6C08F" },
        wa: { DEFAULT: "#0F7A3E", dark: "#0C6232" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "16px" },
    },
  },
  plugins: [],
};
export default config;
