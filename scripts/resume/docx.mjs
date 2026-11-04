import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import { ACCENT } from "./theme.mjs";

const FONT = "Calibri";
const BODY = 21; // half-points (10.5pt)
const MARGIN = 1020; // twips
const CONTENT_WIDTH = 11906 - MARGIN * 2; // A4

const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: BODY, ...opts });

const heading = (text, extra = {}) =>
  new Paragraph({
    spacing: { before: 260, after: 100 },
    keepNext: true,
    ...extra,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 2 } },
    children: [run(text, { bold: true, size: 28, color: ACCENT })],
  });

const bullet = (children, extra = {}) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 40 },
    ...extra,
    children: typeof children === "string" ? [run(children)] : children,
  });

// A bullet with a right-aligned date, as used for education and awards
const datedBullet = (text, years) =>
  bullet([run(text), run(`\t${years}`)], { tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }] });

const titleLine = (title, org, right) =>
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
    spacing: { before: 160, after: 40 },
    keepNext: true,
    children: [
      run(title, { bold: true, size: 22 }),
      ...(org ? [run(`  |  ${org}`, { color: ACCENT })] : []),
      run(`\t${right ?? ""}`),
    ],
  });

const contactLine = (contact) => {
  const children = [];
  contact.forEach((c, i) => {
    if (i) children.push(run("  |  "));
    const r = run(c.text);
    children.push(c.href ? new ExternalHyperlink({ link: c.href, children: [r] }) : r);
  });
  return new Paragraph({ alignment: AlignmentType.CENTER, children });
};

const entries = (list) => list.flatMap((e) => [titleLine(e.title, e.org, e.years), ...e.bullets.map((b) => bullet(b))]);

export async function renderDocx(m) {
  const doc = new Document({
    creator: m.name,
    title: `${m.name} Resume`,
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 270 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { size: { width: 11906, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } },
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [run(m.name, { size: 48 })] }),
          contactLine(m.contact),
          ...(m.location.length ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(m.location.join("  |  "))] })] : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60 },
            children: [run(m.headline, { bold: true, size: 24 })],
          }),

          ...(m.summary
            ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [run(m.summary)] })]
            : []),

          heading("Work Experience"),
          ...entries(m.experience),

          heading("Education and Training"),
          ...m.educationLines.map((l) => datedBullet(l.text, l.years)),

          heading("Skills"),
          ...m.skills.map((g) => bullet([run(`${g.label}: `, { bold: true }), run(`${g.items.join(", ")}.`)])),

          heading("Awards", { pageBreakBefore: true }),
          ...m.awards.map((a) => datedBullet(a.detail ? `${a.title} | ${a.detail}` : a.title, a.year)),

          heading("Projects"),
          ...m.projects.flatMap((g) => [
            new Paragraph({ spacing: { before: 140, after: 40 }, keepNext: true, children: [run(g.label, { bold: true, size: 22 })] }),
            ...g.entries.flatMap((p) => [
              bullet(
                [
                  run(p.title, { bold: true }),
                  ...(p.stack.length ? [run(` | ${p.stack.join(", ")}`, { color: ACCENT })] : []),
                  run(`\t${p.years}`),
                ],
                { tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }], keepNext: true, spacing: { before: 100, after: 0 } },
              ),
              new Paragraph({ indent: { left: 540 }, spacing: { after: 20 }, children: [run(p.description)] }),
            ]),
          ]),

          heading("Interests"),
          bullet(m.interests),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
