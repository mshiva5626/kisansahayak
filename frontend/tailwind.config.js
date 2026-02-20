/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#13ec6d",
        "primary-dark": "#0eb553",
        "background-light": "#f6f8f7",
        "background-dark": "#102218",
        "surface-light": "#ffffff",
        "surface-dark": "#1c3326",
        "neutral-surface": "#eef2f0",
        "neutral-custom": "#4a5550",
        "neutral-text": "#4A4036",
        "neutral-border": "#E6DCCF",
        "alert-amber": "#eebd2b",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "public-sans": ["Public Sans", "sans-serif"],
        "space-grotesk": ["Space Grotesk", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        "glow": "0 0 15px rgba(19, 236, 109, 0.3)",
        "soft": "0 4px 20px -2px rgba(19, 236, 109, 0.1)",
        "glass": "0 8px 32px 0 rgba(238, 189, 43, 0.1)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { top: '100%', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
