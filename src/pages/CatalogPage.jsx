import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import productApi from '@/services/products';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import GridSwitcher from '@/components/GridSwitcher';
import CatalogSidebar from '@/components/CatalogSidebar';
import FilterDrawer from '@/components/FilterDrawer';
import SortPopover from '@/components/SortPopover';
import useUI from '@/stores/ui';
import { usePageTitle } from '@/hooks/usePageTitle';

const SORTS = [
  { value: 'featured', label: 'Características' },
  { value: 'best', label: 'Más vendidos' },
  { value: 'new', label: 'Más nuevos' },
  { value: 'az', label: 'A—Z' },
  { value: 'za', label: 'Z—A' },
  { value: 'price_low', label: 'Precio ↑' },
  { value: 'price_high', label: 'Precio ↓' },
  { value: 'old', label: 'Más antiguos' }
];

export default function CatalogPage() {
  usePageTitle('Catálogo');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ui = useUI();
  const [state, setState] = useState({ loading: true, data: null });
  const [gridCols, setGridCols] = useState(4);

  const current = Object.fromEntries(searchParams.entries());
  const searchKey = searchParams.toString();

  useEffect(() => {
    // Mantener los productos anteriores mientras se recarga para evitar saltos de layout.
    setState((s) => ({ ...s, loading: true }));
    productApi
      .list({
        page: current.page || 1,
        limit: 24,
        sort: current.sort || 'featured',
        q: current.q,
        category: current.category,
        color: current.color,
        size: current.size,
        minPrice: current.minPrice,
        maxPrice: current.maxPrice,
        inStock: current.inStock
      })
      .then((res) => setState({ loading: false, data: res }))
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, [searchKey]);

  const update = (patch) => {
    const q = new URLSearchParams(current);
    Object.keys(patch).forEach((k) => {
      if (patch[k]) q.set(k, patch[k]);
      else q.delete(k);
    });
    navigate(`/catalog?${q.toString()}`, { replace: true });
  };

  const toggleParam = (key, value) => {
    const q = new URLSearchParams(current);
    if (value === null || value === undefined || value === '') {
      q.delete(key);
    } else {
      const cur = q.get(key);
      if (cur === value) q.delete(key);
      else q.set(key, value);
    }
    navigate(`/catalog?${q.toString()}`);
  };

  const handlePriceApply = (min, max) => {
    const q = new URLSearchParams(current);
    if (min) q.set('minPrice', min); else q.delete('minPrice');
    if (max) q.set('maxPrice', max); else q.delete('maxPrice');
    navigate(`/catalog?${q.toString()}`);
  };

  const clearAll = () => navigate('/catalog');

  const hasActiveFilters = current.category || current.color || current.size || current.minPrice || current.maxPrice || current.inStock;
  const isFirstLoad = state.loading && !state.data;
  const isReloading = state.loading && !!state.data;

  return (
    <div className="container catalog-container">
      <h1 className="page-title" style={{ marginBottom: 4 }}>Catálogo</h1>

      {/* Top bar — sort + filter button (always visible) */}
      <div className="catalog-topbar">
        <div className="topbar-left">
          <button className="btn filters-btn" onClick={() => ui.openFilters()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="20" y2="12" />
              <line x1="10" y1="18" x2="20" y2="18" />
            </svg>
            Filtros
            {hasActiveFilters && <span className="filter-badge" />}
          </button>
          <SortPopover
            current={current}
            onChange={(v) => update({ sort: v === 'featured' ? null : v })}
          />
          {hasActiveFilters && (
            <button className="clear-all" onClick={clearAll}>Borrar todo</button>
          )}
        </div>
        <div className="topbar-right">
          {state.data && <span className="count">{state.data.pagination.total} artículos</span>}
          <GridSwitcher value={gridCols} onChange={setGridCols} />
        </div>
      </div>

      {/* Layout: sidebar nativo (desktop) + grid */}
      <div className="catalog-layout">
        <div className="catalog-sidebar-wrap">
          <CatalogSidebar
            products={state.data?.data}
            current={current}
            onToggleParam={toggleParam}
            onPriceApply={handlePriceApply}
          />
        </div>

        <div className="catalog-main">
          {isReloading && <div className="catalog-loading-overlay" aria-hidden="true" />}

          {isFirstLoad ? (
            <div className="product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card skeleton" style={{ aspectRatio: '4/5' }} />
              ))}
            </div>
          ) : !state.data || state.data.data.length === 0 ? (
            <div className="empty-state">
              <h3>No hay productos</h3>
              <p>Prueba con otros filtros.</p>
              <button className="btn" onClick={clearAll}>Ver todo</button>
            </div>
          ) : (
            <div className={'product-grid grid-' + gridCols}>
              {state.data.data.map((p, index) => <ProductCard key={p.id} product={p} priority={index < 4} />)}
            </div>
          )}

          {state.data && (
            <Pagination page={state.data.pagination} onPage={(p) => update({ page: p === 1 ? null : p })} />
          )}
        </div>
      </div>

      {/* Filter drawer (bottom sheet en móvil, modal lateral en desktop) */}
      <FilterDrawer
        products={state.data?.data}
        total={state.data?.pagination?.total || 0}
        current={current}
        onToggleParam={toggleParam}
        onPriceApply={handlePriceApply}
        onClearAll={clearAll}
      />
    </div>
  );
}
