import { defineConfig } from "vite";
import { TanStackStartVite } from "@tanstack/react-start/plugin";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackStartVite(), // This defaults to a standard Node/Bun server build!
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});
