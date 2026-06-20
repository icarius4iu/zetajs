// SPDX-License-Identifier: MIT
// Template-driven invoice (the iReport / Apryse pattern):
//   template.docx (with {tags})  +  data.json  ->  rendered .docx  ->  PDF
//
// Step 1 (docxtemplater): inject the data into the .docx template — pure JS.
// Step 2 (LibreOffice headless): convert the rendered .docx to PDF.
//
//   node src/render-docx.ts [data.json] [out-basename]

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const inPath = process.argv[2] ?? 'sample-invoice.json';
const base = process.argv[3] ?? 'invoice';
const templatePath = 'template.docx';
const outDocx = `${base}.docx`;

// --- Prepare the view model (docxtemplater does no math, so precompute here) ---
const raw = JSON.parse(readFileSync(inPath, 'utf8'));
let total = 0;
const items = (raw.items ?? []).map((it: any) => {
  const qty = Number(it.qty) || 0;
  const price = Number(it.price) || 0;
  const amount = qty * price;
  total += amount;
  return { desc: it.desc, qty, price: price.toFixed(2), amount: amount.toFixed(2) };
});
const data = {
  customer: raw.customer ?? '',
  number: raw.number ?? '',
  date: raw.date ?? '',
  items,
  total: total.toFixed(2),
};

// --- Step 1: inject data into the .docx template ---
const zip = new PizZip(readFileSync(templatePath));
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
doc.render(data);
writeFileSync(outDocx, doc.getZip().generate({ type: 'nodebuffer' }));
console.log(`Wrote ${outDocx} (data injected into the template).`);

// --- Step 2: convert the rendered .docx to PDF via headless LibreOffice ---
execFileSync(
  'soffice',
  ['--headless', '-env:UserInstallation=file:///tmp/loprofile',
    '--convert-to', 'pdf', '--outdir', '.', outDocx],
  { stdio: 'inherit' },
);
console.log(`Wrote ${base}.pdf (rendered by LibreOffice).`);
