import React from 'react';

export default function GridSwitcher({ value, onChange }) {
  return (
    <div className="grid-switcher" aria-label="Columnas de cuadrícula">
      <button
        className={'gs-btn' + (value === 4 ? ' active' : '')}
        onClick={() => onChange(4)}
        title="4 columnas"
        aria-pressed={value === 4}
      >
        <span className="gs-icon gs-4" />
      </button>
      <button
        className={'gs-btn' + (value === 5 ? ' active' : '')}
        onClick={() => onChange(5)}
        title="5 columnas"
        aria-pressed={value === 5}
      >
        <span className="gs-icon gs-5" />
      </button>
    </div>
  );
}