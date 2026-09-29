import client from './api';

export const orderApi = {
  async create(payload) {
    return (await client.post('/orders', payload)).data.data;
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
  }
};