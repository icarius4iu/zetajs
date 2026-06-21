// SPDX-License-Identifier: MIT
package io.github.icarius4iu.docgen;

import java.util.function.Function;

/**
 * A table column: a header plus a function that extracts the cell text from a
 * data element. This is the generic data-binding primitive of the engine —
 * any {@code List<T>} can be turned into a table by describing its columns.
 */
public record Column<T>(String header, Function<T, String> value, Align align) {

  public static <T> Column<T> of(String header, Function<T, String> value) {
    return new Column<>(header, value, Align.LEFT);
  }

  public static <T> Column<T> of(String header, Function<T, String> value, Align align) {
    return new Column<>(header, value, align);
  }
}
