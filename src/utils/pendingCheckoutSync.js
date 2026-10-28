export function comparePendingCheckout(local, server) {
  if (!local?.orderId) return 'NO_LOCAL';
  if (!server?.orderId) return 'NO_SERVER';
  return String(local.orderId) === String(server.orderId) ? 'MATCH' : 'DIFFERENT';
}

export function canRequestStaleRelease(verification) {
  const orderStatus = String(verification?.orderStatus || '').toUpperCase();
  return verification?.verification === 'CHECKED' &&
    orderStatus === 'CANCELLED' &&
    verification?.confirmed !== true;
}
