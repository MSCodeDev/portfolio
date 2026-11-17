import type { APIRoute } from "astro";
import { execFileSync } from "node:child_process";
import { getCollection } from "astro:content";

// Built from the files in src/pages, so new pages are included automatically.
const pages = import.meta.glob("./*.astro");

// Data files that change what a page shows, beyond the page's own source
const dataFiles: Record<string, string[]> = {
  index: ["info", "projects", "timeline", "skills", "tags"],
  projects: ["projects", "tags"],
  resume: ["timeline", "skills"],
  terms: ["info"],
};

// Most recent commit date across a page's source files (undefined if git is unavailable)
function lastModified(name: string): string | undefined {
  const files = [
    `src/pages/${name}.astro`,
    ...(dataFiles[name] ?? []).map((file) => `src/data/${file}.json`),
  ];
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...files], {
      encoding: "utf8",
    }).trim();
    return date || undefined;
  } catch {
    return undefined;
  }
}

export const GET: APIRoute = async ({ site }) => {
  const pageUrls = Object.keys(pages)
    .map((file) => file.replace("./", "").replace(".astro", ""))
    .filter((name) => name !== "404" && name !== "blog")
    .sort()
    .map((name) => {
      const path = name === "index" ? "/" : `/${name}/`;
      const lastmod = lastModified(name);
      return `  <url><loc>${new URL(path, site).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
    });

  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const blogUrls = [
    `  <url><loc>${new URL("/blog/", site).href}</loc></url>`,
    ...posts.map(
      (post) =>
        `  <url><loc>${new URL(`/blog/${post.id}/`, site).href}</loc><lastmod>${post.data.pubDate.toISOString().slice(0, 10)}</lastmod></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pageUrls, ...blogUrls].join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
