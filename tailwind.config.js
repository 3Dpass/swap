/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        "unbounded-variable": ["UnboundedVariable", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        pink: {
          DEFAULT: "#14532d",
        },
        ghost: {
          100: "#14532d1A",
          200: "#14532d33",
        },
        purple: {
          50: "#FBFCFE",
          100: "#F3F5FB",
          200: "#E6EAF6",
          300: "#DAE0F2",
          400: "#6331F5",
          500: "#6D3AEE",
          600: "#442299",
          700: "#321D47",
          800: "#28123E",
          900: "#1C0533",
          925: "#160527",
          950: "#140523",
        },
        cyan: {
          500: "#00B2FF",
          600: "#00A6ED",
          700: "#0094D4",
        },
        green: {
          500: "#56F39A",
          600: "#51E591",
          700: "#48CC81",
        },
        lime: {
          500: "#D3FF33",
          600: "#BEE52E",
          700: "#A9CC29",
        },
        yellow: {
          100: "#FFF9E9",
        },
        gray: {
          10: "#FFFFFF4D",
          50: "#0000000F",
          100: "#00000059",
          200: "#00000080",
          300: "#000000B2",
          400: "#000000E5",
        },
        warning: "#FFF9E9",
        // Dark theme colors
        dark: {
          bg: {
            primary: "#0F0F0F",
            secondary: "#1A1A1A",
            tertiary: "#2A2A2A",
            card: "#1E1E1E",
            modal: "#252525",
          },
          text: {
            primary: "#FFFFFF",
            secondary: "#B3B3B3",
            tertiary: "#808080",
            muted: "#666666",
          },
          border: {
            primary: "#333333",
            secondary: "#404040",
            accent: "#555555",
          },
        },
        
      },
      backgroundImage: {
        "placeholder-tokens": "linear-gradient(90deg, #F1EFEF -24.18%, #F9F8F8 50.26%, #E7E5E5 114.84%)",
      },
      boxShadow: {
        "modal-box-shadow":
          "0px 0px 0px 0px rgba(226, 228, 233, 0.10), 3px 12px 27px 0px rgba(226, 228, 233, 0.10), 13px 48px 50px 0px rgba(226, 228, 233, 0.09), 29px 108px 67px 0px rgba(226, 228, 233, 0.05), 52px 193px 80px 0px rgba(226, 228, 233, 0.01), 82px 301px 87px 0px rgba(226, 228, 233, 0.00)",
      },
      fontSize: {
        "heading-1": "48px",
        "heading-2": "40px",
        "heading-3": "33px",
        "heading-4": "28px",
        "heading-5": "23px",
        "heading-6": "19px",
        "extra-large": "18px",
        large: "16px",
        medium: "13px",
        small: "11px",
      },
    },
  },
  plugins: [],
};
