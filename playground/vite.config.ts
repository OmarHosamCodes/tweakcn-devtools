import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tweakcnDevtools } from "../src/vite";

export default defineConfig({
  root: "playground",
  plugins: [react(), tweakcnDevtools()],
});
