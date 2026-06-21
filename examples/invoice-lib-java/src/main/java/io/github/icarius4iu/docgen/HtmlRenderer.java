// SPDX-License-Identifier: MIT
package io.github.icarius4iu.docgen;

import java.nio.charset.StandardCharsets;
import java.util.List;

/** Renders a {@link Document} to standalone HTML — pure Java, no dependencies. */
public final class HtmlRenderer implements Renderer {

  @Override
  public byte[] render(Document document) {
    StringBuilder sb = new StringBuilder();
    sb.append("<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\">\n<style>")
      .append("body{font-family:Helvetica,Arial,sans-serif;font-size:12px;margin:32px;}")
      .append("h1{font-size:20px;} h2{font-size:15px;}")
      .append("table{border-collapse:collapse;width:100%;margin-top:8px;}")
      .append("th,td{border:1px solid #999;padding:4px 6px;}")
      .append("th{background:#e6e6e6;}")
      .append("tfoot td{font-weight:bold;}")
      .append("</style></head><body>\n");

    for (Block b : document.blocks()) {
      switch (b) {
        case Block.Heading h -> {
          int lvl = Math.min(Math.max(h.level(), 1), 6);
          sb.append("<h").append(lvl).append('>').append(esc(h.text())).append("</h").append(lvl).append(">\n");
        }
        case Block.Text t -> sb.append("<p>").append(esc(t.text())).append("</p>\n");
        case Block.Spacer s -> sb.append("<div style=\"height:12px\"></div>\n");
        case Block.PageBreak pb -> sb.append("<div style=\"page-break-after:always\"></div>\n");
        case Block.BulletList bl -> {
          sb.append("<ul>");
          for (String item : bl.items()) sb.append("<li>").append(esc(item)).append("</li>");
          sb.append("</ul>\n");
        }
        case Block.Table tb -> htmlTable(sb, tb);
      }
    }

    sb.append("</body></html>\n");
    return sb.toString().getBytes(StandardCharsets.UTF_8);
  }

  private static void htmlTable(StringBuilder sb, Block.Table tb) {
    int n = tb.headers().size();
    sb.append("<table><thead><tr>");
    for (int i = 0; i < n; i++) {
      sb.append("<th style=\"text-align:").append(css(tb.aligns().get(i))).append("\">")
        .append(esc(tb.headers().get(i))).append("</th>");
    }
    sb.append("</tr></thead><tbody>");
    for (List<String> row : tb.rows()) {
      sb.append("<tr>");
      for (int i = 0; i < n; i++) {
        sb.append("<td style=\"text-align:").append(css(tb.aligns().get(i))).append("\">")
          .append(esc(row.get(i))).append("</td>");
      }
      sb.append("</tr>");
    }
    sb.append("</tbody>");
    if (tb.summary() != null) {
      sb.append("<tfoot><tr>");
      for (int i = 0; i < n; i++) {
        sb.append("<td style=\"text-align:").append(css(tb.aligns().get(i))).append("\">")
          .append(esc(tb.summary().get(i))).append("</td>");
      }
      sb.append("</tr></tfoot>");
    }
    sb.append("</table>\n");
  }

  private static String css(Align a) {
    return switch (a) {
      case RIGHT -> "right";
      case CENTER -> "center";
      case LEFT -> "left";
    };
  }

  private static String esc(String s) {
    if (s == null) return "";
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
}
