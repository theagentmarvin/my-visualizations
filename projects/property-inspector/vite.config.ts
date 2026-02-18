import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["web-ifc"],
  },
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
  },
  base: "./",
});
