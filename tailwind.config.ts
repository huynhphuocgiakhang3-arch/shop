import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // A5 — Color System
        bg: {
          primary: "#05070C",
          secondary: "#0A111B"
        },
        glass: {
          surface: "rgba(255,255,255,0.06)",
          border: "rgba(255,255,255,0.12)"
        },
        accent: {
          orange: "#FF8A3D",
          "orange-deep": "#E8672A",
          blue: "#3D8BFF"
        },
        state: {
          success: "#3DDC84",
          warning: "#F5B84E",
          danger: "#FF5C5C",
          info: "#3D8BFF"
        }
      },
      spacing: {
        "4.5": "18px" // fine-tuning helper, base scale below covers 4–128
      },
      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        pill: "999px"
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.20)",
        sm: "0 2px 8px rgba(0,0,0,0.24)",
        md: "0 8px 24px rgba(0,0,0,0.28)",
        lg: "0 16px 48px rgba(0,0,0,0.32)",
        xl: "0 24px 72px rgba(0,0,0,0.36)",
        floating: "0 30px 90px rgba(255,138,61,0.10), 0 8px 24px rgba(0,0,0,0.30)",
        "glow-orange": "0 0 0 1px rgba(255,138,61,0.35), 0 0 32px rgba(255,138,61,0.25)"
      },
      backdropBlur: {
        glass: "20px"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      fontSize: {
        display: ["clamp(2.75rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        hero: ["clamp(2rem, 3.4vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        h1: ["2.25rem", { lineHeight: "1.2" }],
        h2: ["1.875rem", { lineHeight: "1.25" }],
        h3: ["1.5rem", { lineHeight: "1.3" }],
        h4: ["1.25rem", { lineHeight: "1.35" }],
        title: ["1.125rem", { lineHeight: "1.4" }],
        subtitle: ["1rem", { lineHeight: "1.5" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.5" }],
        overline: ["0.6875rem", { lineHeight: "1.5", letterSpacing: "0.12em" }]
      },
      transitionDuration: {
        hover: "120ms",
        click: "180ms",
        standard: "250ms",
        large: "400ms",
        page: "700ms",
        intro: "1500ms",
        entrance: "1400ms"
      },
      transitionTimingFunction: {
        // Keep this in sync with EASE_PREMIUM in src/lib/motion.ts and
        // --khv-ease-premium in globals.css — same curve, three different
        // places it's needed (Tailwind utilities, Framer Motion, plain CSS).
        premium: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      keyframes: {
        "breathe-glow": {
          "0%, 100%": { opacity: "0.55", filter: "blur(0px)" },
          "50%": { opacity: "1", filter: "blur(0.5px)" }
        },
        "drift-up": {
          "0%": { transform: "translateY(0px)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(-120px)", opacity: "0" }
        },
        "shooting-star": {
          "0%": { transform: "translate(0,0)", opacity: "0" },
          "5%": { opacity: "1" },
          "100%": { transform: "translate(-420px, 220px)", opacity: "0" }
        },
        "aurora-drift": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-24px, 16px) scale(1.05)" }
        },
        "fog-sway": {
          "0%, 100%": { transform: "translateX(0px)" },
          "50%": { transform: "translateX(20px)" }
        },
        "camera-breathe": {
          "0%, 100%": { transform: "scale(1) translateY(0px)" },
          "50%": { transform: "scale(1.006) translateY(-2px)" }
        }
      },
      animation: {
        "breathe-glow": "breathe-glow 3.2s ease-in-out infinite",
        "drift-up": "drift-up linear infinite",
        "shooting-star": "shooting-star 1.4s cubic-bezier(0.22,1,0.36,1) forwards",
        "camera-breathe": "camera-breathe 8s ease-in-out infinite",
        "aurora-drift": "aurora-drift 26s ease-in-out infinite",
        "fog-sway": "fog-sway 18s ease-in-out infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
