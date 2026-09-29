import React from 'react';
import useUI from '@/stores/ui';
import CatalogSidebar from './CatalogSidebar';

export default function FilterDrawer({ products, current, onToggleParam, onPriceApply }) {
  const ui = useUI();

  if (!ui.filterOpen) return null;

  return (
    <>
      <div className={'overlay' + (ui.filterOpen ? ' show' : '')} onClick={() => ui.closeFilters()} />
      <aside className={'filter-drawer' + (ui.filterOpen ? ' open' : '')}>
        <div className="drawer-head">
          <strong>Filtros</strong>
          <button className="drawer-close" onClick={() => ui.closeFilters()}>✕</button>
        </div>
        <div className="filter-drawer-body">
          <CatalogSidebar
            products={products}
            current={current}
            onToggleParam={onToggleParam}
            onPriceApply={onPriceApply}
          />
        </div>
        <div className="filter-drawer-foot">
          <button className="btn block" onClick={() => ui.closeFilters()}>
            Ver {products?.length || 0} resultados
          </button>
        </div>
      </aside>
    </>
  );
}
