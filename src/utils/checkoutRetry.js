export function checkoutFingerprint({ items, customer, shipping, methodId, coupon, discount, total }) {
  const variants = (items || []).map((item) => ({
    variantId: item.variantId,
    quantity: Number(item.quantity),
    price: Number(item.price)
  })).sort((a, b) => String(a.variantId).localeCompare(String(b.variantId)));
  return JSON.stringify({ variants, customer, shipping, methodId, coupon, discount, total });
}

export function decideWompiRetry(pending, fingerprint, status) {
  if (!pending?.orderId || !pending?.orderNumber || pending.provider !== 'wompi') return 'NEW';
  if (!pending.fingerprint || pending.fingerprint !== fingerprint) return 'NEW';
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'APPROVED';
  if (['DECLINED', 'FAILED', 'VOIDED'].includes(normalized)) return 'RESTART';
  if (normalized === 'PENDING') return 'REUSE';
  return 'VERIFY';
}
