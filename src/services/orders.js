import client from './api';

export const orderApi = {
  async create(payload) {
    return (await client.post('/orders', payload)).data.data;
  },
  async pendingCheckout() {
    return (await client.get('/orders/pending-checkout')).data.data;
  },
  async resumePending(id) {
    return (await client.post(`/orders/${id}/resume-pending`)).data.data;
  },
  async releasePending(id) {
    return (await client.post(`/orders/${id}/release-pending`)).data.data;
  },
  async quote(subtotal, methodId) {
    return (await client.post('/shipping/quote', { subtotal, methodId })).data.data;
  },
  async list(params = {}) {
    return (await client.get('/orders', { params })).data.data;
  },
  async getById(id) {
    return (await client.get(`/orders/${id}`)).data.data;
  },
  async cancel(id) {
    return (await client.post(`/orders/${id}/cancel`)).data.data;
  },
  async abandon(id) {
    return (await client.post(`/orders/${id}/abandon`)).data.data;
  }
};