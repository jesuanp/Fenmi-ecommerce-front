import { create } from 'zustand';
import client from '@/services/api';
import { setAccessToken } from '@/services/api';

// Auth (FASE 2 backend; FASE 5 integra merge del carrito; FASE 8 login UI).
// El merge se ejecuta tras detectar sesión autenticada (login, registro, refresh).
const useAuth = create((set, get) => ({
  user: null,
  status: 'unknown', // unknown | guest | authenticated
  checked: false,

  async fetchMe() {
    if (get().checked) return; // evita reintentos duplicados tras el bootstrap global
    try {
      const { data } = await client.get('/auth/me');
      // Normaliza la respuesta (todo camelCase + role string, como login/refresh).
      const u = data.data || {};
      set({
        user: {
          id: u.id,
          firstName: u.firstName ?? u.first_name,
          lastName: u.lastName ?? u.last_name,
          email: u.email,
          phone: u.phone || null,
          role: typeof u.role === 'string' ? u.role : u.role?.name || 'CUSTOMER'
        },
        status: 'authenticated',
        checked: true
      });
    } catch {
      set({ user: null, status: 'guest', checked: true });
    }
  },

  setUser(user) {
    set({ user, status: user ? 'authenticated' : 'guest', checked: true });
  },

// Tras login/registro.
  //
  // OJO: aquí NO se vuelve a pedir el merge del carrito. setUser() cambia
  // auth.status, y PublicLayout ya dispara cart.merge() al reaccionar a ese
  // cambio. Hacerlo en los dos sitios lanzaba dos merges simultáneos por inicio
  // de sesión, que es justo la condición que duplicaba carritos en la base.
  async afterLogin() {
    const { default: useCart } = await import('@/stores/cart');
    // hydrate() espera al merge en vuelo y descarta la respuesta perdedora, así
    // que recargar aquí es seguro y deja la UI al día de una vez.
    try {
      await useCart.getState().hydrate();
    } catch {
      /* noop */
    }
  },

  async logoutLocal() {
    // Llamar al backend para revocar el refresh (cookie).
    try {
      await client.post('/auth/logout');
    } catch {
      /* noop */
    }
    setAccessToken(null);
    set({ user: null, status: 'guest' });
    const { default: useCart } = await import('@/stores/cart');
    try {
      await useCart.getState().hydrate();
    } catch {
      /* noop */
    }
  }
}));

export default useAuth;