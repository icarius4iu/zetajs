# invoice-backend — headless invoice PDF generation

A tiny **server-side** document generator: a JSON data object in, a **PDF** out.
No browser, no UI, no LibreOffice — pure Node.js + [pdfmake](https://pdfmake.org/).

This is the backend counterpart of the in-browser `letter-address-vuejs3` invoice
demo: the same "data → document" idea (Apryse / JasperReports style), but running
on the server with zero rendering dependencies.

## Requirements

- **Node.js ≥ 22.6** (the `.ts` files run directly via Node's built-in type
  stripping — no build step). Tested on Node 24.

```sh
npm install
```

## Use it as a CLI

```sh
node src/cli.ts [data.json] [out.pdf]
# defaults: sample-invoice.json -> invoice.pdf
node src/cli.ts sample-invoice.json out.pdf
```

## Use it as a function

```ts
import { generateInvoice, type Invoice } from './src/invoice.ts';

const data: Invoice = {
  customer: 'Arthur Dent',
  number: 'INV-2026-0042',
  date: '2026-06-20',
  items: [
    { desc: 'Babel fish (pair)', qty: 2, price: 19.99 },
    { desc: 'Towel, deluxe', qty: 1, price: 42.0 },
  ],
};

const pdf: Buffer = await generateInvoice(data);   // PDF bytes — write to disk, stream, upload…
```

Wrapping it in an HTTP endpoint is a few lines, e.g.:

```ts
import { createServer } from 'node:http';
import { generateInvoice } from './src/invoice.ts';

createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  const pdf = await generateInvoice(JSON.parse(body));
  res.setHeader('Content-Type', 'application/pdf');
  res.end(pdf);
}).listen(3000);
// curl -X POST --data-binary @sample-invoice.json localhost:3000 -o invoice.pdf
```

## Data format

```json
{
  "customer": "string",
  "number": "string",
  "date": "string",
  "items": [{ "desc": "string", "qty": 0, "price": 0 }]
}
```

The generator computes each line `Amount = qty × price` and a `TOTAL`.

## What it demonstrates

- **Data → document**, headless, in plain Node/TS.
- **Dynamic table**: one row per item, sized from the data.
- **Pagination for free**: a long table flows across pages and the header row
  repeats on every page (`headerRows`). Try 60 items → 2 pages.
- **No external runtime**: pdfmake embeds the Roboto fonts (reused from its
  bundled vfs), so there are no font files and no LibreOffice to install.

## Possible next steps

- **CSV input**: parse `desc,qty,price` rows into `items` before calling `generateInvoice`.
- **Template-driven (iReport/Apryse style)**: swap pdfmake for `docxtemplater`
  (DOCX templates with `{#items}` loops) or `carbone` (ODT/DOCX templates → PDF
  via headless LibreOffice).
- **Exact LibreOffice rendering**: drive a headless `soffice` instance via UNO to
  reuse the very same engine as the in-browser zetajs demo.
