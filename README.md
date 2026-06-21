# zetajs — Letter Address demo + document-generation experiments

A slimmed fork of [allotropia/zetajs](https://github.com/allotropia/zetajs). It started from the **Letter Address Vue.js 3** demo — which embeds ZetaOffice (LibreOffice compiled to WebAssembly) into the browser and drives it through the LibreOffice UNO API via the [zetajs](source/) bridge — and now also includes headless **document-generation** experiments (a Node backend and a Java library).

The library code under [`source/`](source/) (`zeta.js`, `zetaHelper.ts`, and the committed compiled `zetaHelper.js`) is retained because the browser demo depends on it.

## Projects

| Project | What it is |
|---|---|
| [examples/letter-address-vuejs3](examples/letter-address-vuejs3/) | The **browser demo**: a Vue 3 + LibreOffice-WASM form-letter editor, plus an in-browser **invoice generator** (editable JSON / CSV import → live ODT/PDF). |
| [examples/invoice-backend](examples/invoice-backend/) | Headless **Node/TS**: JSON → PDF (pdfmake), and a `.docx` template → validated multi-format output (docxtemplater + LibreOffice). No browser, no UI. |
| [examples/invoice-lib-java](examples/invoice-lib-java/) | A **Maven Java** library built on our own `docgen` engine (a document model + PDF and HTML renderers, with generic data binding). |

All three are **data-driven**: they generate from external data (JSON / CSV / an editable form), not from a fixed sample. The rest of this file documents the **letter-address browser demo**; the backend and the Java library have their own READMEs (linked above).

## Online demo

A live build is hosted here:

**https://zetaoffice.net/demos/letter-address-vuejs3/**

## What it does

The demo is a stripped-down Writer document canvas presented as a web form-letter editor. The embedded document renders into an HTML `<canvas id="qtcanvas">`; a loading spinner ("MyDocumentProcessor is loading...") is shown until the WASM runtime and both documents are ready.

Two documents are loaded into the WASM filesystem and embedded into the canvas:

- `letter.odt` — a Writer letter (the editable form letter)
- `table.ods` — a Calc spreadsheet of recipient addresses

User-facing features:

- **Tabs** — "Editor" (the letter) and "Addresses" (the table) switch which embedded frame is in the foreground. In editor mode the formatting toolbar and the recipient panel are shown; in table mode the toolbar is hidden and the canvas is enlarged.
- **Formatting toolbar** ([`ControlBar.vue`](examples/letter-address-vuejs3/src/components/ControlBar.vue), built with `vue-file-toolbar-menu`) — Bold, Italic, Underline, Overline, Strikeout, Shadowed, character color and background color pickers, grow/shrink font size, font-size and font-name selectors (the font list is read from LibreOffice's actual `FontNameList`), left/center/right/justified alignment, and a bulleted list toggle. Button highlight state reflects the real formatting at the cursor via UNO status listeners.
- **Recipient insertion** — recipient names read from the address spreadsheet populate a list box; selecting one and clicking **Insert Address** fills the letter's placeholder fields (`<Recipient's Title>`, `<Recipient's name>`, street, postal code, city, state). The sender fields are hard-coded in the demo.
- **Upload / Reload** — upload a new `.odt` (letter) or `.ods` (table) into the active tab, or reload the current file.
- **Download** — export the letter as **ODT** (LibreOffice `writer8` filter) or **PDF** (`writer_pdf_Export` filter), offered to the browser as `letter.odt` / `letter.pdf`.
- **Invoice generator (demo)** — a "Generate invoice" panel builds a document from an **editable JSON** data model (or an **imported CSV**): a heading, scalar fields, and a dynamically sized, paginating items table with a computed total, all built in the office thread via UNO. Demonstrates data-driven document generation in the browser; export it as ODT/PDF like the letter.

Typical flow: page loads → spinner while the runtime and both documents load → UI becomes ready (tabs, toolbar, upload, reload, recipient list, and Insert button enable) → edit and format the letter → pick a recipient and insert the address → switch tabs, upload/reload, or download.

## Architecture

The demo runs across **two threads** that communicate only via `postMessage` over a `MessagePort`:

1. **Main / UI thread** — Vue 3 ([`src/main.js`](examples/letter-address-vuejs3/src/main.js) mounts [`App.vue`](examples/letter-address-vuejs3/src/App.vue) onto `#app`) plus the plain-JS controller [`public/pre_soffice.js`](examples/letter-address-vuejs3/public/pre_soffice.js). It uses `ZetaHelperMain` to start the office thread and to relay UI commands (toggle formatting, switch tab, download, reload, insert address).
2. **Office thread (Web Worker)** — runs the LibreOffice WASM (LOWA) and [`public/office_thread.js`](examples/letter-address-vuejs3/public/office_thread.js), which uses `ZetaHelperThread` to drive the UNO API: loading the documents, embedding their frames into the Qt canvas, disabling chrome, registering formatting/font listeners, and performing exports.

Bootstrap: `App.vue`'s `mounted()` hook appends `./config.js` (optional) and then `./pre_soffice.js` (as an ES module) to the page; once `pre_soffice.js` has loaded, `ControlBar.init_control_bar()` wires up the toolbar.

Both `pre_soffice.js` and `office_thread.js` import the helper from `./assets/vendor/zetajs/zetaHelper.js`. Those vendor entries are **symlinks into the committed library source**:

- `public/assets/vendor/zetajs/zeta.js` → [`source/zeta.js`](source/zeta.js)
- `public/assets/vendor/zetajs/zetaHelper.js` → [`source/zetaHelper.js`](source/zetaHelper.js)

So the example always runs against the live `source/` files without copying. [`source/zeta.js`](source/zeta.js) is the core UNO ↔ JS bridge over Emscripten/Embind; [`source/zetaHelper.js`](source/zetaHelper.js) provides the `ZetaHelperMain`/`ZetaHelperThread` setup helpers.

The heavy `soffice.{js,wasm,data}` binaries are **fetched at runtime from a base URL**. By default this is the ZetaOffice CDN (`https://cdn.zetaoffice.net/zetaoffice_latest/`); it is configurable (see [Configuration](#configuration)). Cross-origin isolation (COOP/COEP) is required because the multithreaded WASM uses `SharedArrayBuffer`.

## Repository layout

```
.
├── LICENSE
├── README.md                         (this file)
├── source/                           ZetaJS library (consumed via symlinks)
│   ├── zeta.js                        core UNO <-> JS / Embind bridge
│   ├── zetaHelper.ts                  TypeScript source of the helper
│   └── zetaHelper.js                  compiled helper (committed)
└── examples/
    ├── .gitignore                    ignores */config.js
    ├── letter-address-vuejs3/        the browser demo (Vue 3 + LibreOffice WASM)
    │   ├── index.html  package.json  vite.config.js  jsconfig.json  README.md
    │   ├── public/
    │   │   ├── pre_soffice.js         main-thread controller
    │   │   ├── office_thread.js       office-thread (Web Worker) logic + invoice generator
    │   │   ├── config.sample.js       copy to config.js to override the soffice base URL
    │   │   ├── letter.odt / table.ods documents loaded into the canvas
    │   │   └── assets/vendor/zetajs/  symlinks -> ../../../../../../source/{zeta,zetaHelper}.js
    │   └── src/                       main.js, App.vue, components/ControlBar.vue, assets/*.css
    ├── invoice-backend/              headless Node/TS invoice generation
    │   ├── src/invoice.ts + cli.ts    Method A: JSON -> PDF (pdfmake)
    │   ├── src/render.ts + validate.ts  Method B: .docx template -> validated multi-format
    │   ├── template.docx  sample-invoice.json  package.json
    │   └── README.md
    └── invoice-lib-java/             Maven Java library (our own docgen engine)
        ├── src/main/java/com/example/docgen/   Document, Block, Column, Renderer, Pdf/HtmlRenderer
        ├── src/main/java/com/example/invoice/  Invoice, Item, InvoiceGenerator, Main (CLI)
        ├── pom.xml  sample-invoice.json
        └── README.md
```

## Prerequisites

- **Node.js** and **npm**.

You can install npm system-wide, or isolate it, e.g. with `nodeenv --node=system --with-npm nodeenv/`.

## Run locally

All commands run from inside the example directory (there is **no root `package.json`**):

```sh
cd examples/letter-address-vuejs3
npm install
npm start
```

The Vite dev server serves the app at **http://127.0.0.1:8080** (with `strictPort`, so it fails rather than picking another port if 8080 is taken). The required COOP/COEP headers are injected automatically in development. `npm run dev` is an identical alias for `npm start`.

No root-level build or TypeScript compilation step is needed: the compiled [`source/zetaHelper.js`](source/zetaHelper.js) is committed to the repository.

## Production build

```sh
npm run build      # vite build -> static output with relative './' base paths
npm run preview    # serve the built output locally
```

Linting is available via `npm run lint`.

## Deployment

Serve the built static files from any web server, but the server **must** send these HTTP response headers so the WASM runtime can use `SharedArrayBuffer` (cross-origin isolation):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Because the Vite build uses a relative base (`'./'`), the app can be served from a subdirectory.

## Configuration

By default the `soffice` WASM binaries are fetched from the ZetaOffice CDN. To self-host them (or point at another base URL), copy the sample config and set your URL:

```sh
cp public/config.sample.js public/config.js
```

In `public/config.js`, set `config_soffice_base_url` to an absolute URL **with a trailing slash** that hosts `soffice.data`, `soffice.data.js.metadata`, `soffice.js`, and `soffice.wasm`. See [`public/config.sample.js`](examples/letter-address-vuejs3/public/config.sample.js) for details. `config.js` is loaded before `pre_soffice.js`; if it is absent, the demo falls back to the CDN default.

When the LOWA (`soffice`) files are served from a foreign origin, that origin must additionally send these HTTP response headers (as documented in `config.sample.js`):

```
Cross-Origin-Resource-Policy: cross-origin
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
```

## Updating from upstream / restoring other examples

This fork tracks upstream **allotropia/zetajs**. To bring back any example that is not present in this fork, check it out from the upstream branch:

```sh
git remote add upstream https://github.com/allotropia/zetajs   # if not already configured
git fetch upstream
git checkout upstream/main -- examples/NAME
```

For example `examples/convertpdf`, `examples/standalone`, and the other examples present in upstream can be restored this way.

## License and attribution

Licensed under the **MIT License**. Copyright (c) allotropia software GmbH and contributors. See [LICENSE](LICENSE) for the full text.

This repository is a slimmed fork of the upstream project: **https://github.com/allotropia/zetajs**.
