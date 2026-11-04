import { existsSync, readFileSync } from "node:fs";

const dataDir = new URL("../../src/data/", import.meta.url);

const read = (name, fallback) => {
  const url = new URL(`${name}.json`, dataDir);
  return existsSync(url) ? JSON.parse(readFileSync(url, "utf8")) : fallback;
};

const projectSections = [
  ["work", "Work Projects"],
  ["freelance", "Freelance Work"],
  ["community", "Community Work"],
  ["personal", "Personal Projects"],
];

// Project tags are lowercase filter slugs; src/data/tags.json holds their display names (shared with the website)
const tagLabels = read("tags", {});
const tagLabel = (tag) => tagLabels[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);

// Project tags that stay on the website but are left out of the CV stack lines
const resumeHiddenTags = new Set(["rest", "docker", "aspnet", "ef", "jest", "vitest", "playwright", "drupal", "wordpress", "drizzle", "entra"]);

const bare = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const years = (p) => {
  if (p.resume.years) return p.resume.years;
  return p.endYear && p.endYear !== p.startYear ? `${p.startYear} to ${p.endYear}` : `${p.startYear}`;
};

/** Everything the DOCX, PDF and platform copy need, derived from src/data/*.json. */
export function buildModel() {
  const info = read("info");
  const timeline = read("timeline", []);
  const skills = read("skills");
  const projects = read("projects", []);
  const priv = read("private", {});

  const onResume = timeline.filter((e) => e.resume !== false);
  const bullets = (e) => e.resumeItems ?? e.items ?? (e.type === "experience" && e.shortDescription ? [e.shortDescription] : []);
  const entry = (e) => ({ title: e.title, org: e.subtitle, years: e.year, bullets: bullets(e) });

  // Certifications list each item as its own line; a degree is a single line
  const educationLines = onResume
    .filter((e) => e.type === "education")
    .sort((a, b) => Number(!!b.resumeFirst) - Number(!!a.resumeFirst))
    .flatMap((e) => {
      const items = bullets(e);
      return (items.length ? items : [e.title]).map((text) => ({ text: `${text}, ${e.subtitle}`, years: e.year }));
    });

  const linkedin = info.socials.find((s) => s.label === "LinkedIn");
  const contact = [
    { text: info.business.email, href: `mailto:${info.business.email}` },
    linkedin && { text: bare(linkedin.href), href: linkedin.href },
    info.website && { text: bare(info.website), href: info.website },
  ].filter(Boolean);

  const skillGroups = [];
  for (const stack of skills.stacks) {
    const label = stack.resumeGroup ?? stack.title;
    const group = skillGroups.find((g) => g.label === label);
    if (group) group.items.push(...stack.items);
    else skillGroups.push({ label, items: [...stack.items] });
  }
  if (skills.proficiencies?.length) skillGroups.push({ label: "Proficiencies", items: skills.proficiencies });

  const byRecency = (a, b) => b.startYear - a.startYear || a.title.localeCompare(b.title);
  const projectGroups = projectSections
    .map(([key, label]) => ({
      label,
      entries: projects
        .filter((p) => p.resume?.category === key)
        .sort(byRecency)
        .map((p) => ({ title: p.title, years: years(p), description: p.description, stack: (p.tags ?? []).filter((t) => !resumeHiddenTags.has(t)).map(tagLabel) })),
    }))
    .filter((g) => g.entries.length);

  return {
    name: info.name,
    headline: info.resume.headline,
    // The summary is the site bio, so the two can't drift apart
    // Drops the leading role ("{role} with ...") so the summary doesn't repeat the headline directly above it
    summary: info.bio.replace(/^\{role\}\s+with\s+/, "").replace("{role}", info.role).replace(/^./, (c) => c.toUpperCase()),
    location: [priv.phone, info.resume.location, info.resume.availability].filter(Boolean),
    contact,
    experience: onResume.filter((e) => e.type === "experience").map(entry),
    education: onResume.filter((e) => e.type === "education").map(entry),
    educationLines,
    awards: onResume
      .filter((e) => e.type === "award")
      .sort((a, b) => Number(!!b.resumeFirst) - Number(!!a.resumeFirst))
      .map((e) => ({ title: e.title, detail: e.subtitle, year: e.year })),
    skills: skillGroups,
    projects: projectGroups,
    interests: info.resume.interests,
  };
}
