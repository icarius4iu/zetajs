// SPDX-License-Identifier: MIT
package io.github.icarius4iu.docgen;

import java.util.List;

/**
 * A content block of a {@link Document}. Sealed, so renderers can switch over
 * every kind exhaustively. The set of blocks is the engine's vocabulary.
 */
public sealed interface Block {

  record Heading(String text, int level) implements Block {}

  record Text(String text) implements Block {}

  record Spacer() implements Block {}

  record PageBreak() implements Block {}

  record BulletList(List<String> items) implements Block {}

  /**
   * A table. Build it from data with {@link #of}: each {@link Column} becomes a
   * header, and each data element becomes a row. An optional {@code summary} row
   * (e.g. a totals line) and optional relative column {@code widths} are supported.
   */
  record Table(List<String> headers, List<Align> aligns, float[] widths,
               List<List<String>> rows, List<String> summary) implements Block {

    public static <T> Table of(List<Column<T>> cols, List<T> data,
                               List<String> summary, float[] widths) {
      List<String> headers = cols.stream().map(Column::header).toList();
      List<Align> aligns = cols.stream().map(Column::align).toList();
      List<T> safe = data == null ? List.of() : data;
      List<List<String>> rows = safe.stream()
          .map(d -> cols.stream().map(c -> nz(c.value().apply(d))).toList())
          .toList();
      return new Table(headers, aligns, widths, rows, summary);
    }

    public static <T> Table of(List<Column<T>> cols, List<T> data, List<String> summary) {
      return of(cols, data, summary, null);
    }

    private static String nz(String s) {
      return s == null ? "" : s;
    }
  }
}
