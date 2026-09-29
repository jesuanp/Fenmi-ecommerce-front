import { create } from 'zustand';

// Estado global de UI: drawers, toasts, modales.
const useUI = create((set) => ({
  cartOpen: false,
  menuOpen: false,
  filterOpen: false,
  toast: null,

  openCart() {
    set((s) => ({ ...s, cartOpen: true, menuOpen: false }));
  },
  closeCart() {
    set((s) => ({ ...s, cartOpen: false }));
  },
  toggleMenu() {
    set((s) => ({ ...s, menuOpen: !s.menuOpen }));
  },
  closeMenu() {
    set((s) => ({ ...s, menuOpen: false }));
  },
  openFilters() {
    set((s) => ({ ...s, filterOpen: true }));
  },
  closeFilters() {
    set((s) => ({ ...s, filterOpen: false }));
  },
  closeDrawers() {
    set((s) => ({ ...s, cartOpen: false, menuOpen: false, filterOpen: false }));
  },
  showToast(message) {
    set((s) => ({ ...s, toast: message }));
    setTimeout(() => set((s) => ({ ...s, toast: null })), 2800);
  }
}));

export function useToastText() {
  return useUI((s) => s.toast);
}

export default useUI;
