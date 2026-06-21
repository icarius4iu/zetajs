// SPDX-License-Identifier: MIT
package io.github.icarius4iu.invoice;

import java.util.List;

/** Invoice data model (Jackson maps JSON onto this record directly). */
public record Invoice(String customer, String number, String date, List<Item> items) {}
