import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:5000",
      "/upload": "http://localhost:5000",
      "/drivers": "http://localhost:5000",
      "/orders": "http://localhost:5000",
      "/admin": "http://localhost:5000"
    }
  }
});
