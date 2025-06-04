import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import * as child_process from "node:child_process";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csrf: { checkOrigin: true },
    version: { name: child_process.execSync("npm pkg get version").toString().trim(), pollInterval: 10_000 },
  },
};

export default config;
