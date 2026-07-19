/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// The base path must match the GitHub Pages repository subpath.
// Override with VITE_BASE_PATH at build time if the repository is renamed.
const basePath = process.env.VITE_BASE_PATH ?? "/localtaboo/";

const THEME_COLOR = "#0d0d0f";
const BACKGROUND_COLOR = "#f7f6f2";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/mask-icon.svg", "offline.html"],
      manifest: {
        name: "WORDLOCK",
        short_name: "WORDLOCK",
        description: "A fast word game for one screen or many.",
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        display: "standalone",
        orientation: "any",
        start_url: basePath,
        scope: basePath,
        categories: ["games", "entertainment"],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,json}"],
        navigateFallback: `${basePath}index.html`,
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    css: false,
    exclude: ["**/node_modules/**", "**/e2e/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      include: ["src/game/**", "src/network/**", "src/storage/**", "src/utils/**"],
    },
  },
});
