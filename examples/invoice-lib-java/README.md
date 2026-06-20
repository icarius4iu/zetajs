# invoice-lib-java — our own document-generation engine (Java / Maven)

A small, **in-house** document-generation library (no JasperReports): a
format-independent document model + pluggable renderers, with generic data
binding. The invoice is just a *consumer* of the engine — the engine itself is
reusable for any report.

## Architecture

```
data ──► build a Document (Blocks) ──► Renderer ──► bytes
         (com.example.docgen)          PdfRenderer / HtmlRenderer
```

- **`com.example.docgen`** — the engine:
  - `Document` + `Block` (sealed): `Heading`, `Text`, `Spacer`, `PageBreak`,
    `BulletList`, `Table`.
  - `Column<T>` + `Block.Table.of(columns, data, summary)` — **generic data
    binding**: any `List<T>` becomes a table by describing its columns.
  - `Renderer` interface, with `PdfRenderer` (OpenPDF as the drawing primitive)
    and `HtmlRenderer` (pure Java, zero dependencies). Add a format → add a renderer.
- **`com.example.invoice`** — a consumer: `InvoiceGenerator` builds a `Document`
  and renders it to PDF or HTML.

## Requirements

- **JDK 21+** (built and tested on JDK 25) and **Maven 3.8+**.

## Build & test

```sh
mvn package      # compiles, runs the JUnit tests, builds target/invoice-lib.jar
```

## CLI

```sh
java -jar target/invoice-lib.jar [data.json] [out.pdf|out.html]
java -jar target/invoice-lib.jar sample-invoice.json invoice.pdf
java -jar target/invoice-lib.jar sample-invoice.json invoice.html
```

## As a library — the engine is generic

Bind any list to a report, render to any format:

```java
import com.example.docgen.*;
import java.util.List;

record Person(String name, int age) {}

List<Column<Person>> cols = List.of(
    Column.of("Name", Person::name),
    Column.of("Age", p -> String.valueOf(p.age()), Align.RIGHT));

Document report = Document.builder()
    .heading("People")
    .add(Block.Table.of(cols, people, /* summary */ null))
    .build();

byte[] pdf  = new PdfRenderer().render(report);
byte[] html = new HtmlRenderer().render(report);
```

The invoice does exactly this — see
[InvoiceGenerator](src/main/java/com/example/invoice/InvoiceGenerator.java).

## What it demonstrates

- An **own engine**: document model + renderers, not a third-party report tool.
- **Generic binding**: `Column<T>` maps any data type to table rows.
- **Multiple outputs** from one model: PDF (OpenPDF) and HTML (pure Java).
- **Pagination**: tables flow across pages with a repeated header — 60 items → 2 pages.

## Extending it

- New format → implement `Renderer` (e.g. an `OdtRenderer`, `MarkdownRenderer`).
- New block → add a record to the sealed `Block` and a case in each renderer
  (the compiler enforces handling it everywhere).
