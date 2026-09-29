import React, { useEffect, useState } from 'react';
import productApi from '@/services/products';
import ColorFilter from './ColorFilter';
import SizeFilter from './SizeFilter';
import PriceFilter from './PriceFilter';
import CategoryFilter from './CategoryFilter';

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
    for (const v of p.variants || []) {
      const hex = v.colorHex || v.color?.hex;
      const name = v.color || v.color?.name;
      if (hex && !seen.has(hex)) {
        seen.set(hex, { name: name || hex, hex });
      }
    }
  }
  return Array.from(seen.values());
}

function extractSizes(products) {
  const seen = new Set();
  for (const p of products || []) {
    for (const v of p.variants || []) {
      const size = v.size || v.size?.name;
      if (size) seen.add(size);
    }
  }
  return Array.from(seen).sort();
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

      <Accordion label="Color" defaultOpen={colors.length > 0}>
        <ColorFilter
          colors={colors}
          selected={current.color}
          onToggle={(name) => onToggleParam('color', name)}
        />
      </Accordion>

      <Accordion label="Talla" defaultOpen={sizes.length > 0}>
        <SizeFilter
          sizes={sizes}
          selected={current.size}
          onToggle={(s) => onToggleParam('size', s)}
        />
      </Accordion>

      <Accordion label="Precio">
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
