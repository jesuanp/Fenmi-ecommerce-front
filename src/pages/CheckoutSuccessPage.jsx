import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { paymentApi } from '@/services/payments';
import settingsApi from '@/services/settings';
import useUI from '@/stores/ui';

export default function CheckoutSuccessPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const state = location.state || {};
  const ui = useUI();
  const [bankAccounts, setBankAccounts] = useState(null);
  const [bank, setBank] = useState('NEQUI');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [proofSent, setProofSent] = useState(false);
  const fileRef = useRef();
  const blobUrlRef = useRef(null);

  useEffect(() => {
    settingsApi.get().then((s) => setBankAccounts(s.bankAccounts || null));
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

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
    if (!state.orderId) {
      ui.showToast('No se pudo identificar el pedido');
      return;
    }
    setSending(true);
    try {
      await paymentApi.uploadProof(state.orderId, file, bank);
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
      <div className="success-check">✓</div>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>¡Pedido recibido!</h1>
      <p style={{ color: 'var(--mid)', fontSize: 14, marginBottom: 6 }}>
        Tu pedido <strong>{orderNumber}</strong> fue creado correctamente.
      </p>
      <p style={{ color: 'var(--mid)', fontSize: 13 }}>
        Realiza el pago y envíanos el comprobante para confirmar tu pedido.
      </p>

      {proofSent && (
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

      {/* Datos bancarios */}
      {bankAccounts && (bankAccounts.nequi?.account || bankAccounts.bancolombia?.account) && (
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

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
        <Link to="/catalog" className="btn lime">Seguir comprando</Link>
        <Link to="/" className="btn outline">Volver al inicio</Link>
      </div>
    </div>
  );
}
