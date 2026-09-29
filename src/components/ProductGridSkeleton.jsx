import React from 'react';

export default function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card skeleton" style={{ aspectRatio: '4/5', minHeight: 320 }} />
      ))}
    </div>
  );
}