import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple"; // Use /simple for basic setup
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		react(),
		electron({
			main: {
				// Main process entry file
				entry: "src/main/main.ts", // Adjust path if your entry point is different
			},
			preload: {
				// Preload script entry file
				input: "src/main/preload.ts", // Adjust path if your preload script is different
			},
			// Optional: Renderer process configuration (often handled by Vite itself)
			// renderer: {},
		}),
	],
});
