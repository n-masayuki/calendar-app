import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["PUBLIC_URL", "PORT"]);

  return {
    plugins: [react()],
    // Keep existing .env files compatible with the calendar component.
    envPrefix: ["VITE_", "REACT_APP_"],
    base: process.env.PUBLIC_URL || env.PUBLIC_URL || "/",
    server: {
      port: Number(process.env.PORT || env.PORT || 3000),
    },
    build: { outDir: "build" },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/setupTests.js"],
    },
  };
});
