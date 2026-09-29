import client from './api';

// El frontend NUNCA marca el pago como aprobado: solo inicia el pago
// y el backend lo confirma vía webhook del proveedor o vía aprobación admin.
export const paymentApi = {
  async create(orderId, method) {
    return (await client.post('/payments/create', { orderId, method })).data.data;
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
  async status(provider, reference) {
    return (await client.get(`/payments/${provider}/${reference}/status`)).data.data;
  }
};
