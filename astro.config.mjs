// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

export default defineConfig({
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: "cloudflare",
  }),

  integrations: [svelte()],
});
