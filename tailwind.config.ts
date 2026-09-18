import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#0f766e",
          dark: "#0a5c56",
          soft: "#ecfdf5",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(15,118,110,0.18), transparent), radial-gradient(ellipse 60% 50% at 80% 10%, rgba(234,88,12,0.12), transparent), linear-gradient(180deg, #ecfdf5 0%, #f4f7f6 45%, #eef2f1 100%)",
        "dash-grid":
          "linear-gradient(to right, rgba(15,118,110,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,118,110,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
