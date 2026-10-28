const WEB_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

export function shouldUseWompiWebCheckout(browser = typeof window !== 'undefined' ? window : null) {
  if (!browser) return false;
  const mobileBrowser = /Android|iPhone|iPod|Mobile|Windows Phone/i.test(browser.navigator?.userAgent || '');
  let compactViewport = false;
  if (typeof browser.matchMedia === 'function') {
    compactViewport = browser.matchMedia('(max-width: 1024px)').matches;
  } else {
    const width = Number(browser.innerWidth);
    compactViewport = Number.isFinite(width) && width > 0 && width <= 1024;
  }
  return mobileBrowser || compactViewport;
}

export function shouldPreferHostedWompiCheckout(desktopWidgetEnabled = false, browser = typeof window !== 'undefined' ? window : null) {
  return !desktopWidgetEnabled || shouldUseWompiWebCheckout(browser);
}

export function buildWompiWebCheckoutUrl(widget) {
  if (!widget || typeof widget !== 'object') {
    throw new Error('No se recibieron los datos de Wompi. Vuelve a intentarlo.');
  }

  const publicKey = String(widget.publicKey || '').trim();
  const reference = String(widget.reference || '').trim();
  const currency = String(widget.currency || '').trim().toUpperCase();
  const amount = Number(widget.amountInCents);
  const signature = String(widget.integritySignature || '').trim();

  if (!publicKey || !reference || currency !== 'COP' || !Number.isSafeInteger(amount) || amount <= 0 || !/^[a-f0-9]{64}$/i.test(signature)) {
    throw new Error('La configuración del pago de Wompi está incompleta o es inválida.');
  }

  const checkoutUrl = new URL(WEB_CHECKOUT_URL);
  const params = checkoutUrl.searchParams;
  params.set('public-key', publicKey);
  params.set('currency', currency);
  params.set('amount-in-cents', String(amount));
  params.set('reference', reference);
  params.set('signature:integrity', signature);

  if (widget.redirectUrl) {
    const redirectValue = String(widget.redirectUrl).trim();
    if (!redirectValue || /[,\s]/.test(redirectValue)) {
      throw new Error('La dirección de regreso después del pago es inválida. Revisa FRONTEND_URL en el servidor.');
    }
    let returnUrl;
    try {
      returnUrl = new URL(redirectValue);
    } catch {
      throw new Error('La dirección de regreso después del pago es inválida.');
    }
    if (!['https:', 'http:'].includes(returnUrl.protocol) || returnUrl.username || returnUrl.password) {
      throw new Error('La dirección de regreso después del pago es inválida.');
    }
    params.set('redirect-url', returnUrl.toString());
  }

  return checkoutUrl.toString();
}
