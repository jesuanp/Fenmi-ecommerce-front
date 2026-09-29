import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';

export default function AdminUsersPage() {
  const ui = useUI();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => adminApi.listUsers({ page, limit: 15, q: q || undefined }).then(setData);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const toggle = async (u) => {
    try {
      await adminApi.setBlocked(u.id, u.status !== 'BLOCKED');
      ui.showToast(u.status !== 'BLOCKED' ? 'Usuario bloqueado' : 'Usuario desbloqueado');
      load();
    } catch (e) {
      ui.showToast(e.response?.data?.error?.message || 'Error');
    }
  };

  return (
    <div>
      <div className="admin-top"><h1 className="admin-title">Clientes</h1></div>
      <div className="admin-toolbar">
        <input type="text" placeholder="Buscar por nombre o correo…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-sm" onClick={() => { setPage(1); load(); }}>Buscar</button>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Cliente</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead>
          <tbody>
            {data?.data?.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.first_name} {u.last_name}</strong></td>
                <td>{u.email}</td>
                <td><span className={'role-badge ' + (u.role?.name === 'ADMIN' ? 'admin' : 'customer')}>{u.role?.name}</span></td>
                <td><span className={'status-badge ' + (u.status === 'ACTIVE' ? 'active' : 'blocked')}>{u.status}</span></td>
                <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('es-CO') : '—'}</td>
                <td>
                  <div className="admin-actions">
                    <Link className="btn-sm" to={`/admin/users/${u.id}`}>Ver</Link>
                    {u.role?.name !== 'ADMIN' && (
                      <button className={'btn-sm ' + (u.status === 'ACTIVE' ? 'danger' : '')} onClick={() => toggle(u)}>
                        {u.status === 'ACTIVE' ? 'Bloquear' : 'Desbloquear'}
                      </button>
                    )}
                  </div>
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