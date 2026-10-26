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

// Secuenciador de peticiones.
//
// hydrate() y merge() salen disparados a la vez al montar la app (PublicLayout
// llama a uno en el effect de montaje y al otro cuando la sesión resuelve), y
// ambos escriben el estado COMPLETO del carrito. Antes ganaba la última
// respuesta que llegaba, y como el merge puede dejar la cookie apuntando a otro
// carrito, la respuesta perdedora dejaba la interfaz desincronizada del
// servidor: el producto se veía en el carrito y al pagar el backend respondía
// CART_EMPTY. Con este contador solo escribe la respuesta más reciente.
let seq = 0;
const nextSeq = () => ++seq;

// hydrate() en vuelo, para que merge() la espere en vez de competir con ella.
let inflightHydrate = null;

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
    const mine = nextSeq();
    set((s) => ({ ...s, loading: true, error: null }));
    const run = (async () => {
      try {
        const cart = await cartApi.get();
        if (mine !== seq) return cart;
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
        return cart;
      } catch (err) {
        if (mine !== seq) return null;
        // El fallback de localStorage solo sirve si la petición NO llegó al
        // servidor (red caída, timeout). Si el servidor respondió aunque fuera
        // con error, su estado manda: revivir los ítems del navegador hacía
        // ver productos que nunca llegaron al servidor y al pagar el backend
        // respondía que el carrito estaba vacío.
        if (err?.response) {
          set((s) => ({
            ...s,
            items: [],
            discount: 0,
            total: 0,
            coupon: null,
            loading: false,
            hydrated: true,
            error: true
          }));
          return null;
        }
        const fb = loadFallback();
        set((s) => ({ ...s, items: fb, loading: false, hydrated: true, error: true }));
        return null;
      }
    })();
    inflightHydrate = run;
    try {
      return await run;
    } finally {
      if (inflightHydrate === run) inflightHydrate = null;
    }
  },

  async add(product, variant, quantity = 1) {
    if (!variant?.id || variant.stock <= 0) return false;
    const mine = nextSeq();
    try {
      const cart = await cartApi.add(product.id, variant.id, quantity);
      if (mine !== seq) return true;
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback(cart.items || []);
      return true;
    } catch (err) {
      // Antes se inventaba un ítem `offline-…` cuando la API fallaba (stock
      // insuficiente, 409, timeout). El cliente veía el producto en el carrito
      // pero nunca llegó al servidor, así que POST /orders respondía
      // CART_EMPTY. Ahora propagamos el error para poder avisar al usuario.
      throw err;
    }
  },

  async updateQuantity(itemId, quantity) {
    if (quantity <= 0) return get().remove(itemId);
    const mine = nextSeq();
    try {
      const cart = await cartApi.update(itemId, quantity);
      if (mine !== seq) return;
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback(cart.items || []);
    } catch {
      /* noop */
    }
  },

  async remove(itemId) {
    const mine = nextSeq();
    try {
      const cart = await cartApi.remove(itemId);
      if (mine !== seq) return;
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback(cart.items || []);
    } catch {
      /* noop */
    }
  },

  async clear() {
    const mine = nextSeq();
    try {
      const cart = await cartApi.clear();
      if (mine !== seq) return;
      set((s) => ({ ...s, ...toState(cart) }));
      setFallback([]);
    } catch {
      set((s) => ({ ...s, items: [] }));
      setFallback([]);
    }
  },

  // Combina carrito invitado con el del usuario tras login/registro.
  async merge() {
    // Esperamos al hydrate que ya esté en vuelo. Antes ambas salidas a la vez y
    // la que perdía se llevaba el estado puesto: el merge unía el carrito
    // invitado con el del usuario, pero el hydrate (una vista de invitado que
    // ya no existía) podía llegar después y dejar la interfaz mostrando un
    // carrito que el servidor no tenía.
    if (inflightHydrate) {
      try {
        await inflightHydrate;
      } catch {
        /* la hidratación falló, seguimos con el merge */
      }
    }
    const mine = nextSeq();
    try {
      const cart = await cartApi.merge();
      if (mine !== seq) return;
      set((s) => ({ ...s, ...toState(cart), hydrated: true }));
      setFallback(cart.items || []);
    } catch (err) {
      // Un merge fallido ya no significa "carrito vacío": recargamos para
      // mostrar lo que el servidor realmente tiene (antes el catch ignoraba el
      // error y dejaba el estado como estaba, que era el ítem fantasma).
      try {
        await get().hydrate();
      } catch {
        /* noop */
      }
      throw err;
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