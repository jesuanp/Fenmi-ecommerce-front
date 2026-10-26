import client from './api';

// El frontend NUNCA marca el pago como aprobado: solo inicia el pago
// y el backend lo confirma vía webhook del proveedor o vía aprobación admin.
export const paymentApi = {
  async getConfig() {
    return (await client.get('/payments/config')).data.data;
  },
  async create(orderId) {
    return (await client.post('/payments/create', { orderId })).data.data;
  },
  async uploadProof(orderId, file, bank) {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('bank', bank);
    return (await client.post(`/payments/${orderId}/proof`, fd)).data.data;
  },
  async webhook(provider, payload) {
    return (await client.post(`/payments/webhook/${provider}`, payload)).data.data;
  },
  async verify(provider, reference) {
    return (await client.post(`/payments/${encodeURIComponent(provider)}/${encodeURIComponent(reference)}/verify`)).data.data;
  },
  async status(provider, reference) {
    return (await client.get(`/payments/${provider}/${reference}/status`)).data.data;
  }
};

// ── Contexto del pago en curso ─────────────────────────────────
// Wompi redirige el navegador fuera del SPA (PSE, Nequi, Bancolombia, 3DS) y
// al volver la SPA se reinicia y `location.state` se pierde. El carrito se
// conserva hasta confirmar el cobro. Guardamos el intento en sessionStorage para
// que la página de éxito se entere aunque entre por URL directa o por F5.
const PENDING_KEY = 'fenmi_pending_payment';

export function savePendingPayment(data) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(data));
  } catch {
    /* noop: si sessionStorage está bloqueado seguimos solo con location.state */
  }
}

export function readPendingPayment() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* noop */
  }
}
