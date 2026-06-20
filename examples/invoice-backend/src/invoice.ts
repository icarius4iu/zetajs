// SPDX-License-Identifier: MIT
// Headless invoice generation: a plain data object in, a PDF Buffer out.
// No browser, no UI, no LibreOffice — pure Node + pdfmake.

import PdfPrinter from 'pdfmake';
import vfsFonts from 'pdfmake/build/vfs_fonts.js';

export interface InvoiceItem {
  desc: string;
  qty: number;
  price: number;
}

export interface Invoice {
  customer: string;
  number: string;
  date: string;
  items: InvoiceItem[];
}

// pdfmake embeds its own fonts; reuse the Roboto fonts bundled in pdfmake's vfs
// (base64) so we depend on nothing in the environment.
const vfs: Record<string, string> =
  (vfsFonts as any).vfs ?? (vfsFonts as any).pdfMake?.vfs ?? (vfsFonts as any);

const fonts = {
  Roboto: {
    normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
  },
};

const printer = new (PdfPrinter as any)(fonts);

const money = (n: number) => n.toFixed(2);

/** Build the invoice PDF for the given data and resolve with the PDF bytes. */
export function generateInvoice(data: Invoice): Promise<Buffer> {
  const items = data.items ?? [];

  let total = 0;
  const itemRows = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const price = Number(it.price) || 0;
    const amount = qty * price;
    total += amount;
    return [
      String(it.desc ?? ''),
      { text: String(qty), alignment: 'right' },
      { text: money(price), alignment: 'right' },
      { text: money(amount), alignment: 'right' },
    ];
  });

  const docDefinition = {
    content: [
      { text: 'INVOICE', fontSize: 20, bold: true, margin: [0, 0, 0, 10] },
      { text: `Bill to: ${data.customer ?? ''}` },
      { text: `Invoice #: ${data.number ?? ''}` },
      { text: `Date: ${data.date ?? ''}`, margin: [0, 0, 0, 12] },
      {
        table: {
          // headerRows repeats automatically on every page when the table
          // spans pages — the report-engine "repeat headline" behaviour, free.
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Description', bold: true },
              { text: 'Qty', bold: true, alignment: 'right' },
              { text: 'Unit price', bold: true, alignment: 'right' },
              { text: 'Amount', bold: true, alignment: 'right' },
            ],
            ...itemRows,
            [
              { text: 'TOTAL', bold: true, colSpan: 3 },
              {},
              {},
              { text: money(total), bold: true, alignment: 'right' },
            ],
          ],
        },
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11 },
    pageMargins: [40, 40, 40, 40],
  };

  const pdfDoc = (printer as any).createPdfKitDocument(docDefinition);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
