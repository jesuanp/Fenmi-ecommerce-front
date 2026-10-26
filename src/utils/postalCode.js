export function isOptionalPostalCodeValid(value) {
  const postalCode = String(value ?? '').trim();
  return !postalCode || /^\d{6}$/.test(postalCode);
}

export function normalizeSavedPostalCode(value) {
  const postalCode = String(value ?? '').trim();
  return /^\d{6}$/.test(postalCode) ? postalCode : '';
}
