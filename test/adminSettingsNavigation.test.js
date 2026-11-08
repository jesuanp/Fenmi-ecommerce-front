import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_SETTINGS_SECTIONS, getAdminSettingsSection } from '../src/data/adminSettings.js';
import { buildAdminSettingsUpdate, hasAdminSettingsChanges } from '../src/utils/adminSettingsPayload.js';

test('cada categoría de configuración tiene una ruta propia', () => {
  assert.equal(ADMIN_SETTINGS_SECTIONS.length, 9);
  assert.equal(new Set(ADMIN_SETTINGS_SECTIONS.map((section) => section.id)).size, 9);
  assert.equal(getAdminSettingsSection('envios').key, 'shipping');
  assert.equal(getAdminSettingsSection('pagos').key, 'bankAccounts');
  assert.equal(getAdminSettingsSection('portada').key, 'home');
});

test('guardar envíos no sobreescribe políticas, cuentas bancarias ni portada', () => {
  const shipping = getAdminSettingsSection('envios');
  const settings = { shipping: { colombia: { options: { envia_home: { flatCost: 18000 } } } }, policies: { privacy: 'Texto privado' }, bankAccounts: { nequi: {} } };
  assert.deepEqual(buildAdminSettingsUpdate(shipping, settings), { shipping: settings.shipping });
});

test('guardar el banner mantiene los bloques publicados actualmente', () => {
  const section = getAdminSettingsSection('portada');
  const settings = { home: { heroImage: 'nuevo-banner.png', heroImageVertical: 'nuevo-mobile.png', blocks: ['versión antigua'] } };
  const server = { home: { heroImage: 'old.png', blocks: [{ type: 'feature', title: 'Actual' }], otherProperty: true } };
  assert.deepEqual(buildAdminSettingsUpdate(section, settings, server), { home: { heroImage: 'nuevo-banner.png', heroImageVertical: 'nuevo-mobile.png', blocks: server.home.blocks, otherProperty: true } });
});

test('guardar bloques no sustituye las imágenes del hero', () => {
  const section = getAdminSettingsSection('bloques');
  const settings = { home: { heroImage: 'viejo.png', blocks: [{ title: 'Nuevo bloque' }] } };
  const server = { home: { heroImage: 'actual.png', heroImageVertical: 'movil.png', blocks: [{ title: 'Anterior' }] } };
  assert.deepEqual(buildAdminSettingsUpdate(section, settings, server), { home: { heroImage: 'actual.png', heroImageVertical: 'movil.png', blocks: settings.home.blocks } });
});

test('se distingue correctamente cuando hay cambios sin guardar', () => {
  const section = getAdminSettingsSection('general');
  const before = { storeGeneral: { name: 'FENMI', email: 'correo' } };
  assert.equal(hasAdminSettingsChanges(section, before, before), false);
  assert.equal(hasAdminSettingsChanges(section, { storeGeneral: { name: 'Nuevo nombre', email: 'correo' } }, before), true);
});

test('no se confunden cambios de banner con cambios de secciones', () => {
  const portada = getAdminSettingsSection('portada');
  const blocks = getAdminSettingsSection('bloques');
  const before = { home: { heroImage: 'banner.png', blocks: [{ title: 'Antes' }] } };
  const after = { home: { heroImage: 'banner.png', blocks: [{ title: 'Después' }] } };
  assert.equal(hasAdminSettingsChanges(portada, after, before), false);
  assert.equal(hasAdminSettingsChanges(blocks, after, before), true);
});
