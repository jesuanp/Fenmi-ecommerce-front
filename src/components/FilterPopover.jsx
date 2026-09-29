import React, { useEffect, useRef, useState } from 'react';

export default function FilterPopover({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="filter" ref={ref}>
      <button
        className={'filter-btn' + (open ? ' open' : '')}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {label} <span className="caret">⌄</span>
      </button>
      {open && <div className="filter-popover">{children}</div>}
    </div>
  );
}