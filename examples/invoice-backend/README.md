# invoice-backend — headless invoice generation

> Part of the [zetajs fork](../../README.md) — the headless counterpart of the in-browser invoice demo in [letter-address-vuejs3](../letter-address-vuejs3/).

Generate an invoice **server-side** from a JSON data object — no browser, no UI.
Two methods are included:

| | **Method A — code-defined** | **Method B — template-driven** |
|---|---|---|
| Tool | [pdfmake](https://pdfmake.org/) | [docxtemplater](https://docxtemplater.com/) + LibreOffice |
| The "document" is | a JS object in code | a `.docx` file with `{tags}` |
| Output | **PDF** | **pdf / odt / docx / doc / rtf / html / txt** |
| Needs LibreOffice? | ❌ no | ✅ yes (except `docx` output) |
| Like… | building the doc in code (our zetajs/UNO browser demo) | **iReport / Apryse**: design a template, inject data |

Data format (shared):

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
- **Method B** (and any non-`docx` output) needs a headless **LibreOffice** (`soffice` on PATH):
  `sudo apt-get install -y --no-install-recommends libreoffice-writer`

```sh
npm install
```

## Method A — pdfmake (JSON → PDF, no LibreOffice)

The document is defined in code ([src/invoice.ts](src/invoice.ts)) and pdfmake draws
the PDF directly (it embeds its own fonts — zero external dependencies).

```sh
node src/cli.ts [data.json] [out.pdf]      # default: sample-invoice.json -> invoice.pdf
```

A long table flows across pages and the header repeats — 60 items → 2 pages.

## Method B — template-driven, multi-format, validated

A real `.docx` you can design in Word/LibreOffice, with docxtemplater tags:
`{customer}` scalars and a `{#items} … {/items}` table-row loop. The pipeline is
**validate → inject → emit the requested format**.

```sh
node src/make-template.ts                       # (re)create template.docx with the {tags}
node src/render.ts [data.json] [out.<ext>]      # ext picks the format
#   e.g.
node src/render.ts sample-invoice.json invoice.pdf
node src/render.ts sample-invoice.json invoice.odt
node src/render.ts sample-invoice.json invoice.docx
```

- [src/make-template.ts](src/make-template.ts) builds the committed `template.docx`
  (the file a non-developer would own and edit).
- [src/render.ts](src/render.ts): validates, injects the data with docxtemplater
  (pure JS), then — for any format other than `docx` — converts via headless
  LibreOffice using a **per-run profile**, so concurrent renders never collide on
  a shared LibreOffice lock.

### Validation ([src/validate.ts](src/validate.ts))

- **Permitted output formats** (allowlist): `pdf, odt, docx, doc, rtf, html, txt`.
  Anything else is rejected.
- **Input data**: `customer` / `number` / `date` required non-empty; `items` a
  non-empty array; each item needs a `desc` and numeric `qty`/`price ≥ 0`. Errors
  are reported together, e.g. `items[0].price must be a number >= 0.`
- **Growth bound**: at most `MAX_ITEMS` (5000) line items, so a runaway payload
  can't exhaust the machine.

## Expose it as an HTTP service

Either method is a few lines behind an endpoint (validate, then return the bytes):

```ts
import { createServer } from 'node:http';
import { generateInvoice } from './src/invoice.ts';   // Method A

createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c;
  try {
    const pdf = await generateInvoice(JSON.parse(body));
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdf);
  } catch (e) {
    res.statusCode = 400; res.end(String((e as Error).message));
  }
}).listen(3000);
```

## Which to use?

- **Method A** when the layout is fixed and you want zero infra (no LibreOffice), PDF only.
- **Method B** when non-developers own the layout (edit a `.docx`) and/or you need
  multiple validated output formats (ODT, DOCX, PDF, …).

> Note: a full multi-format **template** engine (ODT/XLSX templates too) such as
> [carbone](https://carbone.io/) is the natural next step, but it drives LibreOffice
> through a Python-UNO bridge that this minimal container doesn't ship; it works on a
> standard server with `python3-uno` set up against the system Python.
