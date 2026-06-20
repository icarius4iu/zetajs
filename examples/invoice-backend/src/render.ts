// SPDX-License-Identifier: MIT
// Template-driven invoice, multi-format and validated:
//   template.docx (+ {tags})  +  data.json  ->  <out>.<pdf|odt|docx|doc|rtf|html|txt>
//
// 1) validate the requested output format and the input data
// 2) inject the data into the .docx template (docxtemplater, pure JS)
// 3) emit the requested format — .docx directly, anything else via headless
//    LibreOffice (soffice --convert-to), using a per-run profile so concurrent
//    renders never collide on a shared LibreOffice lock.
//
//   node src/render.ts [data.json] [out.ext]      ext picks the format

import { readFileSync, writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { validateInvoice, validateFormat } from './validate.ts';

const inPath = process.argv[2] ?? 'sample-invoice.json';
const outPath = process.argv[3] ?? 'invoice.pdf';
const templatePath = 'template.docx';

const fmt = (outPath.split('.').pop() ?? '').toLowerCase();
validateFormat(fmt);

const raw = JSON.parse(readFileSync(inPath, 'utf8'));
validateInvoice(raw);

// docxtemplater does no arithmetic, so compute amounts + total here.
let total = 0;
const items = raw.items.map((it: any) => {
  const qty = Number(it.qty);
  const price = Number(it.price);
  const amount = qty * price;
  total += amount;
  return { desc: it.desc, qty, price: price.toFixed(2), amount: amount.toFixed(2) };
});
const data = {
  customer: raw.customer, number: raw.number, date: raw.date,
  items, total: total.toFixed(2),
};

// Step 1: inject data into the template.
const zip = new PizZip(readFileSync(templatePath));
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
doc.render(data);
const renderedDocx: Buffer = doc.getZip().generate({ type: 'nodebuffer' });

// Step 2: emit the requested format.
if (fmt === 'docx') {
  writeFileSync(outPath, renderedDocx);
} else {
  const work = mkdtempSync(join(tmpdir(), 'invgen-'));   // isolated, per-run
  try {
    const tmpDocx = join(work, 'in.docx');
    writeFileSync(tmpDocx, renderedDocx);
    execFileSync('soffice', [
      '--headless',
      `-env:UserInstallation=file://${join(work, 'profile')}`,  // own profile => concurrency-safe
      '--convert-to', fmt, '--outdir', work, tmpDocx,
    ], { stdio: 'ignore' });
    copyFileSync(join(work, `in.${fmt}`), outPath);          // copy (work dir is on /tmp)
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

console.log(`Wrote ${outPath} [${fmt}] from ${inPath} — ${items.length} item(s).`);
