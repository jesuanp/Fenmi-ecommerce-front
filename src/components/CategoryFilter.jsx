import React from 'react';

export default function CategoryFilter({ categories = [], selected, onToggle }) {
  if (categories.length === 0) return null;

  return (
    <div className="filter-categories">
      {categories.map((cat) => {
        const isSelected = selected === cat.slug;
        return (
          <button
            key={cat.slug}
            type="button"
            className={'cat-pill' + (isSelected ? ' selected' : '')}
            onClick={() => onToggle(isSelected ? null : cat.slug)}
            aria-pressed={isSelected}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
