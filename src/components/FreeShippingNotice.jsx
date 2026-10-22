import React from 'react';
import useCart from '@/stores/cart';
import useShippingSettings from '@/hooks/useShippingSettings';
import { money } from '@/services/settings';

// Barra de progreso de envío gratis.
// Se oculta si el admin desactiva la promo (umbral = 0).
export default function FreeShippingNotice() {
  const cart = useCart();
  const threshold = useShippingSettings();
  if (threshold <= 0) return null;

  const subtotal = cart.subtotal();
  if (subtotal <= 0) return null;

  const qualify = subtotal >= threshold;
  const faltan = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className={'fsn' + (qualify ? ' fsn-done' : '')}>
      <div className="fsn-msg">
        {qualify ? (
          <span>¡Tienes envío gratis!</span>
        ) : (
          <span>
            Te faltan <strong>{money(faltan)}</strong> para envío gratis
          </span>
        )}
      </div>
      <div className="fsn-bar" aria-hidden="true">
        <div className="fsn-fill" style={{ width: `${qualify ? 100 : pct}%` }} />
      </div>
      <div className="fsn-meta">
        {money(Math.min(subtotal, threshold))} / {money(threshold)}
      </div>
    </div>
  );
}
