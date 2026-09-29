import React, { useEffect, useRef, useState } from 'react';

const SORTS = [
  { value: 'featured', label: 'Características' },
  { value: 'best', label: 'Más vendidos' },
  { value: 'new', label: 'Más nuevos' },
  { value: 'az', label: 'Alfabéticamente A—Z' },
  { value: 'za', label: 'Alfabéticamente Z—A' },
  { value: 'price_low', label: 'Precio: menor a mayor' },
  { value: 'price_high', label: 'Precio: mayor a menor' },
  { value: 'old', label: 'Fecha: antiguo a reciente' }
];

export default function SortPopover({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const value = current.sort || 'featured';

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="filter sort-wrap" ref={ref}>
      <button
        className={'filter-btn' + (open ? ' open' : '')}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Ordenar <span className="caret">⌄</span>
      </button>
      {open && (
        <div className="filter-popover sort-pop">
          {SORTS.map((s) => (
            <label key={s.value} className="f-check">
              <input
                type="radio"
                name="sort"
                checked={value === s.value}
                onChange={() => onChange(s.value)}
              />
              {s.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}