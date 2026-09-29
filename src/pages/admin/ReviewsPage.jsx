import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';

export default function AdminReviewsPage() {
  const ui = useUI();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = () => adminApi.listReviews({ page, limit: 15, status: status || undefined }).then(setData);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, status]);

  const moderate = async (id, s) => {
    await adminApi.setReviewStatus(id, s);
    ui.showToast('Reseña ' + s.toLowerCase());
    load();
  };

  return (
    <div>
      <h1 className="admin-title">Reseñas</h1>
      <div className="admin-toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todas</option>
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
        </select>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Producto</th><th>Cliente</th><th>Calificación</th><th>Comentario</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {data?.data?.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.product?.name}</strong></td>
                <td>{r.user?.first_name} {r.user?.last_name}</td>
                <td>{'★'.repeat(r.rating)}</td>
                <td style={{ maxWidth: 300 }}>{r.comment}</td>
                <td><span className={'status-badge ' + r.status.toLowerCase()}>{r.status}</span></td>
                <td className="admin-actions">
                  {r.status !== 'APPROVED' && <button className="btn-sm" onClick={() => moderate(r.id, 'APPROVED')}>Aprobar</button>}
                  {r.status !== 'REJECTED' && <button className="btn-sm danger" onClick={() => moderate(r.id, 'REJECTED')}>Rechazar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}