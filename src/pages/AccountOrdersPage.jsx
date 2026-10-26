import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/stores/auth';
import { paymentApi, readPendingPayment, clearPendingPayment } from '@/services/payments';
import useCart from '@/stores/cart';
import { orderApi } from '@/services/orders';
import { returnsApi } from '@/services/returns';
import { money } from '@/services/settings';
import { ORDER_STATUS_LABELS } from '@/utils/orderDisplay';

const RETURN_STATUS_LABELS = {
  PENDING: 'En revisión',
  PROCESSING: 'Reembolso solicitado',
  APPROVED: 'Reembolso confirmado',
  REJECTED: 'Rechazada'
};

const STATUSES = ['', 'PAID', 'PAID_STOCK_ISSUE', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'];

export default function AccountOrdersPage() {
  const auth = useAuth();
  const cart = useCart();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const pending = readPendingPayment();
      if (pending?.provider === 'wompi' && pending?.orderNumber) {
        try {
          const result = await paymentApi.verify('wompi', pending.orderNumber);
          if (result?.confirmed) {
            clearPendingPayment();
            await cart.hydrate();
          }
        } catch {
          // No asumir aprobación si la verificación no responde.
        }
      }
      setData(await orderApi.list(status ? { status } : {}));
    } catch {
      setData({ data: [], pagination: { total: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const loadReturns = () => {
    if (auth.status !== 'authenticated') {
      setReturns([]);
      return;
    }
    returnsApi
      .mine()
      .then((rows) => setReturns(rows || []))
      .catch(() => setReturns([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (auth.status === 'authenticated') loadReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  useEffect(() => {
    if (auth.status === 'guest' && auth.checked) {
      nav('/login', { replace: true });
    }
  }, [auth.status, auth.checked]);

  return (
    <div className="container" style={{ padding: 'clamp(24px, 5vw, 56px) clamp(16px, 5vw, 56px) 72px', maxWidth: 980 }}>
      <div className="account-head">
        <div>
          <h1 className="page-title">Mis pedidos</h1>
          <p style={{ color: 'var(--mid)', fontSize: 13 }}>
            {auth.user?.firstName} {auth.user?.lastName} · {auth.user?.email}
            <span style={{ display: 'block', marginTop: 5 }}>Aquí aparecen únicamente las compras con pago confirmado.</span>
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
            {s ? ORDER_STATUS_LABELS[s] : 'Todos'}
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
                  {ORDER_STATUS_LABELS[o.status] || o.status}
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

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No tienes compras pagadas en este filtro</h3>
          <p>Los productos de los intentos de pago sin confirmar permanecen en tu carrito.</p>
          <Link to="/cart" className="btn lime">Ver carrito</Link>
        </div>
      )}

      {auth.status === 'authenticated' && returns.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 className="page-title" style={{ fontSize: 22, marginBottom: 14 }}>
            Mis solicitudes de devolución
          </h2>
          <div className="orders-table">
            {returns.map((r) => (
              <div className="order-row" key={r.id} style={{ gridTemplateColumns: '1fr auto 1fr auto' }}>
                <div className="order-main">
                  <strong>{r.order?.orderNumber || `Pedido #${r.orderId}`}</strong>
                  <span className="order-date">Solicitud #{r.id} · {new Date(r.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
                <div>
                  <span className={'order-status ' + (r.status === 'APPROVED' ? 'delivered' : r.status === 'REJECTED' ? 'cancelled' : 'pending')}>
                    {RETURN_STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>
                <div style={{ color: 'var(--mid)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.adminNote ? <em>"{r.adminNote}"</em> : <span style={{ opacity: 0.7 }}>"{r.reason}"</span>}
                </div>
                <div className="order-actions">
                  <Link to={`/account/orders/${r.orderId}`} className="text-link">Ver pedido</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}