// SPDX-License-Identifier: MIT
package io.github.icarius4iu.docgen;

/**
 * Turns a {@link Document} into bytes of some concrete format. Add a new output
 * format by adding a new {@code Renderer} — the document model stays the same.
 */
public interface Renderer {
  byte[] render(Document document);
}
