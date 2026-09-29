import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/catalog?category=${category.slug}`}
      className="category-card"
    >
      <div className="cat-img" style={{ background: 'var(--bg)' }}>
        {category.image_url ? (
          <img src={category.image_url} alt={category.name} loading="lazy" />
        ) : (
          <span>{category.name}</span>
        )}
      </div>
      <span className="cat-label">{category.name}</span>
    </Link>
  );
}