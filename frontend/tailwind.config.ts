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
        // ── Brain Cache brand palette ──────────────────────────────────────
        bc: {
          navy:   "#1A1B3A",
          900:    "#1E1F4A",
          800:    "#25275A",
          700:    "#2E3070",
          600:    "#3D3F8F",
          accent: "#6C5CE7",
          violet: "#A855F7",
          teal:   "#2DD4BF",
          soft:   "#EDE9FE",
          muted:  "#C4B5FD",
        },
        // Surface scale (light mode)
        surface: {
          base:   "#F5F5FA",
          raised: "#FFFFFF",
          over:   "#EEEEF8",
          border: "#E2E2EE",
          muted:  "#C8C8D8",
        },
        // Text scale
        copy: {
          primary:  "#1A1B3A",
          secondary:"#5A5B7A",
          muted:    "#8A8BAA",
          disabled: "#B8B9CC",
        },
        // Status
        cache: {
          hit:  "#10B981",
          miss: "#F59E0B",
          err:  "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "bc-gradient":      "linear-gradient(135deg, #6C5CE7 0%, #2DD4BF 100%)",
        "bc-gradient-soft": "linear-gradient(135deg, #A855F7 0%, #6C5CE7 100%)",
        "bc-gradient-brain":"linear-gradient(135deg, #EC4899 0%, #A855F7 50%, #6C5CE7 100%)",
        "neural-mesh": `radial-gradient(circle at 25% 25%, rgba(108,92,231,0.15) 0%, transparent 50%),
                        radial-gradient(circle at 75% 75%, rgba(45,212,191,0.10) 0%, transparent 50%)`,
      },
      boxShadow: {
        "bc-glow":    "0 0 24px rgba(108,92,231,0.4)",
        "bc-sm":      "0 0 10px rgba(108,92,231,0.25)",
        "teal-glow":  "0 0 16px rgba(45,212,191,0.3)",
        card:         "0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)",
        "card-hover": "0 0 0 1px rgba(108,92,231,0.25), 0 4px 16px rgba(0,0,0,0.10)",
        xs:           "0 1px 2px rgba(0,0,0,0.08)",
        sm:           "0 1px 3px rgba(0,0,0,0.12)",
      },
      keyframes: {
        "fade-up":  { from: { opacity:"0", transform:"translateY(8px)" }, to: { opacity:"1", transform:"translateY(0)" } },
        "fade-in":  { from: { opacity:"0" }, to: { opacity:"1" } },
        blink:      { "0%,100%": { opacity:"1" }, "50%": { opacity:"0" } },
        "pulse-dot":{ "0%,100%": { transform:"scale(1)", opacity:"1" }, "50%": { transform:"scale(1.5)", opacity:"0.5" } },
        shimmer:    { from: { backgroundPosition:"200% 0" }, to: { backgroundPosition:"-200% 0" } },
        "spin-slow":{ from: { transform:"rotate(0deg)" }, to: { transform:"rotate(360deg)" } },
      },
      animation: {
        "fade-up":  "fade-up 0.25s ease-out",
        "fade-in":  "fade-in 0.2s ease-out",
        blink:      "blink 0.9s step-start infinite",
        "pulse-dot":"pulse-dot 1.2s ease-in-out infinite",
        shimmer:    "shimmer 2.5s linear infinite",
        "spin-slow":"spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
