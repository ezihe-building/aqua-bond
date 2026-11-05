import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  const nativeBuild = process.env.CAPACITOR_BUILD === "1";
  const vercelBuild = process.env.VERCEL === "1";
  return {
    base: nativeBuild ? "./" : vercelBuild ? "/" : command === "build" ? "/aqua-bond/" : "/",
    resolve: {
      alias: nativeBuild ? [{
        find: "/src/main.web.tsx",
        replacement: fileURLToPath(new URL("./src/main.native.tsx", import.meta.url)),
      }] : [],
    },
    plugins: [react()],
  };
});
