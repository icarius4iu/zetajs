// SPDX-License-Identifier: MIT
package io.github.icarius4iu.docgen;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The engine is generic: it binds ANY {@code List<T>} to a table, not just invoices. */
class DocgenTest {

  record Person(String name, int age) {}

  private static Document peopleReport() {
    List<Person> people = List.of(new Person("Ada", 36), new Person("Alan", 41));
    List<Column<Person>> cols = List.of(
        Column.of("Name", Person::name),
        Column.of("Age", p -> String.valueOf(p.age()), Align.RIGHT));

    return Document.builder()
        .heading("People")
        .text("A generic report built from arbitrary data.")
        .bullets(List.of("first bullet", "second bullet"))
        .spacer()
        .add(Block.Table.of(cols, people, null))
        .build();
  }

  @Test
  void rendersAnArbitraryListToHtml() {
    String html = new String(new HtmlRenderer().render(peopleReport()), StandardCharsets.UTF_8);
    assertTrue(html.contains("<h1>People</h1>"));
    assertTrue(html.contains("Ada") && html.contains("Alan"));
    assertTrue(html.contains("<ul><li>first bullet</li>"));
  }

  @Test
  void rendersTheSameModelToPdf() {
    byte[] pdf = new PdfRenderer().render(peopleReport());
    assertEquals("%PDF-", new String(pdf, 0, 5, StandardCharsets.ISO_8859_1));
  }
}
