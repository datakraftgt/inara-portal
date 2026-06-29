import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover:   "var(--color-primary-hover)",
          light:   "var(--color-primary-light)",
          dark:    "var(--color-primary-dark)",
        },
        app:   "var(--color-app-bg)",
        beige: {
          dark: "var(--color-beige-dark)",
        },
      },
      width: {
        sidebar: "200px",
      },
      height: {
        topbar: "52px",
      },
    },
  },
  plugins: [],
};

export default config;
