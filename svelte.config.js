import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter(), csrf: { checkOrigin: true }, version: { name: "2.0.0", pollInterval: 10_000 }, env: { dir: "env" } },
};

export default config;
