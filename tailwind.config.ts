import type { Config } from "tailwindcss";

/** La variable la define `app/layout.tsx` con `next/font/google`. */
const SPARTAN = [
  "var(--font-league-spartan)",
  "League Spartan",
  "system-ui",
  "sans-serif",
];

/**
 * Paleta institucional IEBS — dirección visual "1c Vitrina clara".
 * Los valores salen tal cual del prototipo de Claude Design.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B2545",
          600: "#153A6B",
          900: "#061527",
        },
        red: {
          DEFAULT: "#C8102E",
          hover: "#E31B3D",
          dark: "#8E0B20",
          soft: "#FF8095",
          live: "#FF3B54",
        },
        cream: {
          DEFAULT: "#FAF8F4",
          field: "#FCFBF9",
          deep: "#E8E6E1",
        },
        ink: {
          DEFAULT: "#0B2545",
          body: "#4B5C70",
          soft: "#5A6B80",
          muted: "#8494A6",
          faint: "#9AA8B6",
          note: "#6B7280",
        },
        result: {
          win: "#1F9D55",
          draw: "#B7BEC7",
          loss: "#C8102E",
        },
        state: {
          ok: "#7CE0A5",
          warn: "#8A6A00",
          "warn-bg": "rgba(202,163,0,.14)",
          info: "#1E3A8A",
        },
        sport: {
          microfutbol: "#C8102E",
          baloncesto: "#1E3A8A",
          voley: "#0F766E",
          balonmano: "#B45309",
          ajedrez: "#0B2545",
          pingpong: "#7C3AED",
          sky: "#0EA5E9",
          pink: "#DB2777",
          slate: "#475569",
        },
      },
      borderColor: {
        hairline: "rgba(11,37,69,.08)",
        "hairline-soft": "rgba(11,37,69,.06)",
        "hairline-strong": "rgba(11,37,69,.18)",
        "on-navy": "rgba(255,255,255,.12)",
      },
      // Una sola familia, tres nombres. `display`, `sans` y `narrow` marcan la
      // intención de cada texto —titular, cuerpo, antetítulo— y hoy los tres
      // resuelven a League Spartan. Conservarlos evita tocar cientos de
      // componentes y deja la puerta abierta a volver a separarlos.
      fontFamily: {
        display: SPARTAN,
        sans: SPARTAN,
        narrow: SPARTAN,
      },
      letterSpacing: {
        tightest: "-.04em",
        "display-tight": "-.035em",
        eyebrow: ".16em",
        "eyebrow-wide": ".2em",
        crest: ".24em",
      },
      borderRadius: {
        card: "18px",
        tile: "16px",
        field: "10px",
        frame: "20px",
      },
      boxShadow: {
        card: "0 18px 36px -30px rgba(11,37,69,.7)",
        "card-hover": "0 34px 52px -32px rgba(11,37,69,.6)",
        lift: "0 40px 60px -34px rgba(11,37,69,.6)",
        row: "0 30px 46px -34px rgba(11,37,69,.65)",
        cta: "0 18px 34px -18px rgba(200,16,46,.95)",
        "cta-sm": "0 16px 30px -16px rgba(200,16,46,.9)",
        frame: "0 50px 100px -45px rgba(11,37,69,.5)",
        stage: "0 40px 90px -40px rgba(11,37,69,.35)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        spinRing: {
          from: { transform: "rotateX(72deg) rotateZ(0deg)" },
          to: { transform: "rotateX(72deg) rotateZ(360deg)" },
        },
        tick: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".25" },
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseglow: {
          "0%,100%": { opacity: ".35" },
          "50%": { opacity: ".7" },
        },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        ring: "spinRing 22s linear infinite",
        "ring-slow": "spinRing 34s linear infinite reverse",
        tick: "tick 1.6s ease-in-out infinite",
        "tick-fast": "tick 1.5s ease-in-out infinite",
        "rise-in": "riseIn .35s ease both",
        "rise-in-fast": "riseIn .3s ease both",
        pulseglow: "pulseglow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
