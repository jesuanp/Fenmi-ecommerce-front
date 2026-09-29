import React from 'react';

export default function SizeFilter({ sizes = [], selected, onToggle }) {
  if (sizes.length === 0) return null;

  return (
    <div className="filter-sizes">
      {sizes.map((s) => {
        const isSelected = selected === s;
        return (
          <button
            key={s}
            className={'size-swatch' + (isSelected ? ' selected' : '')}
            onClick={() => onToggle(isSelected ? null : s)}
            aria-pressed={isSelected}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
