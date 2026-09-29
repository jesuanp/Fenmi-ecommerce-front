import client from './api';

export const cartApi = {
  async get() {
    return (await client.get('/cart')).data.data;
  },
  async add(productId, variantId, quantity = 1) {
    return (await client.post('/cart/items', { productId, variantId, quantity })).data.data;
  },
  async update(itemId, quantity) {
    return (await client.patch(`/cart/items/${itemId}`, { quantity })).data.data;
  },
  async remove(itemId) {
    return (await client.delete(`/cart/items/${itemId}`)).data.data;
  },
  async clear() {
    return (await client.delete('/cart')).data.data;
  },
  async merge() {
    return (await client.post('/cart/merge')).data.data;
  }
};