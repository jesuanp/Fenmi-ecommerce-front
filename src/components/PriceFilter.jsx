import React, { useState } from 'react';

export default function PriceFilter({ min: minVal, max: maxVal, selectedMin, selectedMax, onApply }) {
  const [localMin, setLocalMin] = useState(selectedMin || '');
  const [localMax, setLocalMax] = useState(selectedMax || '');

  const handleApply = () => {
    onApply(localMin || null, localMax || null);
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    onApply(null, null);
  };

  const hasFilter = selectedMin || selectedMax;

  return (
    <div className="filter-price">
      <div className="price-inputs">
        <div className="price-input-wrap">
          <span className="price-label">Min</span>
          <input
            type="number"
            className="price-input"
            placeholder={String(minVal || 0)}
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            min={0}
          />
        </div>
        <span className="price-sep">—</span>
        <div className="price-input-wrap">
          <span className="price-label">Max</span>
          <input
            type="number"
            className="price-input"
            placeholder={String(maxVal || '')}
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            min={0}
          />
        </div>
      </div>
      <div className="price-actions">
        <button className="btn-sm" onClick={handleApply}>Aplicar</button>
        {hasFilter && (
          <button className="btn-sm ghost" onClick={handleClear}>Limpiar</button>
        )}
      </div>
    </div>
  );
}
