import client from './api';

export const cartApi = {
  async get() {
    return (await client.get('/cart')).data.data;
  },
  async add(productId, variantId, quantity = 1) {
    return (await client.post('/cart/items', { productId, variantId, quantity })).data.data;
  },
  async update(itemId, quantity) {
    if (itemId && String(itemId).startsWith('offline-')) {
      // Ítem solo en el fallback offline (id nunca sincronizado con BD).
      // El caller (stores/cart) lo maneja localmente sin tocar al backend.
      return { ok: true, itemId, offline: true };
    }
    return (await client.patch(`/cart/items/${itemId}`, { quantity })).data.data;
  },
  async remove(itemId) {
    if (itemId && String(itemId).startsWith('offline-')) {
      return { ok: true, itemId, offline: true };
    }
    return (await client.delete(`/cart/items/${itemId}`)).data.data;
  },
  async clear() {
    return (await client.delete('/cart')).data.data;
  },
  async merge() {
    return (await client.post('/cart/merge')).data.data;
  }
};