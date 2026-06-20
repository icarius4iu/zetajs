// SPDX-License-Identifier: MIT
// Validation for backend document generation: which output formats are
// permitted, and whether the incoming data is well-formed and bounded.

// Output formats LibreOffice can convert a .docx into that we allow.
export const ALLOWED_FORMATS: string[] = ['pdf', 'odt', 'docx', 'doc', 'rtf', 'html', 'txt'];

// Bound the document "growth" so a huge/garbage payload can't blow up the box.
export const MAX_ITEMS = 5000;

export interface InvoiceItem { desc: string; qty: number; price: number; }
export interface Invoice {
  customer: string;
  number: string;
  date: string;
  items: InvoiceItem[];
}

/** Throw unless `fmt` is one of the permitted output formats. */
export function validateFormat(fmt: string): void {
  if (!ALLOWED_FORMATS.includes(fmt)) {
    throw new Error(
      `Output format "${fmt}" is not permitted. Allowed: ${ALLOWED_FORMATS.join(', ')}.`,
    );
  }
}

/** Throw with a clear list of every problem if the invoice data is invalid. */
export function validateInvoice(data: any): void {
  const errors: string[] = [];
  const filled = (v: any) => typeof v === 'string' && v.trim() !== '';

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invoice data must be a JSON object.');
  }
  if (!filled(data.customer)) errors.push('customer is required (non-empty string).');
  if (!filled(data.number)) errors.push('number is required (non-empty string).');
  if (!filled(data.date)) errors.push('date is required (non-empty string).');

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('items must be a non-empty array.');
  } else if (data.items.length > MAX_ITEMS) {
    errors.push(`too many items: ${data.items.length} (max ${MAX_ITEMS}).`);
  } else {
    data.items.forEach((it: any, i: number) => {
      if (!it || typeof it !== 'object') { errors.push(`items[${i}] must be an object.`); return; }
      if (!filled(it.desc)) errors.push(`items[${i}].desc is required (non-empty string).`);
      const qty = Number(it.qty);
      const price = Number(it.price);
      if (!Number.isFinite(qty) || qty < 0) errors.push(`items[${i}].qty must be a number >= 0.`);
      if (!Number.isFinite(price) || price < 0) errors.push(`items[${i}].price must be a number >= 0.`);
    });
  }

  if (errors.length > 0) {
    throw new Error('Invalid invoice data:\n  - ' + errors.join('\n  - '));
  }
}
