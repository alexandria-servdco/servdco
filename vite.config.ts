import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("pdfjs-dist")) return "vendor-pdf";
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("@sentry")) return "vendor-sentry";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@marsidev/react-turnstile")) return "vendor-turnstile";
          if (id.includes("react-dom") || id.includes("react-router")) {
            return "vendor-react";
          }
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("date-fns")) return "vendor-dates";
          if (id.includes("zod")) return "vendor-zod";
          if (id.includes("dompurify")) return "vendor-sanitize";
          return "vendor-misc";
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
      // Rolldown hoists `import ws from "ws"` from supabase error-message strings.
      ws: path.resolve(__dirname, "./client/lib/supabase/wsStub.ts"),
    },
  },
}));