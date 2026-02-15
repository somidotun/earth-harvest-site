import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
    },
  },
  define: {
    global: "globalThis",
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://hncnrjmdkbpszblrieka.supabase.co"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY25yam1ka2Jwc3pibHJpZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5NDYsImV4cCI6MjA3NTYxNDk0Nn0.j5j-MDRNM7GNphNmZjY-KqLp4rAxs2_Cu2HE0eyeMRs"),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
}));
