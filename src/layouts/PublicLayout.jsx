import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import MobileMenu from '@/components/MobileMenu';
import Toast from '@/components/Toast';
import useAuth from '@/stores/auth';
import useCart from '@/stores/cart';
import useWishlist from '@/stores/wishlist';

export default function PublicLayout() {
  const auth = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();

  // Al montar: hidratar carrito + wishlist (la sesión la restaura SessionBootstrap).
  useEffect(() => {
    cart.hydrate();
    wishlist.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando la sesión pasa a autenticada (login/registro/refresh), combinar carrito invitado.
  useEffect(() => {
    if (auth.status === 'authenticated') {
      cart.merge();
      wishlist.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  return (
    <div className="site">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <MobileMenu />
      <Toast />
    </div>
  );
}