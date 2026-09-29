import React from 'react';
import { Link } from 'react-router-dom';
import { money } from '@/services/settings';
import WishlistButton from '@/components/WishlistButton';

export default function ProductCard({ product }) {
  const out = !product.inStock;
  const tags = product.tags || [];
  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className={'pic' + (out ? ' out' : '')}>
        <img loading="lazy" src={product.image} alt={product.name} />
        {out && <span className="pic-badge">Agotado</span>}
        <span className="card-heart"><WishlistButton productId={product.id} size={28} /></span>
      </div>
      <div className="product-meta">
        <div>
          <h3>{product.name}</h3>
          <p>{money(product.price)}</p>
        </div>
        <div className="card-colors" aria-label="Colores disponibles">
          {(product.colors || []).slice(0, 4).map((c) => (
            <span
              key={c.name}
              title={c.name}
              style={{
                background: c.hex || '#ccc',
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,.25)'
              }}
            />
          ))}
        </div>
      </div>
      {tags.length > 0 && <span className="card-tag">{tags[0] === 'sale' ? 'SALE' : tags[0].toUpperCase()}</span>}
    </Link>
  );
}