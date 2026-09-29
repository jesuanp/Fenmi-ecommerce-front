import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';
import settingsApi from '@/services/settings';
import { orderApi } from '@/services/orders';
import { money } from '@/services/settings';
import useAuth from '@/stores/auth';

const STEPS = ['Información', 'Envío', 'Método', 'Resumen'];

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
    if (cart.hydrated && cart.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart.hydrated, cart.items.length]);

  // Cargar métodos de envío desde settings.
  useEffect(() => {
    settingsApi
      .get()
      .then((s) => setShippingMethods(s.shipping?.methods || []))
      .catch(() => {
        ui.showToast('No se pudieron cargar los métodos de envío');
        // Método por defecto para no bloquear el flujo.
        setShippingMethods([{ id: 'nacional', name: 'Envío nacional', description: '2 a 3 días hábiles', cost: 12000 }]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaults = auth.user || {};

  const [form, setForm] = useState({
    firstName: defaults.firstName || '',
    lastName: defaults.lastName || '',
    email: defaults.email || '',
    phone: '',
    recipient: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CO',
    instructions: '',
    methodId: ''
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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

      // Pago manual: el pedido queda PENDING_PAYMENT y el cliente sube
      // la captura del comprobante (Nequi / Bancolombia) en la página de éxito.
      ui.showToast('Pedido creado');
      await cart.hydrate();
      navigate(`/checkout/success/${order.orderNumber}`, {
        state: { orderId: order.id }
      });
    } catch (err) {
      ui.showToast('Hubo un problema al crear el pedido');
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
        Checkout
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
              <p style={{ color: 'var(--mid)', fontSize: 13 }}>
                Al confirmar crearás tu pedido. El pago se procesa en el siguiente paso.
              </p>
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
                disabled={submitting}
                onClick={submitOrder}
              >
                {submitting ? 'Creando pedido…' : 'Realizar pedido'}
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