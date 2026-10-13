import React from 'react';
import useUI from '@/stores/ui';
import CatalogSidebar from './CatalogSidebar';

export default function FilterDrawer({ products, total, current, onToggleParam, onPriceApply, onClearAll }) {
  const ui = useUI();
  const open = ui.filterOpen;

  return (
    <>
      <div
        className={'overlay' + (open ? ' show' : '')}
        onClick={() => ui.closeFilters()}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      />
      <aside
        className={'filter-drawer' + (open ? ' open' : '')}
        aria-hidden={!open}
      >
        <div className="drawer-handle" />
        <div className="drawer-head">
          <strong>Filtros</strong>
          <button className="drawer-close" onClick={() => ui.closeFilters()} aria-label="Cerrar filtros">
            ✕
          </button>
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
          {onClearAll && (
            <button className="btn-sm ghost" onClick={onClearAll} type="button">
              Limpiar
            </button>
          )}
          <button className="btn block" onClick={() => ui.closeFilters()}>
            Ver {total || 0} resultados
          </button>
        </div>
      </aside>
    </>
  );
}
