// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["logo.png", "apple-touch-icon.png"],

      // manifest: {
      //   name: "Global Residency Tracker",
      //   short_name: "GRT",

      //   description: "Track travel history and residency status worldwide.",

      //   theme_color: "#4f46e5",
      //   background_color: "#ffffff",

      //   display: "standalone",
      //   display_override: ["fullscreen", "standalone"],
      manifest: {
        name: "Global Residency Tracker",
        short_name: "GRT",

        description: "Track travel history and residency status worldwide.",

        theme_color: "#4f46e5",
        background_color: "#ffffff",

        display: "standalone",
        display_override: ["fullscreen", "standalone"],
        // Added explicit background color attributes to correctly render transparent images nicely without rendering defaults as dark layouts
        background_color: "#ffffff",
        theme_color: "#4f46e5",
        orientation: "portrait",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            // Set to "any maskable" so the engine handles resolution boundaries and spacing layout correctly
            purpose: "any maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            // Set to "any maskable" to match layout scaling rules uniformly
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});