import React, { useEffect, useState } from 'react';
import productApi from '@/services/products';
import ColorFilter from './ColorFilter';
import SizeFilter from './SizeFilter';
import PriceFilter from './PriceFilter';
import CategoryFilter from './CategoryFilter';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '1XL', '2XL', '3XL'];

function Accordion({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="sidebar-section">
      <button className="sidebar-section-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{label}</span>
        <span className={'sidebar-caret' + (open ? ' open' : '')}>›</span>
      </button>
      {open && <div className="sidebar-section-body">{children}</div>}
    </div>
  );
}

function extractColors(products) {
  const seen = new Map();
  for (const p of products || []) {
    for (const c of p.colors || []) {
      if (c && c.hex && !seen.has(c.hex)) {
        seen.set(c.hex, { name: c.name, hex: c.hex });
      }
    }
  }
  return Array.from(seen.values());
}

function extractSizes(products) {
  const seen = new Set();
  for (const p of products || []) {
    for (const s of p.sizes || []) {
      if (s) seen.add(s);
    }
  }
  return Array.from(seen).sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return String(a).localeCompare(String(b));
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function computePriceRange(products) {
  let min = Infinity;
  let max = 0;
  for (const p of products || []) {
    const price = Number(p.price) || 0;
    if (price < min) min = price;
    if (price > max) max = price;
  }
  return { min: min === Infinity ? 0 : min, max };
}

export default function CatalogSidebar({ products = [], current = {}, onToggleParam, onPriceApply }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productApi.categories().then((cats) => setCategories(cats || []));
  }, []);

  const colors = extractColors(products);
  const sizes = extractSizes(products);
  const { min: globalMin, max: globalMax } = computePriceRange(products);

  return (
    <aside className="catalog-sidebar">
      <Accordion label="Categoría" defaultOpen>
        <CategoryFilter
          categories={categories}
          selected={current.category}
          onToggle={(slug) => onToggleParam('category', slug)}
        />
      </Accordion>

      <Accordion label="Color" defaultOpen>
        <ColorFilter
          colors={colors}
          selected={current.color}
          onToggle={(name) => onToggleParam('color', name)}
        />
      </Accordion>

      <Accordion label="Talla" defaultOpen>
        <SizeFilter
          sizes={sizes}
          selected={current.size}
          onToggle={(s) => onToggleParam('size', s)}
        />
      </Accordion>

      <Accordion label="Precio" defaultOpen>
        <PriceFilter
          min={globalMin}
          max={globalMax}
          selectedMin={current.minPrice}
          selectedMax={current.maxPrice}
          onApply={(min, max) => onPriceApply(min, max)}
        />
      </Accordion>
    </aside>
  );
}
