import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWompiWebCheckoutUrl, shouldUseWompiWebCheckout, shouldPreferHostedWompiCheckout } from '../src/utils/wompiWebCheckout.js';

const widget = {
  publicKey: 'pub_test_1234',
  currency: 'COP',
  amountInCents: 22200000,
  reference: 'FEN-2026-504390',
  integritySignature: 'a'.repeat(64),
  redirectUrl: 'https://fenmi.example/checkout/success/FEN-2026-504390'
};

test('construye URL documentada de Web Checkout con la firma y el regreso', () => {
  const url = new URL(buildWompiWebCheckoutUrl(widget));
  assert.equal(url.origin, 'https://checkout.wompi.co');
  assert.equal(url.pathname, '/p/');
  assert.equal(url.searchParams.get('public-key'), widget.publicKey);
  assert.equal(url.searchParams.get('currency'), 'COP');
  assert.equal(url.searchParams.get('amount-in-cents'), '22200000');
  assert.equal(url.searchParams.get('reference'), widget.reference);
  assert.equal(url.searchParams.get('signature:integrity'), widget.integritySignature);
  assert.equal(url.searchParams.get('redirect-url'), widget.redirectUrl);
  assert.equal(url.searchParams.has('private-key'), false);
});

test('codifica correctamente referencias y parámetros reservados', () => {
  const url = new URL(buildWompiWebCheckoutUrl({ ...widget, reference: 'FEN 23/10 #2', redirectUrl: 'https://fenmi.example/checkout/success/test?source=mobile&next=1' }));
  assert.equal(url.searchParams.get('reference'), 'FEN 23/10 #2');
  assert.equal(url.searchParams.get('redirect-url'), 'https://fenmi.example/checkout/success/test?source=mobile&next=1');
});

test('permite omitir la URL de retorno', () => {
  const url = new URL(buildWompiWebCheckoutUrl({ ...widget, redirectUrl: null }));
  assert.equal(url.searchParams.has('redirect-url'), false);
});

test('rechaza importes inválidos o firmas ausentes', () => {
  for (const bad of [{ amountInCents: 0 }, { amountInCents: 10.5 }, { currency: 'USD' }, { publicKey: '' }, { integritySignature: 'abc' }, { redirectUrl: 'javascript:alert(1)' }, { redirectUrl: 'https://fenmi.netlify.app/,http://localhost:5173/,https://fenmi-ecommerce.vercel.app/checkout/success/FEN-1' }]) {
    assert.throws(() => buildWompiWebCheckoutUrl({ ...widget, ...bad }), Error);
  }
});

test('elige Web Checkout en teléfonos y pantallas compactas', () => {
  const phone = { navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }, matchMedia: () => ({ matches: false }) };
  const small = { navigator: { userAgent: 'Desktop' }, matchMedia: () => ({ matches: true }) };
  const large = { navigator: { userAgent: 'Desktop' }, matchMedia: () => ({ matches: false }) };
  assert.equal(shouldUseWompiWebCheckout(phone), true);
  assert.equal(shouldUseWompiWebCheckout(small), true);
  assert.equal(shouldUseWompiWebCheckout(large), false);
  assert.equal(shouldUseWompiWebCheckout(null), false);
});

test('sin matchMedia usa innerWidth como respaldo', () => {
  assert.equal(shouldUseWompiWebCheckout({ innerWidth: 390, navigator: { userAgent: '' } }), true);
  assert.equal(shouldUseWompiWebCheckout({ innerWidth: 1400, navigator: { userAgent: '' } }), false);
});

test('por defecto el checkout alojado también se abre en escritorio; el widget es opt-in', () => {
  const desktop = { navigator: { userAgent: 'Desktop' }, matchMedia: () => ({ matches: false }) };
  const phone = { navigator: { userAgent: 'Mobile' }, matchMedia: () => ({ matches: true }) };
  assert.equal(shouldPreferHostedWompiCheckout(false, desktop), true);
  assert.equal(shouldPreferHostedWompiCheckout(true, desktop), false);
  assert.equal(shouldPreferHostedWompiCheckout(true, phone), true);
});
