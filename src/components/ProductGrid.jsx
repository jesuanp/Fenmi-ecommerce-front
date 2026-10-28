import React from 'react';
import ProductCard from '@/components/ProductCard';

export default function ProductGrid({ products, cols = 4, eagerCount = 0 }) {
  return (
    <div
      className={'product-grid grid-' + cols}
      style={{ '--cols': cols }}
    >
      {products.map((p, index) => (
        <ProductCard key={p.id} product={p} priority={index < eagerCount} />
      ))}
    </div>
  );
}