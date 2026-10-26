import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutFingerprint, decideWompiRetry } from '../src/utils/checkoutRetry.js';
import { isWompiWidgetVisible, watchWompiWidgetClose } from '../src/utils/wompiWidget.js';

const base = {
  items: [
    { variantId: 45, quantity: 1, price: 40000 },
    { variantId: 12, quantity: 2, price: 12000 }
  ],
  customer: { firstName: 'Ana' },
  shipping: { city: 'Bogotá', postal_code: null },
  methodId: 'nacional',
  coupon: null,
  discount: 0,
  total: 64000
};

const fingerprint = checkoutFingerprint(base);
const pending = { orderId: 22, orderNumber: 'FEN-2026-001', provider: 'wompi', fingerprint };

test('el mismo carrito y dirección producen una huella estable', () => {
  const reordered = { ...base, items: [...base.items].reverse() };
  assert.equal(checkoutFingerprint(reordered), fingerprint);
});

test('no se reutiliza un pedido cuando cambia el carrito o los datos de envío', () => {
  const changed = checkoutFingerprint({ ...base, shipping: { city: 'Cali', postal_code: null } });
  const changedItems = checkoutFingerprint({ ...base, items: [{ variantId: 45, quantity: 3, price: 40000 }] });
  assert.notEqual(fingerprint, changed);
  assert.notEqual(fingerprint, changedItems);
  assert.equal(decideWompiRetry(pending, changed, 'PENDING'), 'NEW');
  assert.equal(decideWompiRetry(pending, changedItems, 'PENDING'), 'NEW');
});

test('no se reutiliza un pedido antiguo sin huella verificada', () => {
  assert.equal(decideWompiRetry({ ...pending, fingerprint: undefined }, fingerprint, 'PENDING'), 'NEW');
});

test('Wompi pendiente reutiliza pedido y pago aprobado no vuelve a abrir pasarela', () => {
  assert.equal(decideWompiRetry(pending, fingerprint, 'PENDING'), 'REUSE');
  assert.equal(decideWompiRetry(pending, fingerprint, 'APPROVED'), 'APPROVED');
});

test('un estado rechazado inicia otro pedido; uno no verificable no lo reintenta', () => {
  for (const status of ['DECLINED', 'FAILED', 'VOIDED']) {
    assert.equal(decideWompiRetry(pending, fingerprint, status), 'RESTART');
  }
  for (const status of ['UNKNOWN', undefined, '']) {
    assert.equal(decideWompiRetry(pending, fingerprint, status), 'VERIFY');
  }
});

function makeFrame(visible = true, src = 'https://checkout.wompi.co/p') {
  return {
    isConnected: true,
    getAttribute(name) { return name === 'src' ? src : null; },
    getClientRects() { return visible ? [{ width: 300 }] : []; }
  };
}

function fakeDocument(frames) {
  return { documentElement: {}, querySelectorAll() { return frames; } };
}

class FakeObserver {
  constructor(callback) { this.callback = callback; FakeObserver.current = this; }
  observe(target, options) { this.target = target; this.options = options; }
  disconnect() { this.disconnected = true; }
  flush() { if (!this.disconnected) this.callback(); }
}

test('detecta la apertura y cierre del iframe y libera el bloqueo', () => {
  const frames = [];
  const doc = fakeDocument(frames);
  let closes = 0;
  watchWompiWidgetClose(() => { closes += 1; }, doc, FakeObserver);
  frames.push(makeFrame());
  assert.equal(isWompiWidgetVisible(doc), true);
  FakeObserver.current.flush();
  frames.pop();
  FakeObserver.current.flush();
  assert.equal(closes, 1);
  assert.equal(FakeObserver.current.disconnected, true);
  FakeObserver.current.flush();
  assert.equal(closes, 1);
});

test('detecta cuando Wompi oculta el iframe sin removerlo', () => {
  const frames = [makeFrame()];
  const doc = fakeDocument(frames);
  let closes = 0;
  watchWompiWidgetClose(() => { closes += 1; }, doc, FakeObserver);
  frames[0] = makeFrame(false);
  FakeObserver.current.flush();
  assert.equal(closes, 1);
});

test('ignora iframes externos y se puede desconectar en desmontaje', () => {
  const frames = [];
  const doc = fakeDocument(frames);
  let closes = 0;
  const stop = watchWompiWidgetClose(() => { closes += 1; }, doc, FakeObserver);
  frames.push(makeFrame(true, 'https://youtube.com/embed/123'));
  FakeObserver.current.flush();
  frames.pop();
  FakeObserver.current.flush();
  assert.equal(closes, 0);
  stop();
  frames.push(makeFrame());
  FakeObserver.current.flush();
  assert.equal(closes, 0);
});
