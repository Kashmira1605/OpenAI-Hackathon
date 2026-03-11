import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: "#F8F3EA",
        cream: "#FFFDF8",
        ember: "#C65D27",
        emberDark: "#8C3C16",
        ink: "#231815",
        olive: "#5B6C4F",
        mist: "#E9E1D3"
      },
      boxShadow: {
        card: "0 18px 40px rgba(35, 24, 21, 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
