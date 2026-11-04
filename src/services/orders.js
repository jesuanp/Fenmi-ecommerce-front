import client from './api';

export const orderApi = {
  async create(payload) {
    return (await client.post('/orders', payload)).data.data;
  },
  async pendingCheckout() {
    return (await client.get('/orders/pending-checkout', { params: { _t: Date.now() } })).data.data;
  },
  async resumePending(id) {
    return (await client.post(`/orders/${id}/resume-pending`)).data.data;
  },
  async releasePending(id) {
    return (await client.post(`/orders/${id}/release-pending`)).data.data;
  },
  async shippingCities(q) {
    return (await client.get('/shipping/cities', { params: { q } })).data.data;
  },
  async shippingOffices(carrier, city, state) {
    return (await client.get('/shipping/offices', { params: { carrier, city, state } })).data.data;
  },
  async quote(subtotal, methodId, shipping = {}) {
    return (await client.post('/shipping/quote', { subtotal, methodId, shipping })).data.data;
  },
  async meeting(number) {
    return (await client.get(`/orders/meeting/${encodeURIComponent(number)}`)).data.data;
  },
  async meetings() {
    return (await client.get('/orders/meetings', { params: { _t: Date.now() } })).data.data;
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