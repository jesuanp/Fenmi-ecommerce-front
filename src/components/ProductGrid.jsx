import React from 'react';
import ProductCard from '@/components/ProductCard';

export default function ProductGrid({ products, cols = 4 }) {
  return (
    <div
      className={'product-grid grid-' + cols}
      style={{ '--cols': cols }}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}