import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { mono: ["'IBM Plex Mono'", "monospace"] },
    },
  },
  plugins: [],
};
export default config;
