import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';
import settingsApi from '@/services/settings';
import { orderApi } from '@/services/orders';
import { paymentApi } from '@/services/payments';
import { addressApi } from '@/services/addresses';
import { money } from '@/services/settings';
import useAuth from '@/stores/auth';

const STEPS = ['Información', 'Envío', 'Método', 'Resumen'];

const WDEBUG = import.meta.env.DEV;
const wlog = (...a) => { if (WDEBUG) console.log('[wompi:fe]', ...a); };
const werr = (...a) => { if (WDEBUG) console.error('[wompi:fe]', ...a); };

// Diagnóstico del entorno de Wompi en el navegador.
function wompiEnvReport() {
  if (!WDEBUG) return;
  const script = document.querySelector('script[src*="checkout.wompi.co"]');
  console.log('[wompi:fe] === DIAGNÓSTICO ENTORNO WOMPI ===', {
    'script widget.js presente en DOM': script ? script.src : false,
    'typeof window.WidgetCheckout': typeof window.WidgetCheckout,
    'typeof window.WompiCheckout': typeof window.WompiCheckout,
    'typeof window.WompiButton': typeof window.WompiButton,
    'globals relacionados': Object.keys(window).filter((k) => /wompi|checkout/i.test(k))
  });
}

const WOMPI_METHODS = [
  { value: 'CARD', label: 'Tarjeta de crédito/débito', icon: '💳' },
  { value: 'PSE', label: 'PSE (transferencia bancaria)', icon: '🏦' },
  { value: 'NEQUI', label: 'Nequi', icon: '💜' },
  { value: 'BANCOLOMBIA_TRANSFER', label: 'Transferencia Bancolombia', icon: '🟡' }
];

export default function CheckoutPage() {
  const cart = useCart();
  const auth = useAuth();
  const ui = useUI();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [quote, setQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Inicial: si carrito vacío → redirect.
  useEffect(() => {
    wompiEnvReport();
    if (cart.hydrated && cart.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart.hydrated, cart.items.length]);

  const [paymentConfig, setPaymentConfig] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Cargar config de tienda (envío) y de pago (Wompi) por separado.
  useEffect(() => {
    settingsApi
      .get()
      .then((s) => setShippingMethods(s.shipping?.methods || []))
      .catch(() => {
        ui.showToast('No se pudieron cargar los métodos de envío');
        setShippingMethods([{ id: 'nacional', name: 'Envío nacional', description: '2 a 3 días hábiles', cost: 12000 }]);
      });

    // /payments/config trae publicKey + enlaces a los contratos que Wompi
    // exige aceptar (Habeas Data).
    paymentApi
      .getConfig()
      .then((c) => {
        wlog('config desde /api/payments/config →', c);
        setPaymentConfig(c);
      })
      .catch((e) => {
        werr('falló /api/payments/config →', e.response?.status, e.response?.data);
        setPaymentConfig({ provider: 'manual' });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dirección guardada del usuario (para no volver a escribirla).
  const [savedAddress, setSavedAddress] = useState(null);
  const [usingSaved, setUsingSaved] = useState(false);

  // Cargar la última dirección guardada si hay sesión.
  useEffect(() => {
    let vivo = true;
    if (!auth.user?.id) return undefined;
    addressApi
      .list()
      .then((rows) => {
        if (!vivo || !Array.isArray(rows) || rows.length === 0) return;
        setSavedAddress(rows[0]);
        setUsingSaved(true);
        wlog('dirección guardada cargada →', rows[0]);
      })
      .catch(() => {
        /* invitado o sin direcciones: seguimos con el formulario vacío */
      });
    return () => {
      vivo = false;
    };
  }, [auth.user?.id]);

  const defaults = auth.user || {};

  const [form, setForm] = useState({
    firstName: defaults.firstName || '',
    lastName: defaults.lastName || '',
    email: defaults.email || '',
    phone: defaults.phone || '',
    recipient: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CO',
    instructions: '',
    methodId: '',
    paymentMethod: ''
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Aplicar la dirección guardada a los campos de envío.
  useEffect(() => {
    if (!usingSaved || !savedAddress) return;
    setForm((f) => ({
      ...f,
      recipient: savedAddress.recipient || f.recipient,
      phone: savedAddress.phone || f.phone,
      line1: savedAddress.line1 || f.line1,
      line2: savedAddress.line2 || f.line2,
      city: savedAddress.city || f.city,
      state: savedAddress.state || f.state,
      postal_code: savedAddress.postal_code || f.postal_code,
      instructions: savedAddress.instructions || f.instructions
    }));
  }, [usingSaved, savedAddress]);

  const discardSavedAddress = () => {
    setUsingSaved(false);
    setForm((f) => ({
      ...f,
      recipient: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      instructions: ''
    }));
  };

  const wompiMode = paymentConfig?.provider === 'wompi';
  const wompiMethods = Array.isArray(paymentConfig?.methods) && paymentConfig.methods.length
    ? paymentConfig.methods
    : WOMPI_METHODS.map((m) => m.value);
  const methodLabel = (v) => WOMPI_METHODS.find((m) => m.value === v) || { label: v, icon: '•' };
  const contractsAccepted = !wompiMode || (acceptTerms && acceptPrivacy);
  const wompiReady = !wompiMode || (!!methodLabel(form.paymentMethod).label && form.paymentMethod) && contractsAccepted;

  // Recalcular quote cuando cambia método o subtotal.
  useEffect(() => {
    if (!form.methodId || cart.items.length === 0) return;
    orderApi
      .quote(cart.subtotal(), form.methodId)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [form.methodId, cart.subtotal()]);

  const infoValid = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim();
  const addrValid = form.recipient.trim() && form.phone && form.line1.trim() && form.city.trim() && form.state.trim();
  const methodValid = !!form.methodId;

  const submitOrder = async () => {
    setSubmitting(true);
    let createdOrderId = null;
    try {
      const order = await orderApi.create({
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim()
        },
        shipping: {
          recipient: form.recipient.trim(),
          phone: form.phone.trim(),
          line1: form.line1.trim(),
          line2: form.line2?.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postal_code?.trim() || null,
          country: form.country || 'CO',
          instructions: form.instructions?.trim() || null
        },
        methodId: form.methodId
      });
      createdOrderId = order.id;

      // Wompi: la transacción ya se creó en el backend; redirigimos al
      // checkout alojado por Wompi, que devuelve al cliente a /checkout/success.
      if (wompiMode) {
        wlog('llamando POST /payments/create con método', form.paymentMethod);
        const pay = await paymentApi.create(order.id, form.paymentMethod);
        wlog('respuesta de /payments/create →', pay);

        wompiEnvReport();

        if (!pay?.redirectUrl) {
          werr('el backend NO devolvió redirectUrl', { pay });
          throw new Error('Wompi no devolvió una URL de pago.');
        }
        wlog('redirigiendo a', pay.redirectUrl);
        window.location.href = pay.redirectUrl;
        return;
      }

      // Pago manual: el pedido queda PENDING_PAYMENT y el cliente sube
      // la captura del comprobante (Nequi / Bancolombia) en la página de éxito.
      ui.showToast('Pedido creado');
      await cart.hydrate();
      navigate(`/checkout/success/${order.orderNumber}`, {
        state: { orderId: order.id, provider: 'manual' }
      });
    } catch (err) {
      // Si el pedido se creó pero el pago falló, lo abandonamos para que el
      // carrito del cliente vuelva a tener sus artículos y pueda reintentar.
      if (createdOrderId) {
        try {
          await orderApi.abandon(createdOrderId);
          await cart.hydrate();
        } catch {
          /* noop: si no se puede revertir, al menos avisamos */
        }
      }

      werr('ERROR COMPLETO en submitOrder →', {
        message: err.message,
        status: err.response?.status,
        code: err.response?.data?.error?.code,
        messageApi: err.response?.data?.error?.message,
        details: err.response?.data?.error?.details,
        body: err.response?.data,
        configUrl: err.config?.url
      });

      const e = err.response?.data?.error || {};
      const details = Array.isArray(e.details) ? e.details : [];
      const list = details
        .map((d) => `${(d.path || d.field || []).join('.')}: ${d.message}`)
        .join(' · ');
      ui.showToast(list || e.message || 'Error al crear el pedido');
      if (err.response?.data?.error?.code === 'INSUFFICIENT_STOCK') {
        await cart.hydrate();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 56px 72px' }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>
        Finalizar compra
      </h1>
      <CheckoutSteps current={step} steps={STEPS} />

      <div className="checkout-layout">
        {/* ── Stepper content ── */}
        <div className="checkout-main">
          {step === 0 && (
            <div className="checkout-step">
              <h2>Información del cliente</h2>
              <Field label="Nombre" value={form.firstName} onChange={(v) => set('firstName', v)} />
              <Field label="Apellido" value={form.lastName} onChange={(v) => set('lastName', v)} />
              <Field label="Correo" type="email" value={form.email} onChange={(v) => set('email', v)} />
              <Field label="Teléfono" value={form.phone} onChange={(v) => set('phone', v)} />
            </div>
          )}

          {step === 1 && (
            <div className="checkout-step">
              <h2>Dirección de envío</h2>

              {usingSaved && savedAddress && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    background: 'var(--lime-light)',
                    border: '1px solid var(--lime)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 14,
                    fontSize: 13
                  }}
                >
                  <span>Usamos tu última dirección guardada.</span>
                  <button
                    type="button"
                    className="text-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13 }}
                    onClick={discardSavedAddress}
                  >
                    Usar otra
                  </button>
                </div>
              )}

              <Field label="Destinatario" value={form.recipient} onChange={(v) => set('recipient', v)} />
              <Field label="Dirección" value={form.line1} onChange={(v) => set('line1', v)} />
              <Field label="Apartamento (opcional)" value={form.line2} onChange={(v) => set('line2', v)} />
              <Field label="Ciudad" value={form.city} onChange={(v) => set('city', v)} />
              <Field label="Departamento" value={form.state} onChange={(v) => set('state', v)} />
              <Field label="Código postal (opcional)" value={form.postal_code} onChange={(v) => set('postal_code', v)} />
              <textarea
                className="field"
                placeholder="Instrucciones de entrega (opcional)"
                value={form.instructions}
                onChange={(e) => set('instructions', e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="checkout-step">
              <h2>Método de envío</h2>
              {shippingMethods.length === 0 ? (
                <p style={{ color: 'var(--mid)' }}>Cargando métodos…</p>
              ) : (
                shippingMethods.map((m) => (
                  <label key={m.id} className="ship-option">
                    <input
                      type="radio"
                      name="method"
                      value={m.id}
                      checked={form.methodId === m.id}
                      onChange={() => set('methodId', m.id)}
                    />
                    <div>
                      <strong>{m.name}</strong>
                      <span>{m.description}</span>
                    </div>
                    <span>{money(Number(m.cost || 0))}</span>
                  </label>
                ))
              )}
            </div>
          )}

          {step === 3 && (
            <div className="checkout-step">
              <h2>Confirmar pedido</h2>
              {wompiMode ? (
                <>
                  <p style={{ color: 'var(--mid)', fontSize: 13, marginBottom: 14 }}>
                    Elige cómo vas a pagar con Wompi. Te redirigiremos a su plataforma segura.
                  </p>
                  {wompiMethods.map((v) => {
                    const m = methodLabel(v);
                    return (
                      <label
                        key={v}
                        className="ship-option"
                        style={{ marginBottom: 8 }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={v}
                          checked={form.paymentMethod === v}
                          onChange={() => set('paymentMethod', v)}
                        />
                        <div>
                          <strong>
                            <span style={{ marginRight: 8 }}>{m.icon}</span>
                            {m.label}
                          </strong>
                        </div>
                      </label>
                    );
                  })}
                  {paymentConfig?.sandbox && (
                    <p
                      style={{
                        background: 'var(--lime-light)',
                        color: 'var(--teal-dark)',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        marginTop: 10
                      }}
                    >
                      Modo sandbox — usa las tarjetas de prueba de Wompi
                    </p>
                  )}

                  {/* Wompi exige aceptación explícita de los contratos
                      (Ley 1581 de Habeas Data). Sin ambas casillas no se puede pagar. */}
                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      display: 'grid',
                      gap: 10
                    }}
                  >
                    <p style={{ fontSize: 12, color: 'var(--mid)', margin: 0 }}>
                      Wompi requiere tu aceptación explícita de sus contratos para procesar el pago.
                    </p>
                    <label className="check-row" style={{ alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                      />
                      <span style={{ fontSize: 13 }}>
                        He leído y acepto los{' '}
                        <a
                          href={paymentConfig?.termsUrl || 'https://wompi.com/assets/downloadble/reglamento-Usuarios-Colombia.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--teal)', textDecoration: 'underline' }}
                        >
                          términos y condiciones de Wompi
                        </a>
                        .
                      </span>
                    </label>
                    <label className="check-row" style={{ alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={acceptPrivacy}
                        onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      />
                      <span style={{ fontSize: 13 }}>
                        He leído y acepto la{' '}
                        <a
                          href={paymentConfig?.privacyUrl || 'https://wompi.com/assets/downloadble/autorizacion-tratamiento-datos-personales.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--teal)', textDecoration: 'underline' }}
                        >
                          autorización de tratamiento de datos personales
                        </a>
                        .
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--mid)', fontSize: 13 }}>
                  Al confirmar crearás tu pedido. El pago se procesa en el siguiente paso.
                </p>
              )}
            </div>
          )}

          <div className="checkout-nav">
            {step > 0 && (
              <button className="btn outline" onClick={() => setStep(step - 1)}>
                ← Volver
              </button>
            )}
            {step < 3 ? (
              <button
                className="btn"
                disabled={
                  (step === 0 && !infoValid) ||
                  (step === 1 && !addrValid) ||
                  (step === 2 && !methodValid)
                }
                onClick={() => setStep(step + 1)}
              >
                Continuar →
              </button>
            ) : (
              <button
                className="btn lime block"
                disabled={submitting || (wompiMode && !wompiReady)}
                onClick={submitOrder}
              >
                {submitting
                  ? 'Creando pedido…'
                  : wompiMode
                  ? 'Pagar con Wompi'
                  : 'Realizar pedido'}
              </button>
            )}
          </div>
        </div>

        {/* ── Resumen lateral ── */}
        <div className="checkout-summary">
          <h3>Tu orden</h3>
          {cart.items.map((item) => (
            <div key={item.itemId} className="cs-line">
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.color} / {item.size} · x{item.quantity}
                </span>
              </div>
              <span>{money(item.subtotal)}</span>
            </div>
          ))}
          <div className="cs-totals">
            <div className="cs-row">
              <span>Subtotal</span>
              <span>{money(cart.subtotal())}</span>
            </div>
            {cart.discount > 0 && (
              <div className="cs-row">
                <span>Descuento</span>
                <span style={{ color: 'var(--teal)' }}>−{money(cart.discount)}</span>
              </div>
            )}
            <div className="cs-row">
              <span>Envío</span>
              <span>
                {quote ? (quote.free ? 'Gratis' : money(quote.cost)) : '—'}
              </span>
            </div>
            <div className="cs-total">
              <span>Total</span>
              <strong>
                {quote
                  ? money((cart.total || cart.subtotal()) + (quote.free ? 0 : quote.cost))
                  : money(cart.total || cart.subtotal())}
              </strong>
            </div>
          </div>
          <Link to="/cart" className="text-link">
            ← Volver al carrito
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="checkout-field">
      <span>{label}</span>
      <input
        className="field"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function CheckoutSteps({ current, steps }) {
  return (
    <div className="checkout-steps">
      {steps.map((s, i) => (
        <div key={s} className={'cs-step' + (i <= current ? ' done' : '') + (i === current ? ' active' : '')}>
          <span>{i + 1}</span>
          {s}
        </div>
      ))}
    </div>
  );
}