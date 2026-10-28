export const CHECKOUT_PROFILE_FIELDS = ['firstName', 'lastName', 'email', 'phone'];
export const CHECKOUT_ADDRESS_FIELDS = [
  'recipient',
  'phone',
  'line1',
  'line2',
  'city',
  'state',
  'postal_code',
  'instructions'
];

export function fillEmptyCheckoutFields(form, values, fields, touched = new Set()) {
  if (!values || !form) return form;
  let updated = form;
  for (const field of fields) {
    if (touched.has(field) || String(form[field] ?? '').trim()) continue;
    const value = String(values[field] ?? '').trim();
    if (!value) continue;
    if (updated === form) updated = { ...form };
    updated[field] = value;
  }
  return updated;
}
