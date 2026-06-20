# invoice-backend — headless invoice generation

Generate an invoice **server-side** from a JSON data object — no browser, no UI.
Two methods are included, mirroring the two ways to think about reporting:

| | **Method A — code-defined** | **Method B — template-driven** |
|---|---|---|
| Tool | [pdfmake](https://pdfmake.org/) | [docxtemplater](https://docxtemplater.com/) + LibreOffice |
| The "document" is | a JS object in code | a `.docx` file with `{tags}` |
| Output | **PDF** | `.docx` → **PDF** |
| Needs LibreOffice? | ❌ no | ✅ yes (for the PDF step) |
| Like… | building the doc in code (our zetajs/UNO browser demo) | **iReport / Apryse**: design a template, inject data |

Data format (shared by both):

```json
{
  "customer": "string",
  "number": "string",
  "date": "string",
  "items": [{ "desc": "string", "qty": 0, "price": 0 }]
}
```

`Amount = qty × price` and `TOTAL` are computed for you.

## Requirements

- **Node.js ≥ 22.6** — the `.ts` files run directly (Node strips the types, no build). Tested on Node 24.
- For **Method B only**: a headless **LibreOffice** (`soffice` on the PATH).
  Debian/Ubuntu: `sudo apt-get install -y --no-install-recommends libreoffice-writer`

```sh
npm install
```

## Method A — pdfmake (JSON → PDF, no LibreOffice)

The document is defined in code ([src/invoice.ts](src/invoice.ts), the `docDefinition`
object) and pdfmake draws the PDF directly. pdfmake embeds its own fonts, so there
are no external dependencies.

```sh
node src/cli.ts [data.json] [out.pdf]      # default: sample-invoice.json -> invoice.pdf
```

```ts
import { generateInvoice } from './src/invoice.ts';
const pdf: Buffer = await generateInvoice(data);   // PDF bytes
```

A long table flows across pages automatically and the header row repeats
(`headerRows`) — try 60 items → 2 pages.

## Method B — template-driven (.docx + LibreOffice → PDF)

The document is a real `.docx` you can design in Word/LibreOffice, containing
docxtemplater tags: scalars like `{customer}` and a table-row loop
`{#items} … {/items}`. The pipeline is **template + data → .docx → PDF**:

```sh
node src/make-template.ts                   # (re)create template.docx with the {tags}
node src/render-docx.ts [data.json] [base]  # default: sample-invoice.json -> invoice.docx + invoice.pdf
```

- [src/make-template.ts](src/make-template.ts) builds `template.docx` (committed; open
  it to see/edit the tags — this is the file a non-developer would own).
- [src/render-docx.ts](src/render-docx.ts) injects the data with docxtemplater
  (pure JS), then converts the rendered `.docx` to PDF via headless LibreOffice
  (`soffice --headless --convert-to pdf`).

This is the closest match to **iReport/JasperReports and Apryse**: the layout lives
in an editable template, not in code.

## Expose it as an HTTP service

Either method is a few lines behind an endpoint:

```ts
import { createServer } from 'node:http';
import { generateInvoice } from './src/invoice.ts';   // Method A

createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c;
  const pdf = await generateInvoice(JSON.parse(body));
  res.setHeader('Content-Type', 'application/pdf');
  res.end(pdf);
}).listen(3000);
// curl -X POST --data-binary @sample-invoice.json localhost:3000 -o invoice.pdf
```

## Which to use?

- **Method A** when the layout is fixed and you want zero infra (no LibreOffice) and PDF out.
- **Method B** when non-developers should own the layout (edit a `.docx`), or you need
  the exact LibreOffice rendering / DOCX + PDF output.
