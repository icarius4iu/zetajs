// SPDX-License-Identifier: MIT
// CLI: read an invoice JSON file and write a PDF.
//   node src/cli.ts [data.json] [out.pdf]

import { readFileSync, writeFileSync } from 'node:fs';
import { generateInvoice, type Invoice } from './invoice.ts';

const inPath = process.argv[2] ?? 'sample-invoice.json';
const outPath = process.argv[3] ?? 'invoice.pdf';

const data: Invoice = JSON.parse(readFileSync(inPath, 'utf8'));
const pdf = await generateInvoice(data);
writeFileSync(outPath, pdf);

console.log(`Wrote ${outPath} (${pdf.length} bytes) from ${inPath} — ${data.items?.length ?? 0} item(s).`);
