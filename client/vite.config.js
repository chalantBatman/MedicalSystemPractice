import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/patients": "http://localhost:3000",
      "/appointments": "http://localhost:3000",
      "/auth": "http://localhost:3000",
      "/doctors": "http://localhost:3000",
      "/users": "http://localhost:3000",
      "/doctor": "http://localhost:3000",
      "/staff": "http://localhost:3000",
    },
  },
});

