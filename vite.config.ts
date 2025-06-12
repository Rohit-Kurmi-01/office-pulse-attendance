import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
     VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.ico', 'https://meditreehealthcare.in/wp-content/uploads/2024/06/Meditree-Healthcare.png'],
      manifest: {
        name: 'MDR Attendance',
        short_name: 'Meditree R',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: 'https://meditreehealthcare.in/wp-content/uploads/2024/06/Meditree-Healthcare.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://meditreehealthcare.in/wp-content/uploads/2024/06/Meditree-Healthcare.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    process.env.VITE_ENABLE_PWA === "true" ? VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.ico', 'https://meditreehealthcare.in/wp-content/uploads/2024/06/Meditree-Healthcare.png'],
      manifest: {
        name: 'MDR Attendance',
        short_name: 'Meditree',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: 'https://meditreehealthcare.in/wp-content/uploads/2024/06/Meditree-Healthcare.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://meditreehealthcare.in/wp-content/uploads/2024/06/Meditree-Healthcare.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }) : null
   
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
