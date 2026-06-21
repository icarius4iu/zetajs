// SPDX-License-Identifier: MIT
package io.github.icarius4iu.invoice;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;

/** CLI: read an invoice JSON file and write a PDF.  java -jar invoice-lib.jar [data.json] [out.pdf] */
public final class Main {

  private Main() {}

  public static void main(String[] args) throws Exception {
    String inPath = args.length > 0 ? args[0] : "sample-invoice.json";
    String outPath = args.length > 1 ? args[1] : "invoice.pdf";

    Invoice inv = new ObjectMapper().readValue(Files.readString(Path.of(inPath)), Invoice.class);
    boolean html = outPath.toLowerCase().endsWith(".html") || outPath.toLowerCase().endsWith(".htm");
    byte[] bytes = html ? InvoiceGenerator.toHtml(inv) : InvoiceGenerator.toPdf(inv);
    Files.write(Path.of(outPath), bytes);

    int n = inv.items() == null ? 0 : inv.items().size();
    System.out.println("Wrote " + outPath + " (" + bytes.length + " bytes, " + (html ? "html" : "pdf")
        + ") from " + inPath + " — " + n + " item(s).");
  }
}
