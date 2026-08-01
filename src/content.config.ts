import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

const comics = defineCollection({
	loader: glob({ base: "./src/content/comics", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		coverImage: z.string(),
		genre: z.array(z.string()).optional().default([]),
		tags: z.array(z.string()).optional().default([]),
		status: z.enum(["ongoing", "completed"]).default("ongoing"),
		featured: z.boolean().default(false),
		curatedMoment: z.boolean().default(false),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
	}),
});

const chapters = defineCollection({
	loader: glob({ base: "./src/content/chapters", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		comicSlug: z.string(),
		title: z.string(),
		chapterNumber: z.number(),
		pages: z.array(z.string()),
		pubDate: z.coerce.date(),
	}),
});

export const collections = { blog, comics, chapters };
