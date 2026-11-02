import type { APIRoute } from "astro";

// Built from the files in src/pages, so new pages are included automatically.
const pages = import.meta.glob("./*.astro");

export const GET: APIRoute = ({ site }) => {
  const urls = Object.keys(pages)
    .map((file) => file.replace("./", "").replace(".astro", ""))
    .filter((name) => name !== "404")
    .map((name) => (name === "index" ? "/" : `/${name}/`))
    .sort()
    .map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
