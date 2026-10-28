import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWompiWidget } from '../src/utils/loadWompi.js';

test('si el widget no responde finaliza con error en vez de esperar indefinidamente', async () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const script = {
    listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    removeEventListener(type) { delete this.listeners[type]; },
    remove() { this.removed = true; }
  };
  globalThis.window = {};
  globalThis.document = {
    querySelector() { return null; },
    createElement() { return script; },
    head: { appendChild() {} }
  };
  try {
    await assert.rejects(loadWompiWidget(15), /tardó demasiado en cargar/);
    assert.equal(script.removed, true);
    globalThis.window.WidgetCheckout = () => {};
    await loadWompiWidget();
  } finally {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
