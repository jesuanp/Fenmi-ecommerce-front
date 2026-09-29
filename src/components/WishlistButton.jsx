import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useWishlist from '@/stores/wishlist';
import useAuth from '@/stores/auth';

export default function WishlistButton({ productId, size = 30 }) {
  const wishlist = useWishlist();
  const auth = useAuth();
  const nav = useNavigate();
  const isIn = wishlist.items.some((i) => i.productId === productId);
  const [busy, setBusy] = useState(false);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (auth.status !== 'authenticated') {
      nav('/login');
      return;
    }
    setBusy(true);
    try {
      await wishlist.toggle(productId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={'wishlist-btn' + (isIn ? ' active' : '')}
      onClick={onClick}
      disabled={busy}
      aria-label={isIn ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      style={{ width: size, height: size }}
    >
      {isIn ? '♥' : '♡'}
    </button>
  );
}