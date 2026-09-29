import React from 'react';

export default function ColorFilter({ colors = [], selected, onToggle }) {
  if (colors.length === 0) return null;

  return (
    <div className="filter-colors">
      {colors.map((c) => {
        const isSelected = selected === c.name || selected === c.hex;
        return (
          <button
            key={c.hex || c.name}
            className={'color-swatch' + (isSelected ? ' selected' : '')}
            title={c.name}
            style={{ '--swatch-color': c.hex || '#ccc' }}
            onClick={() => onToggle(isSelected ? null : c.name)}
            aria-label={c.name}
            aria-pressed={isSelected}
          />
        );
      })}
    </div>
  );
}
