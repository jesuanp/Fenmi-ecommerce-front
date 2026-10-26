import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  paymentApi,
  readPendingPayment,
  clearPendingPayment
} from '@/services/payments';
import { orderApi } from '@/services/orders';
import settingsApi from '@/services/settings';
import useUI from '@/stores/ui';
import useCart from '@/stores/cart';

const FINAL_STATUSES = ['APPROVED', 'DECLINED', 'FAILED', 'VOIDED'];
// Tope del polling: ~2 min con esperas de 2.5-3.5s. Si el webhook no llega en
// ese plazo no es motivo para quedarse girando para siempre; el pago se
// confirma igual del lado de Wompi y le avisamos al cliente por correo.
const MAX_POLLS = 40;

export default function CheckoutSuccessPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const state = location.state || {};
  const ui = useUI();
  const cart = useCart();
  const navigate = useNavigate();

  // Wompi puede redirigirnos fuera del SPA y al volver esta página se
  // reconstruye sin location.state, así que el pedido se recupera de
  // sessionStorage (lo guarda CheckoutPage antes de abrir el widget).
  const [pending] = useState(() => readPendingPayment());
  const orderId = state.orderId || pending?.orderId || null;

  const [bankAccounts, setBankAccounts] = useState(null);
  const [bank, setBank] = useState('NEQUI');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [proofSent, setProofSent] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const [wompiStatus, setWompiStatus] = useState('VERIFYING');
  const [confirmedOrderStatus, setConfirmedOrderStatus] = useState(null);
  const [wompiTx] = useState(state.wompiTx || null);
  const fileRef = useRef();
  const blobUrlRef = useRef(null);

  const [paymentProvider, setPaymentProvider] = useState(state.provider || pending?.provider || null);

  // El proveedor real viene de /payments/config, no de la tabla de settings:
  // tras un refresh el estado de la SPA se perdió y necesitamos saber si este
  // pedido se paga por Wompi o con transferencia manual.
  useEffect(() => {
    paymentApi
      .getConfig()
      .then((c) => setPaymentProvider(c?.provider || null))
      .catch(() => {
        /* si no responde, nos quedamos con el dato de state/pending */
      });
  }, []);

  const isWompi = paymentProvider === 'wompi' || !!state.wompiTx || pending?.provider === 'wompi';

  useEffect(() => {
    settingsApi
      .get()
      .then((s) => {
        setBankAccounts(s.bankAccounts || null);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isWompi || !orderNumber) return undefined;

    let cancelled = false;
    let timer = null;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      if (attempts > MAX_POLLS) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      try {
        const r = await paymentApi.verify('wompi', orderNumber);
        if (cancelled) return;
        const s = (r && r.status) || 'PENDING';
        setWompiStatus(r?.confirmed ? 'APPROVED' : s);
        setConfirmedOrderStatus(r?.orderStatus || null);
        if (!FINAL_STATUSES.includes(String(s).toUpperCase())) {
          timer = setTimeout(tick, 2500);
        }
      } catch {
        if (!cancelled) timer = setTimeout(tick, 3500);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWompi, orderNumber]);

  // Cuando el pago llega a un estado final ya no hay nada pendiente que
  // recuperar, así que soltamos el pedido guardado en sessionStorage.
  useEffect(() => {
    if (FINAL_STATUSES.includes(String(wompiStatus || '').toUpperCase())) {
      if (readPendingPayment()?.orderNumber === orderNumber) clearPendingPayment();
      cart.hydrate();
    }
  }, [wompiStatus, orderNumber]);

  const retryPayment = async () => {
    if (!orderId) {
      ui.showToast('No se pudo identificar el pedido');
      return;
    }
    setRetrying(true);
    try {
      await orderApi.releasePending(orderId);
      if (readPendingPayment()?.orderNumber === orderNumber) clearPendingPayment();
      await cart.hydrate();
      navigate('/checkout');
    } catch (err) {
      ui.showToast(err.response?.data?.error?.message || 'No se pudo reiniciar el pago');
      setRetrying(false);
    }
  };

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(f);
    setFile(f);
    setPreview(blobUrlRef.current);
  };

  const clearFile = () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submitProof = async () => {
    if (!file) {
      ui.showToast('Selecciona una captura del comprobante');
      return;
    }
    if (!orderId) {
      ui.showToast('No se pudo identificar el pedido');
      return;
    }
    setSending(true);
    try {
      await paymentApi.uploadProof(orderId, file, bank);
      setProofSent(true);
      ui.showToast('Comprobante enviado. Te avisaremos cuando sea aprobado.');
    } catch (err) {
      ui.showToast(err.response?.data?.error?.message || 'No se pudo enviar el comprobante');
    } finally {
      setSending(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(() => ui.showToast('Copiado'));
  };

  return (
    <div className="empty-state" style={{ padding: '60px 24px' }}>
      <div className="success-check" style={{ background: isWompi && wompiStatus !== 'APPROVED' ? (FINAL_STATUSES.includes(wompiStatus) ? '#d1382c' : '#fff3cd') : undefined, color: isWompi && wompiStatus !== 'APPROVED' ? (FINAL_STATUSES.includes(wompiStatus) ? '#fff' : '#8a6d3b') : undefined }}>
        {isWompi && FINAL_STATUSES.includes(wompiStatus) && wompiStatus !== 'APPROVED' ? '✕' : isWompi && wompiStatus !== 'APPROVED' ? '…' : '✓'}
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>
        {isWompi && wompiStatus === 'APPROVED' && confirmedOrderStatus === 'PAID_STOCK_ISSUE'
          ? 'Pago confirmado · pedido en revisión'
          : isWompi && wompiStatus === 'APPROVED'
          ? '¡Pago confirmado!'
          : isWompi && ['DECLINED', 'FAILED', 'VOIDED'].includes(wompiStatus)
          ? 'El pago no fue aprobado'
          : isWompi && timedOut
          ? 'Seguimos verificando tu pago'
          : isWompi
          ? 'Esperando confirmación del pago'
          : proofSent ? 'Comprobante recibido · en revisión' : 'Esperando tu pago'}
      </h1>
      <p style={{ color: 'var(--mid)', fontSize: 14, marginBottom: 6 }}>
        {isWompi && wompiStatus !== 'APPROVED' ? 'Referencia de pago' : 'Compra'} <strong>{orderNumber}</strong>.
      </p>
      {!isWompi && (
        <p style={{ color: 'var(--mid)', fontSize: 13 }}>
          Realiza el pago y envíanos el comprobante. Los productos permanecerán en el carrito hasta la aprobación.
        </p>
      )}
      {isWompi && wompiStatus !== 'APPROVED' && (
        <p style={{ color: 'var(--mid)', fontSize: 13 }}>
          Tu compra no se marcará como pagada hasta que nuestro servidor reciba
          la confirmación de Wompi. Los productos siguen en tu carrito y esta compra no aparece en Mis pedidos.
        </p>
      )}
      {isWompi && wompiStatus === 'APPROVED' && (
        <p style={{ color: 'var(--mid)', fontSize: 13 }}>
          {confirmedOrderStatus === 'PAID_STOCK_ISSUE'
            ? 'El pago fue recibido, pero tu pedido requiere una revisión antes de preparar el envío. Nuestro equipo revisará el caso.'
            : 'Recibirás la confirmación del pago por correo. Te notificaremos cuando comience la preparación del pedido.'}
        </p>
      )}
      {isWompi && wompiStatus === 'PENDING' && !timedOut && (
        <p style={{ color: 'var(--mid)', fontSize: 13 }}>
          Estamos confirmando tu pago con Wompi. Esta página se actualizará
          automáticamente.
        </p>
      )}
      {isWompi && timedOut && (
        <p style={{ color: 'var(--mid)', fontSize: 13 }}>
          Wompi todavía no ha confirmado el resultado. Conservamos los
          productos en el carrito, pero evita iniciar otro pago si ya completaste
          una transacción bancaria. Si se aprueba, recibirás un correo.
        </p>
      )}
      {isWompi && (['DECLINED', 'FAILED', 'VOIDED'].includes(wompiStatus)) && (
        <p style={{ color: 'var(--mid)', fontSize: 13 }}>
          Tus productos permanecen en el carrito. Puedes reintentar el pago o escríbenos por WhatsApp para
          ayudarte.
        </p>
      )}

      {!isWompi && proofSent && (
        <p
          style={{
            display: 'inline-block',
            margin: '14px 0 0',
            background: '#fff3cd',
            color: '#8a6d3b',
            padding: '8px 16px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 13
          }}
        >
          Comprobante enviado — pendiente de aprobación
        </p>
      )}

      {/* Datos bancarios (solo modo manual) */}
      {!isWompi && bankAccounts && (bankAccounts.nequi?.account || bankAccounts.bancolombia?.account) && (
        <div style={{ maxWidth: 560, margin: '28px auto 0' }}>
          <h3 style={{ marginBottom: 14, fontSize: 18 }}>Realiza tu pago</h3>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
            {bankAccounts.nequi?.account && (
              <button
                type="button"
                onClick={() => setBank('NEQUI')}
                style={{
                  padding: 18,
                  borderRadius: 12,
                  border: `2px solid ${bank === 'NEQUI' ? 'var(--teal)' : 'var(--border)'}`,
                  background: bank === 'NEQUI' ? 'rgba(42,107,124,0.05)' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Nequi</div>
                <div style={{ fontSize: 13, color: 'var(--mid)' }}>{bankAccounts.nequi.holder}</div>
                <div
                  onClick={(e) => { e.stopPropagation(); copy(bankAccounts.nequi.account); }}
                  style={{ fontSize: 14, fontWeight: 600, marginTop: 6, cursor: 'pointer' }}
                  title="Copiar"
                >
                  {bankAccounts.nequi.account} 📋
                </div>
              </button>
            )}
            {bankAccounts.bancolombia?.account && (
              <button
                type="button"
                onClick={() => setBank('BANCOLOMBIA')}
                style={{
                  padding: 18,
                  borderRadius: 12,
                  border: `2px solid ${bank === 'BANCOLOMBIA' ? 'var(--teal)' : 'var(--border)'}`,
                  background: bank === 'BANCOLOMBIA' ? 'rgba(42,107,124,0.05)' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Bancolombia</div>
                <div style={{ fontSize: 13, color: 'var(--mid)' }}>{bankAccounts.bancolombia.holder}</div>
                <div
                  onClick={(e) => { e.stopPropagation(); copy(bankAccounts.bancolombia.account); }}
                  style={{ fontSize: 14, fontWeight: 600, marginTop: 6, cursor: 'pointer' }}
                  title="Copiar"
                >
                  {bankAccounts.bancolombia.account} 📋
                </div>
              </button>
            )}
          </div>

          {/* Upload del comprobante */}
          <div style={{ marginTop: 22, padding: 20, border: '1px solid var(--border)', borderRadius: 12, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>
              Envíanos la captura del pago ({bank === 'NEQUI' ? 'Nequi' : 'Bancolombia'})
            </div>

            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={preview}
                  alt=""
                  style={{ maxWidth: 240, maxHeight: 240, borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <button
                  type="button"
                  onClick={clearFile}
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 24, height: 24,
                    borderRadius: '50%', background: 'var(--danger)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1
                  }}
                >×</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '12px 18px', border: '2px dashed var(--border)',
                  borderRadius: 8, background: 'transparent', cursor: 'pointer',
                  fontSize: 13, color: 'var(--mid)'
                }}
              >
                + Adjuntar captura del comprobante
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={onSelectFile}
            />

            <button
              type="button"
              className="btn lime block"
              disabled={sending || !file}
              onClick={submitProof}
              style={{ marginTop: 16 }}
            >
              {sending ? 'Enviando…' : proofSent ? 'Reenviar comprobante' : 'Enviar comprobante'}
            </button>
          </div>
        </div>
      )}

      {/* Wompi: badge dinámico del estado del pago */}
      {isWompi && (
        <div
          style={{
            display: 'inline-block',
            margin: '14px 0 0',
            padding: '8px 16px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 13,
            background:
              wompiStatus === 'APPROVED'
                ? 'var(--lime-light)'
                : ['DECLINED', 'FAILED', 'VOIDED'].includes(wompiStatus)
                ? '#fde7e6'
                : '#fff3cd',
            color:
              wompiStatus === 'APPROVED'
                ? 'var(--teal-dark)'
                : ['DECLINED', 'FAILED', 'VOIDED'].includes(wompiStatus)
                ? '#8a2c20'
                : '#8a6d3b'
          }}
        >
          {wompiStatus === 'APPROVED'
            ? 'Pago aprobado'
            : wompiStatus === 'DECLINED'
            ? 'Pago rechazado por Wompi'
            : wompiStatus === 'FAILED'
            ? 'Pago fallido'
            : wompiStatus === 'VOIDED'
            ? 'Pago anulado'
            : 'Procesando pago…'}
        </div>
      )}

      {isWompi && wompiTx?.id && (
        <p style={{ fontSize: 11, color: 'var(--light)', marginTop: 8 }}>
          Transacción Wompi: {wompiTx.id}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
        {isWompi &&
          orderId &&
          ['DECLINED', 'FAILED', 'VOIDED'].includes(wompiStatus) && (
            <button type="button" className="btn lime" onClick={retryPayment} disabled={retrying}>
              {retrying ? 'Preparando…' : 'Reintentar el pago'}
            </button>
          )}
        {isWompi && wompiStatus !== 'APPROVED' && (
          <Link to="/cart" className="btn outline">Volver al carrito</Link>
        )}
        <Link to="/catalog" className="btn lime">Seguir comprando</Link>
        <Link to="/" className="btn outline">Volver al inicio</Link>
      </div>
    </div>
  );
}
