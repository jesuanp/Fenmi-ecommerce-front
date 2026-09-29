import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/stores/auth';
import useUI from '@/stores/ui';
import { orderApi } from '@/services/orders';
import { money } from '@/services/settings';

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagado',
  PROCESSING: 'Preparando pedido',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado'
};

const STATUSES = ['', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AccountOrdersPage() {
  const auth = useAuth();
  const ui = useUI();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    orderApi
      .list(status ? { status } : {})
      .then((d) => setData(d))
      .catch(() => setData({ data: [], pagination: { total: 0 } }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (auth.status === 'guest' && auth.checked) {
      nav('/login', { replace: true });
    }
  }, [auth.status, auth.checked]);

  const cancelOrder = async (id) => {
    if (!window.confirm('¿Seguro que quieres cancelar este pedido?')) return;
    try {
      const updated = await orderApi.cancel(id);
      ui.showToast('Pedido cancelado');
      setData((d) => ({
        ...d,
        data: d.data.map((o) => (o.id === updated.id ? updated : o))
      }));
    } catch {
      ui.showToast('No se pudo cancelar el pedido');
    }
  };

  return (
    <div className="container" style={{ padding: '56px 56px 72px', maxWidth: 980 }}>
      <div className="account-head">
        <div>
          <h1 className="page-title">Mis pedidos</h1>
          <p style={{ color: 'var(--mid)', fontSize: 13 }}>
            {auth.user?.firstName} {auth.user?.lastName} · {auth.user?.email}
          </p>
        </div>
        {auth.status === 'authenticated' && (
          <button className="btn outline small" onClick={() => auth.logoutLocal().then(load)}>
            Cerrar sesión
          </button>
        )}
      </div>

      <div className="status-filters">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            className={'status-chip' + (status === s ? ' active' : '')}
            onClick={() => setStatus(s)}
          >
            {s ? STATUS_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--mid)' }}>Cargando…</p>
      ) : data?.data?.length ? (
        <div className="orders-table">
          {data.data.map((o) => (
            <div className="order-row" key={o.id}>
              <div className="order-main">
                <strong>{o.orderNumber}</strong>
                <span className="order-date">{new Date(o.createdAt).toLocaleDateString('es-CO')}</span>
              </div>
              <div>
                <span className={'order-status ' + o.status.toLowerCase()}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
              <div className="order-total">{money(o.grandTotal)}</div>
              <div className="order-items">
                {o.items.map((it) => (
                  <span key={it.id}>
                    {it.quantity}x {it.name} ({it.color || ''}/{it.size || ''})
                  </span>
                ))}
              </div>
              <div className="order-actions">
                <Link to={`/account/orders/${o.id}`} className="text-link">
                  Ver detalle
                </Link>
                {o.status === 'PENDING_PAYMENT' && (
                  <button className="cancel-btn" onClick={() => cancelOrder(o.id)}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No hay pedidos</h3>
          <Link to="/catalog" className="btn lime">Ver catálogo</Link>
        </div>
      )}
    </div>
  );
}