// Generates the downloadable resume from src/data/*.json into public/ (commit both files):
//   public/resume.pdf
//   public/resume.docx
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderDocx } from "./resume/docx.mjs";
import { buildModel } from "./resume/model.mjs";
import { renderPdf } from "./resume/pdf.mjs";

const path = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const model = buildModel();

const docx = path("../public/resume.docx");
writeFileSync(docx, await renderDocx(model));
console.log("wrote", docx);

const pdf = path("../public/resume.pdf");
writeFileSync(pdf, await renderPdf(model));
console.log("wrote", pdf);
