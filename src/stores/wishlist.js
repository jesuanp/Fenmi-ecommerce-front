import { create } from 'zustand';
import { wishlistApi } from '@/services/extras';
import useAuth from '@/stores/auth';

// Wishlist para usuarios autenticados.
const useWishlist = create((set, get) => ({
  items: [],
  loaded: false,

  async load() {
    const user = useAuth.getState().user;
    if (!user) {
      set({ items: [], loaded: true });
      return;
    }
    try {
      const items = await wishlistApi.list();
      set({ items, loaded: true });
    } catch {
      set({ items: [], loaded: true });
    }
  },

  async toggle(productId) {
    const user = useAuth.getState().user;
    if (!user) return { requiresLogin: true };
    const existing = get().items.find((i) => i.productId === productId);
    if (existing) {
      await wishlistApi.remove(productId);
      set((s) => ({ ...s, items: s.items.filter((i) => i.productId !== productId) }));
      return { added: false };
    }
    await wishlistApi.add(productId);
    await get().load();
    return { added: true };
  },

  async remove(productId) {
    await wishlistApi.remove(productId);
    set((s) => ({ ...s, items: s.items.filter((i) => i.productId !== productId) }));
  }
}));

export default useWishlist;