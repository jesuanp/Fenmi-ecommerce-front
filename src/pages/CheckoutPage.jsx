import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';
import settingsApi from '@/services/settings';
import { orderApi } from '@/services/orders';
import { paymentApi, savePendingPayment, clearPendingPayment, readPendingPayment } from '@/services/payments';
import { addressApi } from '@/services/addresses';
import { money } from '@/services/settings';
import useAuth from '@/stores/auth';
import { isOptionalPostalCodeValid, normalizeSavedPostalCode } from '@/utils/postalCode';
import { checkoutFingerprint, decideWompiRetry } from '@/utils/checkoutRetry';
import { isWompiWidgetVisible, watchWompiWidgetClose } from '@/utils/wompiWidget';
import { loadWompiWidget } from '@/utils/loadWompi';
import { buildWompiWebCheckoutUrl, shouldUseWompiWebCheckout, shouldPreferHostedWompiCheckout } from '@/utils/wompiWebCheckout';

const STEPS = ['Datos y envío', 'Entrega', 'Pago'];

const WDEBUG = import.meta.env.DEV;
const wlog = (...a) => { if (WDEBUG) console.log('[wompi:fe]', ...a); };
const werr = (...a) => { if (WDEBUG) console.error('[wompi:fe]', ...a); };

// Diagnóstico del entorno de Wompi en el navegador.
function wompiEnvReport() {
  if (!WDEBUG || shouldUseWompiWebCheckout()) return;
  const script = document.querySelector('script[src*="checkout.wompi.co"]');
  console.log('[wompi:fe] === DIAGNÓSTICO ENTORNO WOMPI ===', {
    'script widget.js presente en DOM': script ? script.src : false,
    'typeof window.WidgetCheckout': typeof window.WidgetCheckout,
    'typeof window.WompiCheckout': typeof window.WompiCheckout,
    'typeof window.WompiButton': typeof window.WompiButton,
    'globals relacionados': Object.keys(window).filter((k) => /wompi|checkout/i.test(k))
  });
}

export default function CheckoutPage() {
  const cart = useCart();
  const auth = useAuth();
  const ui = useUI();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    cart.hydrate();
  }, []);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [quote, setQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [previousCheckout, setPreviousCheckout] = useState(null);
  const [recoveringCheckout, setRecoveringCheckout] = useState(false);
  const submittingRef = useRef(false);
  const watcherRef = useRef(null);

  useEffect(() => () => watcherRef.current?.(), []);

  const stopWatchingWidget = () => {
    watcherRef.current?.();
    watcherRef.current = null;
  };

  // Rescate de intentos anteriores: en una instalación antigua el carrito pudo
  // quedar CONVERTED al abrir Wompi. Antes de tocar nada preguntamos a la API
  // qué pasó con ese
  // pago: si sigue en vuelo no se descarta (el cliente puede estar en el
  // banco con un PSE abierto), si falló le devolvemos los artículos.
  const rescueRef = useRef(false);
  useEffect(() => {
    if (rescueRef.current) return;
    if (!cart.hydrated || cart.items.length > 0) return;
    const pending = readPendingPayment();
    if (!pending?.orderId) return;

    rescueRef.current = true;
    (async () => {
      let status = 'PENDING';
      try {
        const r = await paymentApi.verify('wompi', pending.orderNumber);
        status = String(r?.status || 'PENDING').toUpperCase();
      } catch {
        status = 'UNKNOWN';
      }
      wlog('rescate: estado del pago pendiente =', status);

      if (status === 'APPROVED') {
        clearPendingPayment();
        navigate(`/checkout/success/${pending.orderNumber}`, { replace: true });
        return;
      }
      if (status === 'PENDING' || status === 'UNKNOWN') {
        await cart.hydrate();
        ui.showToast('El pago anterior sigue sin confirmación. Los productos deben permanecer en tu carrito.');
        return;
      }

      try {
        await orderApi.abandon(pending.orderId);
        clearPendingPayment();
        await cart.hydrate();
        wlog('rescate: pedido liberado de vuelta al carrito');
      } catch (e) {
        werr('no se pudo rescatar el pedido pendiente', e?.message);
        navigate('/cart', { replace: true });
      }
    })();
  }, [cart.hydrated, cart.items.length]);

  // Inicial: si carrito vacío → redirect.
  useEffect(() => {
    wompiEnvReport();
    if (rescueRef.current) return;
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
        setShippingMethods([]);
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
  const [invalidSavedPostalCode, setInvalidSavedPostalCode] = useState(false);

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
    methodId: ''
  });

  const set = (k, v) => {
    if (k === 'postal_code') setInvalidSavedPostalCode(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  // Aplicar la dirección guardada a los campos de envío.
  useEffect(() => {
    if (!usingSaved || !savedAddress) return;
    const savedCode = String(savedAddress.postal_code ?? '').trim();
    setInvalidSavedPostalCode(Boolean(savedCode && !isOptionalPostalCodeValid(savedCode)));
    setForm((f) => ({
      ...f,
      recipient: savedAddress.recipient || f.recipient,
      phone: savedAddress.phone || f.phone,
      line1: savedAddress.line1 || f.line1,
      line2: savedAddress.line2 || f.line2,
      city: savedAddress.city || f.city,
      state: savedAddress.state || f.state,
      postal_code: normalizeSavedPostalCode(savedAddress.postal_code) || f.postal_code,
      instructions: savedAddress.instructions || f.instructions
    }));
  }, [usingSaved, savedAddress]);

  const discardSavedAddress = () => {
    setUsingSaved(false);
    setInvalidSavedPostalCode(false);
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
  // El método de pago NO se elige aquí: el widget de Wompi lo pide al cliente
  // dentro de su propia pasarela. Solo se exige aceptar los contratos.
  const contractsAccepted = !wompiMode || (acceptTerms && acceptPrivacy);
  const wompiReady = contractsAccepted;

  useEffect(() => {
    if (!wompiMode || !cart.hydrated || cart.items.length === 0) return undefined;
    let active = true;
    orderApi.pendingCheckout()
      .then((result) => { if (active) setPreviousCheckout(result); })
      .catch(() => {});
    return () => { active = false; };
  }, [wompiMode, cart.hydrated, cart.items.length]);

  // Recalcular quote cuando cambia método o subtotal.
  useEffect(() => {
    if (!form.methodId || cart.items.length === 0) return;
    orderApi
      .quote(cart.subtotal(), form.methodId)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [form.methodId, cart.subtotal()]);

  const infoValid = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim();
  const postalCodeValid = isOptionalPostalCodeValid(form.postal_code);
  const addrValid = form.recipient.trim() && form.phone && form.line1.trim() && form.city.trim() && form.state.trim() && postalCodeValid;
  const methodValid = !!form.methodId && shippingMethods.some((method) => String(method.id) === String(form.methodId));

  const shippingDiscount = cart.coupon?.type === 'FREE_SHIPPING' && quote ? Number(quote.cost || 0) : 0;
  const displayTotal = Math.max(0, Number(cart.subtotal() || 0) + Number(quote?.cost || 0) - Number(cart.discount || 0) - shippingDiscount);

  const showPreviousCheckout = async () => {
    const result = await orderApi.pendingCheckout();
    setPreviousCheckout(result);
    return result;
  };

  const openWompiCheckout = async (order, widget, fingerprint) => {
    if (!widget?.publicKey || !widget?.integritySignature) {
      throw new Error('Configuración de pago incompleta.');
    }
    const hostedCheckoutUrl = buildWompiWebCheckoutUrl(widget);

    savePendingPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      provider: 'wompi',
      widget,
      fingerprint
    });

    setPreviousCheckout(null);
    const useHostedCheckout = shouldPreferHostedWompiCheckout(import.meta.env.VITE_WOMPI_DESKTOP_WIDGET === 'true');
    if (useHostedCheckout) {
      window.location.assign(hostedCheckoutUrl);
      return;
    }

    try {
      await loadWompiWidget();
      if (typeof window.WidgetCheckout !== 'function') {
        throw new Error('No se pudo abrir el widget de Wompi.');
      }

      const checkout = new window.WidgetCheckout({
        publicKey: widget.publicKey,
        currency: widget.currency,
        amountInCents: widget.amountInCents,
        reference: widget.reference,
        redirectUrl: widget.redirectUrl,
        signature: { integrity: widget.integritySignature }
      });

      setPaymentPending(true);
      watcherRef.current = watchWompiWidgetClose(() => {
        watcherRef.current = null;
        setPaymentPending(false);
      });

      checkout.open((result) => {
        stopWatchingWidget();
        setPaymentPending(false);
        const tx = result?.transaction || {};
        const status = String(tx.status || '').toUpperCase();
        wlog('callback del widget →', { status });
        if (!status) {
          ui.showToast('Pago no confirmado. Tus productos permanecen en el carrito.');
          return;
        }
        navigate(`/checkout/success/${order.orderNumber}`, {
          state: { orderId: order.id, provider: 'wompi', wompiTx: tx }
        });
      });
    } catch (error) {
      stopWatchingWidget();
      setPaymentPending(false);
      werr('widget no disponible; usando Web Checkout', error.message);
      ui.showToast('El widget no pudo abrirse. Te llevamos a la pasarela completa de Wompi.');
      window.location.assign(hostedCheckoutUrl);
    }
  };

  const resumePreviousCheckout = async () => {
    if (!previousCheckout || recoveringCheckout) return;
    setRecoveringCheckout(true);
    try {
      if (previousCheckout.hasProviderReference) {
        const verification = await paymentApi.verify('wompi', previousCheckout.orderNumber);
        if (verification.confirmed || verification.status === 'APPROVED') {
          navigate(`/checkout/success/${previousCheckout.orderNumber}`, { state: { provider: 'wompi' } });
          return;
        }
        if (verification.verification === 'UNAVAILABLE') {
          ui.showToast('No se pudo comprobar el pago anterior con Wompi. Intenta nuevamente más tarde.');
          return;
        }
      }
      const result = await orderApi.resumePending(previousCheckout.orderId);
      await openWompiCheckout(
        { id: previousCheckout.orderId, orderNumber: previousCheckout.orderNumber },
        result.widget,
        readPendingPayment()?.orderId === previousCheckout.orderId ? readPendingPayment()?.fingerprint : null
      );
    } catch (err) {
      ui.showToast(err.response?.data?.error?.message || err.message || 'No se pudo recuperar el pago anterior.');
      await showPreviousCheckout().catch(() => {});
    } finally {
      setRecoveringCheckout(false);
    }
  };

  const releasePreviousCheckout = async () => {
    if (!previousCheckout || recoveringCheckout) return;
    const accepted = window.confirm('¿Quieres descartar el pedido anterior? Comprobaremos que Wompi no tenga un pago aprobado ni en proceso. Los productos seguirán en el carrito.');
    if (!accepted) return;
    setRecoveringCheckout(true);
    try {
      await orderApi.releasePending(previousCheckout.orderId);
      if (readPendingPayment()?.orderId === previousCheckout.orderId) clearPendingPayment();
      setPreviousCheckout(null);
      await cart.hydrate();
      ui.showToast('Intento anterior liberado. Comprueba tus datos y vuelve a pagar.');
      setStep(0);
    } catch (err) {
      ui.showToast(err.response?.data?.error?.message || 'No se pudo liberar el intento. Comprueba el estado del pago.');
      await showPreviousCheckout().catch(() => {});
    } finally {
      setRecoveringCheckout(false);
    }
  };

  const submitOrder = async () => {
    if (submittingRef.current) return;
    if (wompiMode && paymentPending && isWompiWidgetVisible()) {
      ui.showToast('La pasarela de Wompi todavía está abierta. Ciérrala antes de intentar nuevamente.');
      return;
    }
    if (!postalCodeValid) {
      setStep(0);
      ui.showToast('El código postal debe tener 6 dígitos, o puedes dejarlo vacío.');
      return;
    }
    submittingRef.current = true;
    stopWatchingWidget();
    setPaymentPending(false);
    setSubmitting(true);
    let createdOrderId = null;
    let paymentInitiated = false;
    try {
      const orderPayload = {
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
      };
      const fingerprint = checkoutFingerprint({
        items: cart.items,
        ...orderPayload,
        coupon: cart.coupon,
        discount: cart.discount,
        total: cart.total
      });
      let order = null;
      let savedWidget = null;

      if (wompiMode) {
        const pending = readPendingPayment();
        if (pending?.orderId && pending?.orderNumber && pending.provider === 'wompi') {
          if (pending.fingerprint === fingerprint) {
            const status = await paymentApi.verify('wompi', pending.orderNumber);
            const action = decideWompiRetry(pending, fingerprint, status?.status);
            if (action === 'APPROVED') {
              navigate(`/checkout/success/${pending.orderNumber}`, { replace: true });
              return;
            }
            if (action === 'VERIFY') {
              ui.showToast('No pudimos verificar el pago anterior. Intenta de nuevo en unos momentos.');
              return;
            }
            if (action === 'RESTART') {
              await orderApi.releasePending(pending.orderId);
              clearPendingPayment();
              await cart.hydrate();
            } else if (action === 'REUSE') {
              order = { id: pending.orderId, orderNumber: pending.orderNumber };
              const retry = await orderApi.resumePending(pending.orderId);
              savedWidget = retry.widget;
            }
          } else {
            const previous = await paymentApi.verify('wompi', pending.orderNumber);
            if (previous.confirmed || previous.status === 'APPROVED') {
              navigate(`/checkout/success/${pending.orderNumber}`, { replace: true });
              return;
            }
            if (['DECLINED', 'FAILED', 'VOIDED'].includes(previous.status)) {
              await orderApi.releasePending(pending.orderId);
              clearPendingPayment();
              await cart.hydrate();
            } else {
              await showPreviousCheckout();
              ui.showToast('Encontramos un intento anterior. Puedes reanudarlo o comprobar si es posible descartarlo.');
              return;
            }
          }
        }
      }

      if (!order) {
        order = await orderApi.create(orderPayload);
        createdOrderId = order.id;
      }

      if (wompiMode) {
        const pay = savedWidget ? null : await paymentApi.create(order.id);
        const widget = savedWidget || pay?.widget;
        paymentInitiated = true;
        await openWompiCheckout(order, widget, fingerprint);
        return;
      }
      // Pago manual sin pedido visible en la cuenta hasta su aprobación.
      // El pedido queda PENDING_PAYMENT y el cliente sube
      // la captura del comprobante (Nequi / Bancolombia) en la página de éxito.
      ui.showToast('Solicitud de pago creada. El carrito se conserva hasta aprobarse el pago.');
      await cart.hydrate();
      navigate(`/checkout/success/${order.orderNumber}`, {
        state: { orderId: order.id, provider: 'manual' }
      });
    } catch (err) {
      // Si el pedido se creó pero el pago falló, lo abandonamos para que el
      // carrito del cliente vuelva a tener sus artículos y pueda reintentar.
      if (createdOrderId && !paymentInitiated) {
        try {
          await orderApi.releasePending(createdOrderId);
          if (readPendingPayment()?.orderId === createdOrderId) clearPendingPayment();
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

      if (paymentInitiated) await showPreviousCheckout().catch(() => {});
      const e = err.response?.data?.error || {};
      if (e.code === 'CHECKOUT_PENDING_ORDER') {
        await showPreviousCheckout().catch(() => {});
        setStep(2);
        ui.showToast('Encontramos un pedido anterior. Revisa las opciones para continuar de forma segura.');
        return;
      }
      const details = Array.isArray(e.details) ? e.details : [];
      const list = details
        .map((d) => `${(d.path || d.field || []).join('.')}: ${d.message}`)
        .join(' · ');
      ui.showToast(list || e.message || err.message || 'Error al crear el pedido');
      if (err.response?.data?.error?.code === 'INSUFFICIENT_STOCK') {
        await cart.hydrate();
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="container checkout-container">
      <h1 className="page-title" style={{ marginBottom: 8 }}>
        Finalizar compra
      </h1>
      <CheckoutSteps current={step} steps={STEPS} />

      {wompiMode && previousCheckout && (
        <section className="checkout-recovery" role="region" aria-label="Intento de pago anterior">
          <div className="checkout-recovery-info">
            <strong>Hay una compra anterior sin confirmar</strong>
            <p>
              Referencia <b>{previousCheckout.orderNumber}</b> · Importe <b>{money(previousCheckout.amount)}</b>.
              El pedido anterior puede tener productos o datos de envío diferentes de los que ves ahora.
            </p>
            {previousCheckout.items?.length > 0 && (
              <p className="checkout-recovery-items">
                {previousCheckout.items.map((item) => `${item.quantity} × ${item.name}`).join(' · ')}
              </p>
            )}
            <p>{previousCheckout.hasProviderReference
              ? 'No hemos marcado este pedido como pagado. Comprueba su estado o recupera el pago anterior.'
              : 'El intento quedó registrado antes de abrir Wompi. Puedes reabrirlo o liberarlo tras verificar que no haya un cobro.'}</p>
          </div>
          <div className="checkout-recovery-actions">
            <button type="button" className="btn lime" disabled={recoveringCheckout} onClick={resumePreviousCheckout}>
              {recoveringCheckout ? 'Comprobando…' : 'Reabrir pago anterior'}
            </button>
            <button type="button" className="btn outline" disabled={recoveringCheckout} onClick={releasePreviousCheckout}>
              Descartar intento anterior
            </button>
            {previousCheckout.hasProviderReference && (
              <button type="button" className="text-link checkout-recovery-link" onClick={() => navigate(`/checkout/success/${previousCheckout.orderNumber}`, { state: { provider: 'wompi' } })}>
                Comprobar estado del pago
              </button>
            )}
          </div>
        </section>
      )}

      <div className="checkout-layout">
        {/* ── Stepper content ── */}
        <div className="checkout-main">
          {step === 0 && (
            <div className="checkout-step">
              <div className="checkout-step-copy">
                <h2>Datos de contacto y envío</h2>
                <p>Completa tus datos en una sola vista para hacer el proceso más rápido y claro.</p>
              </div>

              <div className="checkout-card">
                <div className="checkout-card-head">
                  <div>
                    <h3>Información del cliente</h3>
                    <p>Usaremos estos datos para enviarte la confirmación y contactarte si es necesario.</p>
                  </div>
                </div>
                <div className="checkout-grid">
                  <Field label="Nombre" value={form.firstName} onChange={(v) => set('firstName', v)} placeholder="Tu nombre" autoComplete="given-name" required />
                  <Field label="Apellido" value={form.lastName} onChange={(v) => set('lastName', v)} placeholder="Tu apellido" autoComplete="family-name" required />
                  <Field label="Correo" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="correo@ejemplo.com" autoComplete="email" required />
                  <Field label="Teléfono" value={form.phone} onChange={(v) => set('phone', v)} placeholder="Tu teléfono" autoComplete="tel" inputMode="tel" required />
                </div>
              </div>

              <div className="checkout-card">
                <div className="checkout-card-head">
                  <div>
                    <h3>Dirección de envío</h3>
                    <p>Indica dónde quieres recibir tu pedido.</p>
                  </div>
                </div>

                {usingSaved && savedAddress && (
                  <div className="checkout-banner">
                    <span>Usamos tu última dirección guardada.</span>
                    <button
                      type="button"
                      className="text-link checkout-banner-action"
                      onClick={discardSavedAddress}
                    >
                      Usar otra
                    </button>
                  </div>
                )}

                <div className="checkout-grid">
                  <Field label="Destinatario" value={form.recipient} onChange={(v) => set('recipient', v)} placeholder="Nombre de quien recibe" autoComplete="shipping name" required />
                  <Field label="Teléfono de entrega" value={form.phone} onChange={(v) => set('phone', v)} placeholder="Número de contacto" autoComplete="shipping tel" inputMode="tel" required />
                  <Field label="Dirección" value={form.line1} onChange={(v) => set('line1', v)} placeholder="Calle, carrera, número" autoComplete="shipping address-line1" required className="field-span-2" />
                  <Field label="Apartamento o complemento (opcional)" value={form.line2} onChange={(v) => set('line2', v)} placeholder="Apto, casa, torre, interior" autoComplete="shipping address-line2" className="field-span-2" />
                  <Field label="Ciudad" value={form.city} onChange={(v) => set('city', v)} placeholder="Ciudad" autoComplete="shipping address-level2" required />
                  <Field label="Departamento" value={form.state} onChange={(v) => set('state', v)} placeholder="Departamento" autoComplete="shipping address-level1" required />
                  <Field
                    label="Código postal (opcional)"
                    value={form.postal_code}
                    onChange={(v) => set('postal_code', v)}
                    inputMode="numeric"
                    placeholder="Ej. 050001"
                    autoComplete="shipping postal-code"
                    hint="Si lo escribes, debe tener 6 dígitos."
                    error={!postalCodeValid ? 'Escribe los 6 dígitos del código postal de Colombia o deja el campo vacío.' : ''}
                  />
                </div>
                {invalidSavedPostalCode && (
                  <p role="status" className="checkout-note">
                    La dirección guardada tenía un código postal inválido. Lo dejamos vacío porque es opcional.
                  </p>
                )}
                <label className="checkout-field field-span-2">
                  <span>Instrucciones de entrega</span>
                  <textarea
                    className="field checkout-textarea"
                    placeholder="Ej. Portería, torre, horario preferido o indicaciones adicionales (opcional)"
                    value={form.instructions}
                    onChange={(e) => set('instructions', e.target.value)}
                    rows={4}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="checkout-step">
              <div className="checkout-step-copy">
                <h2>Selecciona tu método de envío</h2>
                <p>Elige la opción que más te convenga para recibir tu pedido.</p>
              </div>
              <div className="checkout-card checkout-methods">
                {shippingMethods.length === 0 ? (
                  <p style={{ color: 'var(--danger)' }}>No hay métodos de envío disponibles. Actualiza la página o contacta a la tienda.</p>
                ) : (
                  shippingMethods.map((m) => (
                    <label key={m.id} className="ship-option">
                      <input
                        type="radio"
                        name="method"
                        value={m.id}
                        checked={String(form.methodId) === String(m.id)}
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
            </div>
          )}

          {step === 2 && (
            <div className="checkout-step">
              <h2>Confirmar pedido</h2>
              {wompiMode ? (
                <>
                  <p style={{ color: 'var(--mid)', fontSize: 13, marginBottom: 14 }}>
                    Irás a la página segura de Wompi a pantalla completa para evitar bloqueos de carga.
                    Allí eliges cómo pagar
                    (tarjeta, PSE, Nequi o Bancolombia).
                  </p>
                  {paymentConfig?.sandbox && (
                    <p
                      style={{
                        background: 'var(--lime-light)',
                        color: 'var(--teal-dark)',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600
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
            {step < 2 ? (
              <button
                className="btn"
                disabled={
                  (step === 0 && !(infoValid && addrValid)) ||
                  (step === 1 && !methodValid)
                }
                onClick={() => setStep(step + 1)}
              >
                Continuar →
              </button>
            ) : (
              <button
                className="btn lime block"
                disabled={submitting || recoveringCheckout || Boolean(wompiMode && previousCheckout) || (wompiMode && !wompiReady)}
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
            {(cart.discount > 0 || shippingDiscount > 0) && (
              <div className="cs-row">
                <span>Descuento</span>
                <span style={{ color: 'var(--teal)' }}>−{money(Number(cart.discount || 0) + shippingDiscount)}</span>
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
                {money(displayTotal)}
              </strong>
            </div>
          </div>
          {paymentPending && wompiMode ? (
            <button
              type="button"
              className="text-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => navigate('/cart')}
            >
              ← Volver al carrito (pago sin confirmar)
            </button>
          ) : (
            <Link to="/cart" className="text-link">
              ← Volver al carrito
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder = '',
  autoComplete,
  hint = '',
  error = '',
  required = false,
  className = ''
}) {
  return (
    <label className={`checkout-field ${className}`.trim()}>
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      <input
        className={`field ${error ? 'field-error' : ''}`.trim()}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && !error ? <small className="checkout-hint">{hint}</small> : null}
      {error ? <small role="alert" className="checkout-error">{error}</small> : null}
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