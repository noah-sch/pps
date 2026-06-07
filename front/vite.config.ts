import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @tauri-apps/cli sets TAURI_DEV_HOST when targeting a physical mobile device.
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/ — tuned for Tauri (fixed port, mobile host, no clear screen).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Prevent Vite from obscuring Rust errors.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      // Don't watch the Rust backend.
      ignored: ["**/src-tauri/**"],
    },
  },
  // Tauri serves a static, relative build.
  build: {
    target: "es2021",
    sourcemap: false,
  },
});
