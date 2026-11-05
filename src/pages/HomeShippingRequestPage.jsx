import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '@/services/orders';
import { paymentApi, savePendingPayment } from '@/services/payments';
import { buildWompiWebCheckoutUrl } from '@/utils/wompiWebCheckout';
import { money } from '@/services/settings';
import useCart from '@/stores/cart';

export default function HomeShippingRequestPage() {
  const { orderNumber } = useParams();
  const cart = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError('');
      setOrder(await orderApi.shippingRequest(orderNumber));
    } catch (e) {
      setError(e.response?.data?.error?.message || 'No pudimos cargar esta solicitud de envío.');
    } finally { setLoading(false); }
  }, [orderNumber]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { paymentApi.getConfig().then(setPaymentConfig).catch(() => setPaymentConfig(null)); }, []);

  const cancel = async () => {
    if (!order?.id || !window.confirm('¿Cancelar esta solicitud? Tus productos seguirán en tu carrito.')) return;
    setBusy(true);
    try { await orderApi.releasePending(order.id); await cart.hydrate(); await refresh(); }
    catch (e) { setError(e.response?.data?.error?.message || 'No se pudo cancelar la solicitud.'); }
    finally { setBusy(false); }
  };

  const pay = async () => {
    if (!order || busy) return;
    if (!acceptTerms || !acceptPrivacy) { setError('Acepta los contratos de Wompi antes de continuar.'); return; }
    setBusy(true);
    try {
      const result = await orderApi.resumePending(order.id);
      const url = buildWompiWebCheckoutUrl(result.widget);
      savePendingPayment({ orderId: order.id, orderNumber: order.orderNumber, provider: 'wompi', fingerprint: 'home-quote-confirmed', openedAt: Date.now() });
      window.location.assign(url);
    } catch (e) {
      setError(e.response?.data?.error?.message || e.message || 'No fue posible iniciar el pago.');
      await refresh();
      setBusy(false);
    }
  };

  const pending = order?.shipping?.method?.quotePending === true;
  const expired = Boolean(order?.expiresAt && new Date(order.expiresAt) <= new Date());
  const cancelled = order?.status === 'CANCELLED';
  const paid = order?.paymentStatus === 'PAID';
  const canPay = Boolean(order && !pending && !cancelled && !paid && !expired && order.status === 'PENDING_PAYMENT');
  const carrier = order?.shipping?.method?.carrier === 'ENVIA' ? 'envía' : 'Inter Rapidísimo';

  return <main className="container shipping-meeting-page">
    <span className="shipping-meeting-eyebrow">FENMI · Envío a domicilio</span>
    <h1 className="page-title">{paid ? 'Pago confirmado' : cancelled ? 'Solicitud cancelada' : pending ? 'Solicitud de envío recibida' : 'Tarifa confirmada · revisa tu pago'}</h1>
    {loading && <p>Consultando la solicitud…</p>}
    {error && <p className="shipping-quote-error" role="alert">{error}</p>}
    {order && <div className="shipping-meeting-panel">
      <p>Referencia: <strong>{order.orderNumber}</strong></p>
      <p><strong>Transportadora:</strong> {carrier}</p>
      <div className="shipping-meeting-point"><h2>Dirección indicada</h2>
        <p>{order.shipping?.line1}{order.shipping?.line2 ? `, ${order.shipping.line2}` : ''}</p>
        <p>{order.shipping?.city}, {order.shipping?.state}</p>
        {order.shipping?.instructions && <p>{order.shipping.instructions}</p>}
      </div>
      <div className="shipping-meeting-point"><h2>Productos solicitados</h2>
        {(order.items || []).map((item) => <p key={item.id}>{item.quantity} × {item.name} · {money(item.subtotal)}</p>)}
        <p>Productos: <strong>{money(Math.max(0, order.subtotal - order.discountTotal))}</strong></p>
        {pending ? <p><strong>Flete: por confirmar. No hay cobro ni total definitivo.</strong></p> : <>
          <p>Flete confirmado: <strong>{money(order.shippingTotal)}</strong></p>
          <p>Total definitivo: <strong>{money(order.grandTotal)}</strong></p>
        </>}
      </div>
      {pending && <p>FENMI recibió tu dirección y consultará el costo real del transporte. <strong>No se realizó ningún cobro.</strong> Vuelve a esta página para revisar el importe cuando esté confirmado.</p>}
      {expired && !paid && !cancelled && <p className="shipping-quote-error">La reserva venció. Cancela la solicitud y vuelve al checkout para crear otra.</p>}
      {canPay && paymentConfig?.provider === 'wompi' && <div className="shipping-meeting-point" style={{ display: 'grid', gap: 10 }}>
        <h2>Pagar el importe confirmado</h2>
        <p>Revisa el total final antes de pagar. Wompi confirma el pago con el servidor.</p>
        <label className="check-row"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
          <span>Acepto los <a href={paymentConfig?.termsUrl || 'https://wompi.com/assets/downloadble/reglamento-Usuarios-Colombia.pdf'} target="_blank" rel="noreferrer">términos de Wompi</a>.</span>
        </label>
        <label className="check-row"><input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} />
          <span>Acepto la <a href={paymentConfig?.privacyUrl || 'https://wompi.com/assets/downloadble/autorizacion-tratamiento-datos-personales.pdf'} target="_blank" rel="noreferrer">política de tratamiento de datos</a>.</span>
        </label>
        <button type="button" className="btn lime" disabled={busy || !acceptTerms || !acceptPrivacy} onClick={pay}>{busy ? 'Preparando pago…' : `Pagar ${money(order.grandTotal)} con Wompi`}</button>
      </div>}
      {canPay && paymentConfig?.provider !== 'wompi' && <p>Tu envío tiene tarifa confirmada. Contacta con FENMI para coordinar el método de pago disponible.</p>}
      {paid && <p>El pago fue confirmado por el sistema. Puedes revisar la compra en «Mis pedidos».</p>}
      <div className="shipping-meeting-actions" style={{ gap: 10 }}>
        <button type="button" className="btn outline" onClick={refresh} disabled={busy}>Actualizar estado</button>
        <Link className="btn outline" to="/cart">Ver carrito</Link>
        {paid && <Link className="btn lime" to="/account/orders">Mis pedidos</Link>}
        {!paid && !cancelled && <button type="button" className="btn outline" disabled={busy} onClick={cancel}>Cancelar solicitud</button>}
      </div>
    </div>}
  </main>;
}
