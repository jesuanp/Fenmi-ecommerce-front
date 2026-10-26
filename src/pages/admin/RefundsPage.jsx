import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/services/admin';
import useUI from '@/stores/ui';

const LABELS = {
  PROCESSING: 'Solicitud registrada',
  PROCESSING_PROVIDER: 'Esperando respuesta de Wompi',
  AWAITING_MANUAL: 'Devolución externa por realizar',
  NEEDS_REVIEW: 'Revisión obligatoria',
  SUCCEEDED: 'Dinero devuelto y confirmado'
};

export default function AdminRefundsPage() {
  const ui = useUI();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [referenceById, setReferenceById] = useState({});
  const [workingId, setWorkingId] = useState(null);
  const load = () => {
    setLoading(true);
    adminApi.listRefunds(filter ? { status: filter } : {})
      .then((result) => setRows(result || []))
      .catch(() => ui.showToast('No se pudieron cargar los reembolsos'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);
  const confirm = async (id) => {
    const reference = (referenceById[id] || '').trim();
    if (reference.length < 8) return ui.showToast('Indica una referencia verificable de ocho caracteres como mínimo');
    if (!window.confirm('¿El dinero ya fue devuelto efectivamente al cliente mediante el banco u otra plataforma?')) return;
    setWorkingId(id);
    try {
      await adminApi.confirmManualRefund(id, reference);
      ui.showToast('Reembolso verificado y actualizado');
      load();
    } catch (err) { ui.showToast(err.response?.data?.error?.message || 'Error al confirmar'); }
    finally { setWorkingId(null); }
  };
  return (
    <div>
      <h1 className="admin-title">Reembolsos</h1>
      <p style={{ color: 'var(--mid)', fontSize: 13 }}>Aquí se distinguen las solicitudes de devolución de dinero de los reembolsos realmente confirmados. Nunca vuelvas a ejecutar en Wompi un intento con respuesta incierta sin comprobar antes su resultado.</p>
      <div className="admin-toolbar"><select aria-label="Estado del reembolso" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Todos los estados</option>
        {Object.keys(LABELS).map((k) => <option key={k} value={k}>{LABELS[k]}</option>)}
      </select></div>
      <div className="admin-card">
        {loading ? <p>Cargando…</p> : rows.length ? <div style={{ overflowX: 'auto' }}><table className="admin-table"><thead><tr><th>Pedido</th><th>Estado</th><th>Importe</th><th>Referencia</th><th>Fecha</th><th>Acción</th></tr></thead><tbody>
          {rows.map((item) => <tr key={item.id}>
            <td><Link to={`/admin/orders/${item.order_id}`}>Pedido #{item.order_id}</Link></td>
            <td><strong>{LABELS[item.status] || item.status}</strong></td>
            <td>{new Intl.NumberFormat('es-CO').format(Number(item.amount_cents || 0) / 100)} COP</td>
            <td>{item.provider_refund_id || '—'}</td>
            <td>{new Date(item.created_at).toLocaleString('es-CO')}</td>
            <td>{item.status === 'AWAITING_MANUAL' ? <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
              <input aria-label="Comprobante del reembolso" value={referenceById[item.id] || ''} onChange={(e) => setReferenceById((prev) => ({ ...prev, [item.id]: e.target.value }))} placeholder="Número de comprobante real" />
              <button className="btn-sm" onClick={() => confirm(item.id)} disabled={workingId === item.id}>Registrar reembolso realizado</button>
            </div> : <Link className="btn-sm" to={`/admin/orders/${item.order_id}`}>Detalle</Link>}</td>
          </tr>)}
        </tbody></table></div> : <p>No hay solicitudes con este estado.</p>}
      </div>
    </div>
  );
}
