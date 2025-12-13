import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: "#E0E0E0",
          },
        },
        invert: {
          css: {
            color: "#E0E0E0", // body text (softer than white)
            "--tw-prose-body": "#E0E0E0",
            "--tw-prose-headings": "#F2F2F2",
            "--tw-prose-links": "#90CAF9",
            "--tw-prose-bold": "#F2F2F2",
            "--tw-prose-counters": "#A8A8A8",
            "--tw-prose-bullets": "#A8A8A8",
            "--tw-prose-hr": "#2A2A2A",
            "--tw-prose-quotes": "#D0D0D0",
            "--tw-prose-quote-borders": "#2A2A2A",
            "--tw-prose-captions": "#A8A8A8",
            "--tw-prose-code": "#F0F0F0",
            "--tw-prose-pre-code": "#E5E7EB",
            "--tw-prose-pre-bg": "#0B1220",
            "--tw-prose-th-borders": "#2A2A2A",
            "--tw-prose-td-borders": "#2A2A2A",
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
