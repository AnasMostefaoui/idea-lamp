// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://idea-lamp-ilyes.pages.dev",
	output: "server",
	integrations: [
		mdx(),
		sitemap({
			// Exclude admin and API routes from sitemap
			filter: (page) =>
				!page.includes("/admin") && !page.includes("/api/"),
		}),
	],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
