import client from './api';

export const reviewApi = {
  async list(slug) {
    return (await client.get(`/review/products/${slug}/reviews`)).data.data;
  },
  async create(slug, { rating, title, comment }) {
    return (await client.post(`/review/products/${slug}/reviews`, { rating, title, comment })).data.data;
  }
};

export const couponApi = {
  async apply(code) {
    return (await client.post('/cart/coupon', { code })).data.data;
  },
  async remove() {
    return (await client.delete('/cart/coupon')).data.data;
  }
};

export const wishlistApi = {
  async list() {
    return (await client.get('/wishlist')).data.data;
  },
  async add(productId) {
    return (await client.post('/wishlist/items', { productId })).data.data;
  },
  async remove(productId) {
    return (await client.delete(`/wishlist/items/${productId}`)).data.data;
  },
  async status(productId) {
    return (await client.get('/wishlist/status', { params: { productId } })).data.data;
  }
};