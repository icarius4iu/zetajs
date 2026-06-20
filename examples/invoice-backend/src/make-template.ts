// SPDX-License-Identifier: MIT
// Build a .docx TEMPLATE containing docxtemplater tags. This is the file a
// non-developer would normally design in Word/LibreOffice; here we generate it
// with the `docx` library so it is reproducible. Each tag sits in a single text
// run so docxtemplater can find it intact.
//
//   node src/make-template.ts   ->   template.docx

import { writeFileSync } from 'node:fs';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
} from 'docx';

const cell = (text: string, bold = false) =>
  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ children: [new TextRun({ text: 'INVOICE', bold: true, size: 40 })] }),
      new Paragraph({ children: [new TextRun({ text: 'Bill to: {customer}' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Invoice #: {number}' })] }),
      new Paragraph({ children: [new TextRun({ text: 'Date: {date}' })] }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Header row.
          new TableRow({ children: [
            cell('Description', true), cell('Qty', true), cell('Unit price', true), cell('Amount', true),
          ] }),
          // Loop row: {#items} ... {/items} repeats this whole row, once per item.
          new TableRow({ children: [
            cell('{#items}{desc}'), cell('{qty}'), cell('{price}'), cell('{amount}{/items}'),
          ] }),
          // Totals row.
          new TableRow({ children: [
            cell('TOTAL', true), cell(''), cell(''), cell('{total}', true),
          ] }),
        ],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync('template.docx', buf);
console.log('Wrote template.docx (open it in Word/LibreOffice to see/edit the {tags}).');
