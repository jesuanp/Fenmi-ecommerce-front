import React from 'react';
import { Link } from 'react-router-dom';
import useCart from '@/stores/cart';
import { money } from '@/services/settings';
import CouponInput from '@/components/CouponInput';

export default function CartPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="empty-state">
        <h3>Tu carrito está vacío</h3>
        <p>Explora el catálogo y agrega algo que te encante.</p>
        <Link to="/catalog" className="btn lime">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '56px 56px 72px' }}>
      <h1 className="page-title">Carrito</h1>
      <div className="cart-page">
        <div className="cart-page-items">
          {cart.items.map((item) => (
            <div key={item.itemId} className="cart-page-item">
              <img src={item.image} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <span className="cart-line-meta">{item.color} / {item.size}</span>
                <div className="cart-line-qty">
                  <button onClick={() => cart.updateQuantity(item.itemId, item.quantity - 1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => cart.updateQuantity(item.itemId, item.quantity + 1)}>
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
        <div className="cart-summary">
          <h3>Resumen</h3>
          <CouponInput />
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{money(cart.subtotal())}</strong>
          </div>
          {cart.discount > 0 && (
            <div className="summary-row">
              <span>Descuento</span>
              <strong style={{ color: 'var(--teal)' }}>−{money(cart.discount)}</strong>
            </div>
          )}
          <div className="summary-row muted">
            <span>Envío</span>
            <span>Gratis desde $300.000</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(cart.total || cart.subtotal())}</strong>
          </div>
          <Link to="/checkout" className="btn lime block">
            Ir a pagar
          </Link>
          <button className="btn outline block" onClick={() => cart.clear()}>
            Vaciar carrito
          </button>
          <p className="muted-note">El checkout está disponible.</p>
        </div>
      </div>
    </div>
  );
}