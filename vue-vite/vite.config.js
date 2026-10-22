import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";
const base = isGitHubPagesBuild ? "/momentum-TFP/" : "/";
const removeLegacyExploreScripts = {
	name: "remove-legacy-explore-scripts",
	transformIndexHtml(html) {
		return html
			.replace(/\s*<script src="javascript\/filters\.js" defer><\/script>/, "")
			.replace(/\s*<script src="javascript\/filter-scroll\.js" defer><\/script>/, "");
	}
};

export default defineConfig({
	root: projectRoot,
	base,
	plugins: [vue(), removeLegacyExploreScripts],
	server: {
		open: `${base}explorar.html`,
		fs: { allow: [projectRoot] }
	},
	build: {
		outDir: fileURLToPath(new URL("./dist", import.meta.url)),
		emptyOutDir: true,
		rollupOptions: {
			input: fileURLToPath(new URL("../explorar.html", import.meta.url))
		}
	}
});
