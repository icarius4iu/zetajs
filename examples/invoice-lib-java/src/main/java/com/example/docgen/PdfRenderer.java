// SPDX-License-Identifier: MIT
package com.example.docgen;

import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.ListItem;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

/** Renders a {@link Document} to PDF, using OpenPDF only as the drawing primitive. */
public final class PdfRenderer implements Renderer {

  private static final Font H1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
  private static final Font H2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
  private static final Font NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 11);
  private static final Font BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
  private static final Color HEADER_BG = new Color(230, 230, 230);

  @Override
  public byte[] render(Document document) {
    com.lowagie.text.Document doc = new com.lowagie.text.Document(PageSize.A4, 40, 40, 40, 40);
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    PdfWriter.getInstance(doc, out);
    doc.open();

    for (Block b : document.blocks()) {
      switch (b) {
        case Block.Heading h -> {
          Paragraph p = new Paragraph(h.text(), h.level() <= 1 ? H1 : H2);
          p.setSpacingAfter(6f);
          doc.add(p);
        }
        case Block.Text t -> doc.add(new Paragraph(t.text(), NORMAL));
        case Block.Spacer s -> doc.add(new Paragraph(" ", NORMAL));
        case Block.PageBreak pb -> doc.newPage();
        case Block.BulletList bl -> {
          com.lowagie.text.List list = new com.lowagie.text.List(false);
          list.setListSymbol("• ");
          for (String item : bl.items()) {
            list.add(new ListItem(item, NORMAL));
          }
          doc.add(list);
        }
        case Block.Table tb -> doc.add(pdfTable(tb));
      }
    }

    doc.close();
    return out.toByteArray();
  }

  private static PdfPTable pdfTable(Block.Table tb) {
    int n = tb.headers().size();
    PdfPTable table = tb.widths() != null ? new PdfPTable(tb.widths()) : new PdfPTable(n);
    table.setWidthPercentage(100);
    table.setHeaderRows(1);  // repeat the header row on each page

    for (int i = 0; i < n; i++) {
      PdfPCell c = cell(tb.headers().get(i), BOLD, align(tb.aligns().get(i)));
      c.setBackgroundColor(HEADER_BG);
      table.addCell(c);
    }
    for (List<String> row : tb.rows()) {
      for (int i = 0; i < n; i++) {
        table.addCell(cell(row.get(i), NORMAL, align(tb.aligns().get(i))));
      }
    }
    if (tb.summary() != null) {
      for (int i = 0; i < n; i++) {
        table.addCell(cell(tb.summary().get(i), BOLD, align(tb.aligns().get(i))));
      }
    }
    return table;
  }

  private static PdfPCell cell(String text, Font font, int align) {
    PdfPCell c = new PdfPCell(new Phrase(text == null ? "" : text, font));
    c.setHorizontalAlignment(align);
    c.setPadding(4f);
    return c;
  }

  private static int align(Align a) {
    return switch (a) {
      case RIGHT -> Element.ALIGN_RIGHT;
      case CENTER -> Element.ALIGN_CENTER;
      case LEFT -> Element.ALIGN_LEFT;
    };
  }
}
