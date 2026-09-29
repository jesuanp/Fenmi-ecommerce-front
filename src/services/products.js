import client from './api';

const productApi = {
  async list(params = {}) {
    return (await client.get('/products', { params })).data.data;
  },
  async getBySlug(slug) {
    return (await client.get(`/products/${slug}`)).data.data;
  },
  async related(slug) {
    return (await client.get(`/products/${slug}/related`)).data.data;
  },
  async categories() {
    return (await client.get('/categories')).data.data;
  },
  async tags() {
    return (await client.get('/tags')).data.data;
  },
  async search(q, limit = 8) {
    return (await client.get('/search', { params: { q, limit } })).data.data;
  }
};

export default productApi;