import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import { money } from '@/services/settings';

const STATUSES = ['', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrdersPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [pendingProof, setPendingProof] = useState(false);
  const [page, setPage] = useState(1);

  const load = () => adminApi.listOrders({
    page,
    limit: 15,
    status: status || undefined,
    pendingProof: pendingProof ? 'true' : undefined
  }).then(setData);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, status, pendingProof]);

  return (
    <div>
      <h1 className="admin-title">Pedidos</h1>
      <div className="admin-toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'Todos los estados'}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={pendingProof}
            onChange={(e) => { setPendingProof(e.target.checked); setPage(1); }}
          />
          Solo con comprobante pendiente
        </label>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Pedido</th><th>Estado</th><th>Pago</th><th>Total</th><th>Fecha</th><th></th></tr></thead>
          <tbody>
            {data?.data?.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.orderNumber}</strong></td>
                <td><span className={'status-badge ' + o.status.toLowerCase()}>{o.status.replace('_', ' ')}</span></td>
                <td>
                  <span className={'status-badge ' + (o.paymentStatus === 'PAID' ? 'paid' : 'pending')}>
                    {o.paymentStatus}
                  </span>
                  {o.payments?.[0]?.proofUrl && o.paymentStatus !== 'PAID' && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)' }}>📎</span>
                  )}
                </td>
                <td>{money(o.grandTotal)}</td>
                <td>{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                <td><Link className="btn-sm" to={`/admin/orders/${o.id}`}>Ver</Link></td>
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
