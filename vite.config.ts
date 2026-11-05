import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: process.env.CAPACITOR_BUILD === "1" ? "./" : command === "build" ? "/aqua-bond/" : "/",
  plugins: [react()],
}));
