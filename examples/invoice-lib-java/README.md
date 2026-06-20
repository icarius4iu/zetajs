# invoice-lib-java — headless invoice PDF generation (Java / Maven)

The Java counterpart of the Node `invoice-backend`: a small **Maven library** that
turns an invoice data model into a **PDF** — no UI, no browser, no LibreOffice.
Uses [OpenPDF](https://github.com/LibrePDF/OpenPDF) (pure Java), so it runs anywhere
a JVM does.

## Requirements

- **JDK 17+** (built and tested on JDK 25) and **Maven 3.8+**.

## Build & test

```sh
mvn package
```

Compiles, runs the JUnit tests, and produces a runnable fat jar at
`target/invoice-lib.jar`.

## Use as a CLI

```sh
java -jar target/invoice-lib.jar [data.json] [out.pdf]
#   default: sample-invoice.json -> invoice.pdf
java -jar target/invoice-lib.jar sample-invoice.json invoice.pdf
```

## Use as a library

```xml
<dependency>
  <groupId>com.example</groupId>
  <artifactId>invoice-lib</artifactId>
  <version>0.1.0</version>
</dependency>
```

```java
import com.example.invoice.*;
import java.util.List;

Invoice inv = new Invoice("Arthur Dent", "INV-2026-0042", "2026-06-20",
    List.of(new Item("Babel fish", 2, 19.99),
            new Item("Towel", 1, 42.00)));

byte[] pdf = InvoiceGenerator.toPdf(inv);   // PDF bytes — write, stream, upload…
```

## Data model

Plain Java records (Jackson maps JSON straight onto them):

```java
record Item(String desc, double qty, double price)               // amount() = qty * price
record Invoice(String customer, String number, String date, List<Item> items)
```

Same JSON shape as the Node backend:

```json
{ "customer": "…", "number": "…", "date": "…",
  "items": [ { "desc": "…", "qty": 0, "price": 0 } ] }
```

## What it demonstrates

- **Data → document** in plain Java; `InvoiceGenerator.toPdf` returns `byte[]`.
- **Dynamic table**: one `PdfPTable` row per item, sized from the data.
- **Pagination for free**: a long table flows across pages and the header row
  repeats (`setHeaderRows(1)`) — 60 items → 2 pages.
- **No native dependencies**: OpenPDF is pure Java.

## Next steps

- **JasperReports** (the Java *iReport* engine): design a `.jrxml` and export
  natively to PDF / DOCX / ODT / XLSX / HTML — true multi-format reporting.
- **Apache POI + LibreOffice**: build a `.docx` and `soffice --convert-to` it to
  any format (mirrors Method B of the Node backend).
