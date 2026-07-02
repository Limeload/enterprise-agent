import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette — tsenta-inspired minimal monochromatic
        ink: {
          950: "#0A0A0A",
          900: "#111111",
          800: "#1C1C1C",
          700: "#2E2E2E",
          600: "#404040",
          500: "#525252",
          400: "#737373",
          300: "#A3A3A3",
          200: "#D4D4D4",
          100: "#E5E5E5",
          50:  "#F5F5F5",
        },
        // Single accent for interactive elements
        accent: {
          DEFAULT: "#0A0A0A",
          hover:   "#2E2E2E",
          muted:   "#F5F5F5",
        },
        // Status colours
        success: "#16A34A",
        warning: "#D97706",
        danger:  "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        xs:  "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm:  "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        md:  "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        lg:  "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
        xl:  "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
        card: "0 0 0 1px rgb(0 0 0 / 0.06), 0 2px 8px rgb(0 0 0 / 0.06)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "pulse-dot": { "0%, 100%": { transform: "scale(1)", opacity: "1" }, "50%": { transform: "scale(1.4)", opacity: "0.6" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        blink: "blink 1s step-end infinite",
        "pulse-dot": "pulse-dot 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
