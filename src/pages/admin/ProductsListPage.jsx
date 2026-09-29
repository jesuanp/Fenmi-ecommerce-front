import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';

export default function AdminProductsPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const ui = useUI();
  const [data, setData] = useState(null);
  const [q, setQ] = useState(params.get('q') || '');
  const [page, setPage] = useState(1);

  const load = () => {
    adminApi.listProducts({ page, limit: 15, q: q || undefined }).then(setData).catch(() => {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const remove = async (p) => {
    if (!window.confirm(`¿Desactivar "${p.name}"?`)) return;
    await adminApi.deleteProduct(p.id);
    ui.showToast('Producto desactivado');
    load();
  };

  return (
    <div>
      <div className="admin-top">
        <h1 className="admin-title">Productos</h1>
        <Link to="/admin/products/new" className="btn lime small">+ Nuevo producto</Link>
      </div>
      <div className="admin-toolbar">
        <input type="text" placeholder="Buscar por nombre o SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-sm" onClick={() => { setPage(1); load(); }}>Buscar</button>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Flags</th><th></th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <div style={{ color: 'var(--light)', fontSize: 11 }}>{p.slug}</div>
                </td>
                <td>{p.category?.name || '—'}</td>
                <td>{money(p.base_price)}</td>
                <td><span className={'status-badge ' + (p.active ? 'active' : 'cancelled')}>{p.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  {p.featured && '★ '}{p.is_new && 'NEW '}{p.best_seller && '🔥'}
                </td>
                <td>
                  <div className="admin-actions">
                    <Link className="btn-sm" to={`/admin/products/${p.id}/edit`}>Editar</Link>
                    <button className="btn-sm danger" onClick={() => remove(p)}>Desactivar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination?.totalPages > 1 && (
          <div className="pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
            <span>Página {page} de {data.pagination.totalPages}</span>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}