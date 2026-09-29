import client from './api';

// Panel administrativo — todas requieren rol ADMIN (validadas en el backend).
export const adminApi = {
  dashboard: () => client.get('/admin/dashboard').then((r) => r.data.data),

  // Productos
  listProducts: (p) => client.get('/admin/products', { params: p }).then((r) => r.data.data),
  getProduct: (id) => client.get(`/admin/products/${id}`).then((r) => r.data.data),
  createProduct: (b) => client.post('/admin/products', b).then((r) => r.data.data),
  updateProduct: (id, b) => client.put(`/admin/products/${id}`, b).then((r) => r.data.data),
  deleteProduct: (id) => client.delete(`/admin/products/${id}`).then((r) => r.data.data),
  uploadImage: (id, file, colorId) => {
    const fd = new FormData();
    fd.append('image', file);
    if (colorId) fd.append('colorId', colorId);
    return client.post(`/admin/products/${id}/images`, fd).then((r) => r.data.data);
  },
  deleteImage: (imageId) => client.delete(`/admin/products/images/${imageId}`).then((r) => r.data.data),
  reorderImages: (id, imageIds) => client.patch(`/admin/products/${id}/images/reorder`, { imageIds }).then((r) => r.data.data),

  uploadCategoryImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return client.post('/admin/upload/category', fd).then((r) => r.data.data);
  },

  // Categorías y tags
  listCategories: () => client.get('/admin/categories').then((r) => r.data.data),
  createCategory: (b) => client.post('/admin/categories', b).then((r) => r.data.data),
  updateCategory: (id, b) => client.put(`/admin/categories/${id}`, b).then((r) => r.data.data),
  deleteCategory: (id) => client.delete(`/admin/categories/${id}`).then((r) => r.data.data),
  listTags: () => client.get('/admin/tags').then((r) => r.data.data),
  searchTags: (q) => client.get('/admin/tags/search', { params: { q } }).then((r) => r.data.data),
  createTag: (b) => client.post('/admin/tags', b).then((r) => r.data.data),
  updateTag: (id, b) => client.put(`/admin/tags/${id}`, b).then((r) => r.data.data),
  deleteTag: (id) => client.delete(`/admin/tags/${id}`).then((r) => r.data.data),

  // Pedidos
  listOrders: (p) => client.get('/admin/orders', { params: p }).then((r) => r.data.data),
  getOrder: (id) => client.get(`/admin/orders/${id}`).then((r) => r.data.data),
  changeOrderStatus: (id, toStatus, note) => client.patch(`/admin/orders/${id}/status`, { toStatus, note }).then((r) => r.data.data),
  approveOrderPayment: (paymentId) => client.post(`/admin/orders/${paymentId}/approve-payment`).then((r) => r.data.data),
  rejectOrderPayment: (paymentId, reason) => client.post(`/admin/orders/${paymentId}/reject-payment`, { reason }).then((r) => r.data.data),

  // Usuarios
  listUsers: (p) => client.get('/admin/users', { params: p }).then((r) => r.data.data),
  getUser: (id) => client.get(`/admin/users/${id}`).then((r) => r.data.data),
  setBlocked: (id, blocked) => client.patch(`/admin/users/${id}/block`, { blocked }).then((r) => r.data.data),

  // Inventario
  listInventory: (p) => client.get('/admin/inventory', { params: p }).then((r) => r.data.data),
  adjustStock: (variantId, b) => client.post(`/admin/inventory/${variantId}/adjust`, b).then((r) => r.data.data),
  movements: (variantId) => client.get(`/admin/inventory/${variantId}/movements`).then((r) => r.data.data),

  // Reseñas
  listReviews: (p) => client.get('/admin/reviews', { params: p }).then((r) => r.data.data),
  setReviewStatus: (id, status) => client.patch(`/admin/reviews/${id}`, { status }).then((r) => r.data.data),

  // Cupones
  listCoupons: () => client.get('/admin/coupons').then((r) => r.data.data),
  createCoupon: (b) => client.post('/admin/coupons', b).then((r) => r.data.data),
  updateCoupon: (id, b) => client.put(`/admin/coupons/${id}`, b).then((r) => r.data.data),
  deleteCoupon: (id) => client.delete(`/admin/coupons/${id}`).then((r) => r.data.data),

  // Settings
  getSettings: () => client.get('/admin/settings').then((r) => r.data.data),
  updateSettings: (b) => client.put('/admin/settings', b).then((r) => r.data.data),

  // Auditoría
  auditLogs: (p) => client.get('/admin/audit-logs', { params: p }).then((r) => r.data.data)
};