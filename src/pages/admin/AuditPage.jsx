import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin';

export default function AdminAuditPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);

  const load = () => adminApi.auditLogs({ page, limit: 25 }).then(setData);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  return (
    <div>
      <h1 className="admin-title">Auditoría</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Acción</th><th>Usuario</th><th>Entidad</th><th>ID</th><th>Fecha</th></tr></thead>
          <tbody>
            {data?.data?.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.action}</strong></td>
                <td>{a.user ? `${a.user.first_name} ${a.user.last_name}` : '—'}</td>
                <td>{a.entity}</td>
                <td>{a.entity_id || '—'}</td>
                <td>{new Date(a.created_at).toLocaleString('es-CO')}</td>
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