import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { ACCENT } from "./theme.mjs";

const execFileAsync = promisify(execFile);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const css = `
  /* Spacing knobs: tune these to fill the page rather than editing individual rules */
  :root { --font: 9.75pt; --leading: 1.32; --section: 14px; --entry: 9px; --item: 1.5px; --project-gap: 6px; --accent: #${ACCENT}; --indent: 24px; }
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font: var(--font)/var(--leading) Calibri, Carlito, "Liberation Sans", Arial, sans-serif; color: #111; margin: 0; }
  a { color: inherit; text-decoration: none; }
  h1 { font-size: 26pt; font-weight: 400; margin: 0; text-align: center; }
  .contact, .headline { text-align: center; margin: 2px 0; }
  .headline { font-weight: 700; font-size: 11.5pt; margin-top: 3px; }
  .summary { text-align: center; margin: 6px 0 0; }
  .stack { color: #444; }
  h2 { font: 700 14pt/1.2 Calibri, Carlito, "Liberation Sans", Arial, sans-serif; color: var(--accent); margin: var(--section) 0 6px; padding-bottom: 2px; border-bottom: 1.5px solid var(--accent); break-after: avoid; }
  h3 { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #444; margin: var(--entry) 0 2px; break-after: avoid; }
  .row { display: flex; justify-content: space-between; gap: 12px; margin-top: var(--entry); }
  .row .head { font-weight: 700; font-size: 10.75pt; }
  .row .org { font-weight: 400; color: var(--accent); }
  .row .when { white-space: nowrap; }
  ul { margin: 3px 0 0; padding-left: var(--indent); }
  li { margin: var(--item) 0; padding-left: 2px; }
  li::marker { color: #333; }
  li.dated .dr { display: flex; justify-content: space-between; gap: 12px; }
  li.dated .when { white-space: nowrap; }
  li.proj { margin: var(--project-gap) 0 0; break-inside: avoid; }
  .proj .prow { display: flex; justify-content: space-between; gap: 12px; }
  .proj .prow .head { font-weight: 700; }
  .proj .prow .stk { color: var(--accent); }
  .proj .prow .when { white-space: nowrap; }
  .proj p { margin: 1px 0 0; }
  .projects h3 { margin-top: calc(var(--entry) + 4px); }
  .entry, li, .keep { break-inside: avoid; }
  /* Page 1 spacing is set separately so loosening it never pushes page 2 over */
  .p1 { --leading: 1.38; --section: 18px; --entry: 13px; --item: 1.8px; line-height: var(--leading); }
  h2.pb { break-before: page; margin-top: 0; }
`;

const bullets = (items) => (items.length ? `<ul>${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : "");

const entries = (items) =>
  items
    .map(
      (e) => `<div class="entry">
  <div class="row"><span><span class="head">${esc(e.title)}</span>${e.org ? ` <span class="org">| ${esc(e.org)}</span>` : ""}</span><span class="when">${esc(e.years ?? "")}</span></div>
  ${bullets(e.bullets)}
</div>`,
    )
    .join("\n");

const dated = (lines) =>
  `<ul>${lines.map((l) => `<li class="dated"><div class="dr"><span>${esc(l.text)}</span><span class="when">${esc(l.years)}</span></div></li>`).join("\n")}</ul>`;

export function renderHtml(m) {
  const contact = m.contact
    .map((c) => (c.href ? `<a href="${esc(c.href)}">${esc(c.text)}</a>` : esc(c.text)))
    .join("&nbsp;&nbsp;|&nbsp;&nbsp;");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(m.name)} Resume</title><style>${css}</style></head><body>
<h1>${esc(m.name)}</h1>
<div class="contact">${contact}</div>
${m.location.length ? `<div class="contact">${m.location.map(esc).join("&nbsp;&nbsp;|&nbsp;&nbsp;")}</div>` : ""}
<div class="headline">${esc(m.headline)}</div>
${m.summary ? `<p class="summary">${esc(m.summary)}</p>` : ""}

<div class="p1">
<h2>Work Experience</h2>
${entries(m.experience)}

<h2>Education and Training</h2>
${dated(m.educationLines)}

<h2>Skills</h2>
<ul class="keep">${m.skills.map((g) => `<li><b>${esc(g.label)}:</b> ${esc(g.items.join(", "))}.</li>`).join("\n")}</ul>
</div>

<h2 class="pb">Awards</h2>
${dated(m.awards.map((a) => ({ text: a.detail ? `${a.title} | ${a.detail}` : a.title, years: a.year })))}

<h2>Projects</h2>
<div class="projects">
${m.projects
  .map(
    (g) => `<h3>${esc(g.label)}</h3>
<ul>${g.entries.map((p) => `<li class="proj"><div class="prow"><span><span class="head">${esc(p.title)}</span>${p.stack.length ? ` <span class="stk">| ${esc(p.stack.join(", "))}</span>` : ""}</span><span class="when">${esc(p.years)}</span></div><p>${esc(p.description)}</p></li>`).join("\n")}</ul>`,
  )
  .join("\n")}
</div>

<h2>Interests</h2>
<ul><li>${esc(m.interests)}</li></ul>
</body></html>`;
}

const WINDOWS_BROWSERS = [
  "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
  "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe",
];
const LINUX_BROWSERS = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"];

const onPath = (bin) =>
  (process.env.PATH ?? "")
    .split(":")
    .map((d) => join(d, bin))
    .find((p) => existsSync(p));

/** CHROMIUM_PATH, then a Chrome/Chromium/Edge on PATH, then Windows Chrome/Edge when running under WSL. */
function findBrowser() {
  const found = [process.env.CHROMIUM_PATH, ...LINUX_BROWSERS.map(onPath), ...WINDOWS_BROWSERS].find(
    (p) => p && existsSync(p),
  );
  if (!found) throw new Error("No Chrome, Chromium or Edge found. Set CHROMIUM_PATH to a browser binary.");
  return found;
}

/** Renders the model to a PDF with the browser's headless --print-to-pdf, using a throwaway temp dir. */
export async function renderPdf(m) {
  const browser = findBrowser();
  const windows = browser.endsWith(".exe");
  // Windows executables need Windows-style paths
  const arg = (p) => (windows ? execFileSync("wslpath", ["-w", p], { encoding: "utf8" }).trim() : p);

  const workDir = mkdtempSync(join(tmpdir(), "resume-"));
  try {
    const html = join(workDir, "resume.html");
    const pdf = join(workDir, "resume.pdf");
    writeFileSync(html, renderHtml(m));

    await execFileAsync(
      browser,
      [
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        `--user-data-dir=${arg(join(workDir, "profile"))}`,
        `--print-to-pdf=${arg(pdf)}`,
        windows ? `file:///${arg(html).replace(/\\/g, "/")}` : `file://${html}`,
      ],
      { timeout: 60_000 },
    ).catch((e) => {
      // Edge/Chrome on Windows can exit non-zero after writing the file, so only fail if no PDF appeared
      if (!existsSync(pdf)) throw e;
    });
    if (!existsSync(pdf)) throw new Error(`${browser} did not produce a PDF`);
    return readFileSync(pdf);
  } finally {
    // the browser can hold the profile dir briefly after exiting
    rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
