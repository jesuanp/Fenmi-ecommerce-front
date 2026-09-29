import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';

export default function AdminInventoryPage() {
  const ui = useUI();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = () => adminApi.listInventory({ page, limit: 20, q: q || undefined, lowStock: filter === 'low' ? 'true' : undefined, outOfStock: filter === 'out' ? 'true' : undefined }).then(setData);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, filter]);

  const adjust = async (v, delta) => {
    const reason = prompt('Razón del ajuste:', 'Ajuste manual');
    if (reason === null) return;
    try {
      await adminApi.adjustStock(v.id, { delta, reason });
      ui.showToast('Stock actualizado');
      load();
    } catch (e) { ui.showToast(e.response?.data?.error?.message || 'Error'); }
  };

  return (
    <div>
      <h1 className="admin-title">Inventario (por variante)</h1>
      <div className="admin-toolbar">
        <input type="text" placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-sm" onClick={() => { setPage(1); load(); }}>Buscar</button>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">Todos</option>
          <option value="low">Poco stock (≤5)</option>
          <option value="out">Agotados</option>
        </select>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Producto</th><th>Color</th><th>Talla</th><th>SKU</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {data?.data?.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.product?.name}</strong></td>
                <td>{v.color?.name}</td>
                <td>{v.size?.label}</td>
                <td style={{ color: 'var(--light)', fontSize: 11 }}>{v.sku}</td>
                <td>
                  <span className={'status-badge ' + (v.stock === 0 ? 'blocked' : v.stock <= 5 ? 'pending' : 'active')}>{v.stock}</span>
                </td>
                <td className="admin-actions">
                  <button className="btn-sm" onClick={() => adjust(v, 1)}>+1</button>
                  <button className="btn-sm" onClick={() => adjust(v, -1)} disabled={v.stock <= 0}>-1</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pagination?.totalPages > 1 && (
          <div className="pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
            <span>{page} / {data.pagination.totalPages}</span>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}