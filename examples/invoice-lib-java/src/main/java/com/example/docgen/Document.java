// SPDX-License-Identifier: MIT
package com.example.docgen;

import java.util.ArrayList;
import java.util.List;

/** An ordered list of {@link Block}s — the format-independent document model. */
public final class Document {

  private final List<Block> blocks;

  private Document(List<Block> blocks) {
    this.blocks = List.copyOf(blocks);
  }

  public List<Block> blocks() {
    return blocks;
  }

  public static Builder builder() {
    return new Builder();
  }

  /** Fluent builder for assembling a document. */
  public static final class Builder {
    private final List<Block> blocks = new ArrayList<>();

    public Builder add(Block block) { blocks.add(block); return this; }
    public Builder heading(String text) { return add(new Block.Heading(text, 1)); }
    public Builder heading(String text, int level) { return add(new Block.Heading(text, level)); }
    public Builder text(String text) { return add(new Block.Text(text)); }
    public Builder spacer() { return add(new Block.Spacer()); }
    public Builder pageBreak() { return add(new Block.PageBreak()); }
    public Builder bullets(List<String> items) { return add(new Block.BulletList(items)); }

    public Document build() { return new Document(blocks); }
  }
}
