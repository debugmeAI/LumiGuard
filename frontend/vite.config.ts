import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";

export default defineConfig({
	plugins: [react(), tailwindcss(), Inspect()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	base: "/lumiguard/",
	server: {
		proxy: {
			"/socket.io": {
				target: "http://localhost:1313",
				ws: true,
			},
		},
	},
});
