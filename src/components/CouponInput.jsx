import React, { useState } from 'react';
import { couponApi } from '@/services/extras';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';

export default function CouponInput() {
  const cart = useCart();
  const ui = useUI();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await couponApi.apply(code);
      cart.hydrateFrom(updated);
      ui.showToast('Descuento aplicado');
      setCode('');
    } catch (err) {
      ui.showToast(err.response?.data?.error?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    try {
      const updated = await couponApi.remove();
      cart.hydrateFrom(updated);
      ui.showToast('Descuento eliminado');
    } catch { /* noop */ }
  };

  if (cart.coupon) {
    return (
      <div className="coupon-applied">
        <span>Descuento aplicado: <strong>{cart.coupon.code}</strong> (−${cart.coupon.discount?.toLocaleString?.('es-CO')})</span>
        <button type="button" className="coupon-remove" onClick={remove}>Quitar</button>
      </div>
    );
  }

  return (
    <form className="coupon-form" onSubmit={apply}>
      <input placeholder="Código de descuento" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Código de descuento" />
      <button className="btn-sm" type="submit" disabled={loading || !code.trim()}>
        {loading ? '…' : 'Aplicar'}
      </button>
    </form>
  );
}