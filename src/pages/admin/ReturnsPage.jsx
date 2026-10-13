import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';

const STATUSES = ['', 'PENDING', 'APPROVED', 'REJECTED'];
const STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada'
};

export default function AdminReturnsPage() {
  const ui = useUI();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [working, setWorking] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi
      .listReturns({ status: status || undefined, page, limit: 20 })
      .then(setData)
      .catch(() => setData({ data: [], pagination: { total: 0, totalPages: 1 } }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const openModal = (req) => {
    setActive(req);
    setAdminNote('');
  };
  const closeModal = () => {
    if (working) return;
    setActive(null);
    setAdminNote('');
  };

  const decide = async (action) => {
    if (!active) return;
    setWorking(true);
    try {
      const fn = action === 'approve' ? adminApi.approveReturn : adminApi.rejectReturn;
      await fn(active.id, adminNote.trim() || undefined);
      ui.showToast(action === 'approve' ? 'Devolución aprobada' : 'Devolución rechazada');
      closeModal();
      load();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'No se pudo procesar la solicitud';
      ui.showToast(msg);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <h1 className="admin-title">Devoluciones</h1>
      <p style={{ color: 'var(--mid)', fontSize: 13, marginTop: -6, marginBottom: 14 }}>
        Solicitudes de devolución iniciadas por los clientes. Al aprobar se reembolsa el pedido, se restituye el stock
        y se libera el cupón si lo usó.
      </p>

      <div className="admin-toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? STATUS_LABELS[s] : 'Todos los estados'}</option>
          ))}
        </select>
      </div>

      <div className="admin-card">
        {loading ? (
          <p style={{ color: 'var(--mid)' }}>Cargando…</p>
        ) : data?.data?.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    <strong>{r.order?.orderNumber || r.orderId}</strong>
                    {r.order?.grandTotal != null && (
                      <div style={{ fontSize: 11, color: 'var(--mid)' }}>{money(r.order.grandTotal)}</div>
                    )}
                  </td>
                  <td>
                    {r.user
                      ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || r.user.email
                      : '—'}
                    {r.user?.email && (
                      <div style={{ fontSize: 11, color: 'var(--mid)' }}>{r.user.email}</div>
                    )}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <span title={r.reason} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.reason}
                    </span>
                  </td>
                  <td>
                    <span className={'status-badge ' + (r.status === 'APPROVED' ? 'paid' : r.status === 'REJECTED' ? 'cancelled' : 'pending')}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleString('es-CO')}</td>
                  <td>
                    {r.status === 'PENDING' ? (
                      <button className="btn-sm" onClick={() => openModal(r)}>Revisar</button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--mid)' }}>
                        {r.adminNote ? `Nota: ${r.adminNote}` : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--mid)' }}>No hay solicitudes {status ? `en estado "${STATUS_LABELS[status]}"` : ''}.</p>
        )}

        {data?.pagination?.totalPages > 1 && (
          <div className="pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
            <span>{page} / {data.pagination.totalPages}</span>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>→</button>
          </div>
        )}
      </div>

      {active && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <h3 style={{ marginTop: 0 }}>
              Revisar solicitud #{active.id} · Pedido {active.order?.orderNumber}
            </h3>
            <div style={{ background: 'var(--soft, #f5f5f5)', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
              <div><strong>Cliente:</strong> {active.user?.firstName} {active.user?.lastName} · {active.user?.email}</div>
              <div style={{ marginTop: 6 }}><strong>Motivo:</strong></div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{active.reason}</div>
            </div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--mid)', marginBottom: 6 }}>
              Nota interna (opcional, se incluye en el email al cliente)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Ej. Te reembolsaremos en 5 días hábiles."
              style={{ width: '100%', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn outline small" onClick={closeModal} disabled={working}>Cancelar</button>
              <button
                className="btn outline small"
                style={{ color: 'var(--danger)' }}
                onClick={() => decide('reject')}
                disabled={working}
              >
                {working ? 'Procesando…' : 'Rechazar'}
              </button>
              <button
                className="btn lime small"
                onClick={() => decide('approve')}
                disabled={working}
              >
                {working ? 'Procesando…' : 'Aprobar y reembolsar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
