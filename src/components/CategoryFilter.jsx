import React from 'react';

export default function CategoryFilter({ categories = [], selected, onToggle }) {
  if (categories.length === 0) return null;

  return (
    <div className="filter-categories">
      {categories.map((cat) => {
        const isSelected = selected === cat.slug;
        return (
          <label key={cat.slug} className="cat-item">
            <input
              type="radio"
              name="category"
              checked={isSelected}
              onChange={() => onToggle(isSelected ? null : cat.slug)}
            />
            <span>{cat.name}</span>
          </label>
        );
      })}
    </div>
  );
}
