// SPDX-License-Identifier: MIT
package com.example.invoice;

import com.example.docgen.Align;
import com.example.docgen.Block;
import com.example.docgen.Column;
import com.example.docgen.Document;
import com.example.docgen.HtmlRenderer;
import com.example.docgen.PdfRenderer;

import java.util.List;
import java.util.Locale;

/**
 * Builds an invoice as a generic {@link Document} and renders it. The invoice is
 * just a consumer of our own docgen engine — the layout vocabulary and renderers
 * are reusable for any report, not invoice-specific.
 */
public final class InvoiceGenerator {

  private InvoiceGenerator() {}

  /** Describe the invoice as a format-independent document model. */
  public static Document toDocument(Invoice inv) {
    List<Item> items = inv.items() == null ? List.of() : inv.items();
    double total = 0;
    for (Item it : items) {
      total += it.amount();
    }

    List<Column<Item>> columns = List.of(
        Column.of("Description", Item::desc),
        Column.of("Qty", it -> qty(it.qty()), Align.RIGHT),
        Column.of("Unit price", it -> money(it.price()), Align.RIGHT),
        Column.of("Amount", it -> money(it.amount()), Align.RIGHT));

    return Document.builder()
        .heading("INVOICE")
        .text("Bill to: " + nz(inv.customer()))
        .text("Invoice #: " + nz(inv.number()))
        .text("Date: " + nz(inv.date()))
        .spacer()
        .add(Block.Table.of(columns, items, List.of("TOTAL", "", "", money(total)), new float[] {5, 1, 2, 2}))
        .build();
  }

  /** Render the invoice to PDF. */
  public static byte[] toPdf(Invoice inv) {
    return new PdfRenderer().render(toDocument(inv));
  }

  /** Render the invoice to HTML. */
  public static byte[] toHtml(Invoice inv) {
    return new HtmlRenderer().render(toDocument(inv));
  }

  private static String nz(String s) {
    return s == null ? "" : s;
  }

  private static String money(double v) {
    return String.format(Locale.US, "%.2f", v);
  }

  private static String qty(double v) {
    return v == Math.rint(v) ? String.valueOf((long) v) : String.valueOf(v);
  }
}
