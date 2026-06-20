// SPDX-License-Identifier: MIT
package com.example.invoice;

/** A single invoice line item. */
public record Item(String desc, double qty, double price) {

  /** qty * price. */
  public double amount() {
    return qty * price;
  }
}
