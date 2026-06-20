// SPDX-License-Identifier: MIT
package com.example.invoice;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;

/** Builds an invoice PDF from the data model — the Java analog of the pdfmake backend. */
public final class InvoiceGenerator {

  private static final Font TITLE  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
  private static final Font NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 11);
  private static final Font BOLD   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
  private static final Color HEADER_BG = new Color(230, 230, 230);

  private InvoiceGenerator() {}

  /** Render the invoice and return the PDF bytes. */
  public static byte[] toPdf(Invoice inv) {
    Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    PdfWriter.getInstance(doc, out);
    doc.open();

    doc.add(new Paragraph("INVOICE", TITLE));
    doc.add(new Paragraph("Bill to: " + nz(inv.customer()), NORMAL));
    doc.add(new Paragraph("Invoice #: " + nz(inv.number()), NORMAL));
    Paragraph date = new Paragraph("Date: " + nz(inv.date()), NORMAL);
    date.setSpacingAfter(12f);
    doc.add(date);

    PdfPTable table = new PdfPTable(new float[] {5, 1, 2, 2});
    table.setWidthPercentage(100);
    table.setHeaderRows(1);  // repeat the header row on every page

    for (String h : new String[] {"Description", "Qty", "Unit price", "Amount"}) {
      PdfPCell c = cell(h, BOLD, h.equals("Description") ? Element.ALIGN_LEFT : Element.ALIGN_RIGHT);
      c.setBackgroundColor(HEADER_BG);
      table.addCell(c);
    }

    double total = 0;
    List<Item> items = inv.items() == null ? List.of() : inv.items();
    for (Item it : items) {
      double amount = it.amount();
      total += amount;
      table.addCell(cell(nz(it.desc()), NORMAL, Element.ALIGN_LEFT));
      table.addCell(cell(qty(it.qty()), NORMAL, Element.ALIGN_RIGHT));
      table.addCell(cell(money(it.price()), NORMAL, Element.ALIGN_RIGHT));
      table.addCell(cell(money(amount), NORMAL, Element.ALIGN_RIGHT));
    }

    PdfPCell totalLabel = cell("TOTAL", BOLD, Element.ALIGN_LEFT);
    totalLabel.setColspan(3);
    table.addCell(totalLabel);
    table.addCell(cell(money(total), BOLD, Element.ALIGN_RIGHT));

    doc.add(table);
    doc.close();
    return out.toByteArray();
  }

  private static PdfPCell cell(String text, Font font, int align) {
    PdfPCell c = new PdfPCell(new Phrase(text, font));
    c.setHorizontalAlignment(align);
    c.setPadding(4f);
    return c;
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
