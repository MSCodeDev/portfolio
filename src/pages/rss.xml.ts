import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import info from "@/data/info.json";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const siteUrl = new URL("/", site).href;
  const feedUrl = new URL("/rss.xml", site).href;

  const items = posts.map((post) => {
    const link = new URL(`/blog/${post.id}/`, site).href;
    const categories = post.data.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n");
    return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
      <author>${escapeXml(info.business.email)} (${escapeXml(post.data.author)})</author>
${categories}
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(info.meta.ogSiteName)} Blog</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(info.meta.description)}</description>
    <language>en-za</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
