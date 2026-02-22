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
        "primary": "#13ec13", // Updated from new designs (neon green)
        "primary-dark": "#0db80d", // Adjusted matching dark green
        "background-light": "#f6f8f6",
        "background-dark": "#102210",
        "surface-light": "#ffffff",
        "surface-dark": "#1a2e1a", // Merged from diverse surface definitions
        "neutral-surface": "#eef2f0",
        "neutral-custom": "#4a5550",
        "neutral-text": "#4A4036",
        "neutral-border": "#E6DCCF",
        "brand-green": "#5d8a2a",
        "brand-blue": "#205493",
        "trend-up": "#16a34a",
        "trend-down": "#dc2626",
        "alert-amber": "#eebd2b",
      },
      fontFamily: {
        "display": ["Public Sans", "Inter", "sans-serif"],
        "public-sans": ["Public Sans", "sans-serif"],
        "lexend": ["Lexend", "sans-serif"],
        "space-grotesk": ["Space Grotesk", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        "full": "9999px"
      },
      boxShadow: {
        "glow": "0 0 12px rgba(19, 236, 19, 0.3)",
        "glow-strong": "0 0 20px rgba(19, 236, 19, 0.4)",
        "soft": "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        "glass": "0 8px 32px 0 rgba(19, 236, 19, 0.1)",
        "card": "0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)",
        "premium": "0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        "input": "0 2px 6px rgba(19, 236, 19, 0.08)",
      },
      backgroundImage: {
        'farmer-pattern': "url('https://images.unsplash.com/photo-1595267175252-47517c2dc1b9?q=80&w=1000&auto=format&fit=crop')",
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
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
