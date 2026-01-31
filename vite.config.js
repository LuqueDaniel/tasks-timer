import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  // Relative base keeps built assets working on GitHub Pages subpaths.
  base: "./",
  plugins: [preact()],
});
