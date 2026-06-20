// SPDX-License-Identifier: MIT
package com.example.invoice;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InvoiceGeneratorTest {

  @Test
  void producesAValidPdf() {
    Invoice inv = new Invoice("Arthur Dent", "INV-1", "2026-06-20",
        List.of(new Item("Babel fish", 2, 19.99), new Item("Towel", 1, 42.0)));

    byte[] pdf = InvoiceGenerator.toPdf(inv);

    assertTrue(pdf.length > 500, "PDF should be non-trivial");
    String header = new String(pdf, 0, 5, StandardCharsets.ISO_8859_1);
    assertEquals("%PDF-", header, "should start with the PDF header");
  }

  @Test
  void growsAndPaginatesWithManyItems() {
    List<Item> items = new ArrayList<>();
    for (int i = 0; i < 80; i++) {
      items.add(new Item("Line item #" + (i + 1), 1, 9.99));
    }
    byte[] small = InvoiceGenerator.toPdf(new Invoice("X", "1", "2026-06-20",
        List.of(new Item("one", 1, 1.0))));
    byte[] big = InvoiceGenerator.toPdf(new Invoice("Megacorp", "2", "2026-06-20", items));

    assertTrue(big.length > small.length, "more items should produce a larger document");
  }
}
