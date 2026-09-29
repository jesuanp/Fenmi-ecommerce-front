import React from 'react';
import { Link } from 'react-router-dom';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';
import CouponInput from '@/components/CouponInput';

export default function CartDrawer() {
  const cart = useCart();
  const ui = useUI();

  if (!ui.cartOpen) return null;

  return (
    <>
      <div
        className={'overlay' + (ui.cartOpen ? ' show' : '')}
        onClick={() => ui.closeCart()}
      />
      <aside className={'drawer' + (ui.cartOpen ? ' open' : '')}>
        <div className="drawer-head">
          <strong>Tu carrito</strong>
          <button className="drawer-close" onClick={() => ui.closeCart()}>
            ✕
          </button>
        </div>
        {cart.items.length === 0 ? (
          <div style={{ padding: '30px 0', color: 'var(--mid)', fontSize: '13px' }}>
            Tu carrito está vacío.
          </div>
        ) : (
          <div style={{ padding: '20px 0', display: 'grid', gap: '14px' }}>
            {cart.items.map((item) => (
              <div key={item.itemId} className="cart-line">
                <img src={item.image} alt={item.name} />
                <div className="cart-line-info">
                  <strong>{item.name}</strong>
                  <span className="cart-line-meta">
                    {item.color} / {item.size}
                  </span>
                  <div className="cart-line-qty">
                    <button
                      onClick={() => cart.updateQuantity(item.itemId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => cart.updateQuantity(item.itemId, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button className="cart-remove" onClick={() => cart.remove(item.itemId)}>
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="cart-line-price">{money(item.subtotal)}</div>
              </div>
            ))}
          </div>
        )}
        {cart.items.length > 0 && (
          <div className="cart-foot">
            <CouponInput />
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>{money(cart.subtotal())}</strong>
            </div>
            {cart.discount > 0 && (
              <div className="cart-total discount">
                <span>Descuento</span>
                <strong>−{money(cart.discount)}</strong>
              </div>
            )}
            <div className="cart-total total">
              <span>Total</span>
              <strong>{money(cart.total || cart.subtotal())}</strong>
            </div>
            <Link to="/checkout" className="btn lime block" onClick={() => ui.closeCart()}>
              Ir a pagar
            </Link>
            <Link to="/cart" className="btn outline block" onClick={() => ui.closeCart()}>
              Ver carrito
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}