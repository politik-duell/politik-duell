import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { pruefIndex } from './scripts/vite-pruef-index.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Kleiner Index der Themen für Prüfseite und Admin (Themendateien laden je Thema nach).
    pruefIndex(),
    // Service Worker: speichert nur die App selbst (HTML, JS, CSS, Icons), damit sie
    // installiert und ohne Netz startet. Anfragen an Supabase und die KI laufen
    // immer live – Spielstände oder Eingaben landen nie im Cache.
    VitePWA({
      registerType: 'autoUpdate',
      // Externe registerSW.js statt Inline-Skript (Content-Security-Policy: script-src 'self')
      injectRegister: 'script',
      // Das Manifest liegt schon in public/manifest.webmanifest.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        // Themendaten (nur Prüfseite und Admin) werden je Thema live geladen, nicht vorab.
        globIgnores: ['assets/daten/**'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Je Themendatei ein eigener Baustein unter assets/daten/ (vom Vorab-Cache ausgenommen).
        chunkFileNames: (chunk) =>
          chunk.facadeModuleId?.includes('/daten/themen/') ? 'assets/daten/[name]-[hash].js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
