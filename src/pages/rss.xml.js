export const prerender = true;

import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";

export async function GET(context) {
	const comics = await getCollection("comics");
	const chapters = await getCollection("chapters");

	// Combine comics and chapters into a single feed, sorted by date
	const items = [
		...comics.map((comic) => ({
			title: comic.data.title,
			description: comic.data.description,
			pubDate: comic.data.pubDate,
			link: `/comics/${comic.id}/`,
		})),
		...chapters.map((chapter) => ({
			title: `${chapter.data.comicSlug.replace(/-/g, ' ')} — Chapter ${chapter.data.chapterNumber}: ${chapter.data.title}`,
			description: `New chapter released! Read Chapter ${chapter.data.chapterNumber} now.`,
			pubDate: chapter.data.pubDate,
			link: `/comics/${chapter.data.comicSlug}/${chapter.id.split('/').pop()}/`,
		})),
	].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items,
		customData: `<language>en-us</language>`,
	});
}
