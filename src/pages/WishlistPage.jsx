import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useWishlist from '@/stores/wishlist';
import useAuth from '@/stores/auth';
import { money } from '@/services/settings';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';

export default function WishlistPage() {
  const auth = useAuth();
  const wishlist = useWishlist();
  const cart = useCart();
  const ui = useUI();
  const nav = useNavigate();

  useEffect(() => {
    if (auth.status === 'guest' && auth.checked) nav('/login', { replace: true });
  }, [auth.status, auth.checked]);

  useEffect(() => {
    wishlist.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = async (item) => {
    // Agrega el producto al carrito (primera variante disponible).
    const { default: productApi } = await import('@/services/products');
    const p = await productApi.getBySlug(item.slug);
    const variant = p.variants.find((v) => v.stock > 0);
    if (!variant) { ui.showToast('No hay stock disponible'); return; }
    await cart.add(p, variant, 1);
    ui.showToast('Agregado al carrito');
  };

  return (
    <div className="container" style={{ padding: '56px 56px 72px', maxWidth: 980 }}>
      <h1 className="page-title">Mis favoritos</h1>
      {wishlist.items.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes favoritos aún</h3>
          <p>Guarda productos tocando el ♥ en las tarjetas.</p>
          <Link to="/catalog" className="btn lime">Ver catálogo</Link>
        </div>
      ) : (
        <div className="product-grid" style={{ marginTop: 24 }}>
          {wishlist.items.map((item) => (
            <div className="product-card" key={item.productId}>
              <Link to={`/products/${item.slug}`} className="pic">
                <img loading="lazy" src={item.image} alt={item.name} />
              </Link>
              <div className="product-meta">
                <div>
                  <h3>{item.name}</h3>
                  <p>{money(item.price)}</p>
                </div>
                <div className="admin-actions">
                  <button className="btn-sm" onClick={() => addToCart(item)}>Agregar</button>
                  <button className="btn-sm danger" onClick={() => wishlist.remove(item.productId)}>Quitar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}