import { create } from 'zustand';
import { cartApi } from '@/services/cart';

const FALLBACK_KEY = 'fenmi_cart_guest';

// El backend recalculó precios → estado autoritativo. Solo se persiste fallback offline.
function loadFallback() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]');
  } catch {
    return [];
  }
}

function setFallback(items) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

// Normaliza la respuesta del backend a todo el estado del carrito.
function toState(cart) {
  return {
    items: cart?.items || [],
    discount: cart?.discount || 0,
    total: cart?.total || 0,
    coupon: cart?.coupon || null
  };
}

const useCart = create((set, get) => ({
  items: [],
  discount: 0,
  total: 0,
  coupon: null,
  loading: false,
  hydrated: false,
  error: null,

  // Trae el carrito del backend (crea sesión invitado si hace falta).
  async hydrate() {
    set((s) => ({ ...s, loading: true, error: null }));
    try {
      const cart = await cartApi.get();
      set((s) => ({
        ...s,
        items: cart.items || [],
        discount: cart.discount || 0,
        total: cart.total || 0,
        coupon: cart.coupon || null,
        loading: false,
        hydrated: true
      }));
      setFallback(cart.items || []);
    } catch (err) {
      // Sin backend: usar fallback offline.
      const fb = loadFallback();
      set((s) => ({ ...s, items: fb, loading: false, hydrated: true, error: true }));
    }
  },

  async add(product, variant, quantity = 1) {
    if (!variant?.id || variant.stock <= 0) return false;
    try {
      const cart = await cartApi.add(product.id, variant.id, quantity);
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback(cart.items || []);
      return true;
    } catch {
      // Fallback offline.
      const items = [...get().items];
      const existing = items.find(
        (i) => i.variantId === variant.id && i.productId === product.id
      );
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.price * existing.quantity;
      } else {
        const price = Number(variant.price) || 0;
        items.push({
          itemId: `offline-${variant.id}-${Date.now()}`,
          productId: product.id,
          slug: product.slug,
          variantId: variant.id,
          color: variant.color,
          colorHex: variant.colorHex,
          size: variant.size,
          price,
          image: product.image,
          name: product.name,
          quantity,
          subtotal: price * quantity
        });
      }
      set((s) => ({ ...s, items }));
      setFallback(items);
      return true;
    }
  },

  async updateQuantity(itemId, quantity) {
    if (quantity <= 0) return get().remove(itemId);
    try {
      const cart = await cartApi.update(itemId, quantity);
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback(cart.items || []);
    } catch {
      /* noop */
    }
  },

  async remove(itemId) {
    try {
      const cart = await cartApi.remove(itemId);
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback(cart.items || []);
    } catch {
      /* noop */
    }
  },

  async clear() {
    try {
      const cart = await cartApi.clear();
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback([]);
    } catch {
      set((s) => ({ ...s, items: [] }));
      setFallback([]);
    }
  },

  // Combina carrito invitado con el del usuario tras login/registro.
  async merge() {
    try {
      const cart = await cartApi.merge();
      set((s) => ({ ...s, ...toState(cart), hydrated: true }));
      setFallback(cart.items || []);
    } catch {
      get().hydrate();
    }
  },

  // Fija el carrito desde una respuesta del backend (sin llamar a la API).
  hydrateFrom(cart) {
    const st = toState(cart);
    set((s) => ({ ...s, ...st, hydrated: true }));
    setFallback(st.items);
  },

  count() {
    return get().items.reduce((acc, i) => acc + i.quantity, 0);
  },
  subtotal() {
    return get().items.reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0);
  }
}));

export default useCart;