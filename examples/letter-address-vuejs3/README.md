# MyDocumentProcessor — Letter Address Tool (Writer demo, Vue.js 3)

A web form-letter demo built on a stripped-down, standalone LibreOffice Writer document
canvas (no surrounding menubars, toolbars, or side panels), implemented with Vue.js 3 and
[ZetaOffice](https://zetaoffice.net) (LibreOffice compiled to WebAssembly).

**[Online demo →](https://zetaoffice.net/demos/letter-address-vuejs3/)**

For the architecture (two-thread model, the `source/` symlinks, how the `soffice` WASM is
loaded) see the [root README](../../README.md).

## What it does

- **Tabs** — *Editor* (the `letter.odt` Writer document) and *Addresses* (the `table.ods`
  recipient spreadsheet) switch which embedded frame is in the foreground.
- **Formatting toolbar** — Bold, Italic, Underline, Overline, Strikeout, Shadowed, text and
  highlight color, grow/shrink and pick font size, font name, alignment, and a bullet-list
  toggle. Button state reflects the real formatting at the cursor.
- **Insert address** — pick a recipient from the address table to fill the letter's
  placeholder fields.
- **Upload / Reload** — load a new `.odt`/`.ods` into the active tab, or reload the current file.
- **Download** — export the letter as **ODT** or **PDF**.
- **Invoice generator (demo)** — the *Invoice (demo)* panel turns an **editable JSON** data model (or an **imported CSV** of `desc,qty,price`) into a generated document right in the canvas: a heading, scalar fields, and a dynamic, paginating items table with a computed total — all built in the office thread via UNO. Export it with the same ODT/PDF buttons. It is **data-driven**: edit the JSON / import a CSV and regenerate, not limited to a fixed sample.

## Prerequisites

Node.js and npm. Either install npm system-wide, or isolate it, e.g.:

```sh
nodeenv --node=system --with-npm nodeenv/
```

- https://packages.debian.org/bookworm/nodejs
- https://packages.debian.org/bookworm/nodeenv

## Setup

```sh
npm install
```

## Run (development)

Compile and hot-reload at **http://127.0.0.1:8080** (`strictPort`):

```sh
npm start          # alias: npm run dev
```

The required cross-origin isolation headers (COOP/COEP) are set automatically by the Vite
dev server. No separate build of `source/zetaHelper.js` is needed — the compiled file is
committed.

## Build (production)

```sh
npm run build      # static output with relative './' base paths
npm run preview    # serve the build locally
```

When deploying the built files, the web server **must** send these HTTP response headers
(needed for `SharedArrayBuffer`):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Configuration (optional)

By default the `soffice.{js,wasm,data}` binaries are fetched from the ZetaOffice CDN. To
self-host them or point at another base URL, copy the sample config and edit it:

```sh
cp public/config.sample.js public/config.js
```

Set `config_soffice_base_url` to an absolute URL with a trailing slash. See
[`public/config.sample.js`](public/config.sample.js) for the details, including the extra
headers required when serving the binaries from a foreign origin. `config.js` is optional
and git-ignored; without it the demo falls back to the CDN.

## Lint

```sh
npm run lint       # ESLint
```

See also the [Vite configuration reference](https://vitejs.dev/config/).
