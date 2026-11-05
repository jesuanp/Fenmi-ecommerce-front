// Opciones acordadas para FENMI. Se muestran siempre; no se habilita el pago
// si el backend no ha confirmado la disponibilidad real de la modalidad.
export const FENMI_DELIVERY_OPTIONS = Object.freeze([
  { id: 'meeting_cash', name: 'Encuentro con el vendedor · pago al recibir', mode: 'MEETING', carrier: null, description: 'Pago presencial en un punto acordado.' },
  { id: 'envia_home', name: 'envía · entrega a domicilio', mode: 'HOME', carrier: 'ENVIA', description: 'Envío por envía a la dirección seleccionada.' },
  { id: 'envia_office', name: 'envía · recoger en punto autorizado', mode: 'OFFICE', carrier: 'ENVIA', description: 'Recogida en una oficina autorizada.' },
  { id: 'inter_home', name: 'Inter Rapidísimo · entrega a domicilio', mode: 'HOME', carrier: 'INTERRAPIDISIMO', description: 'Envío por Inter Rapidísimo a domicilio.' },
  { id: 'inter_office', name: 'Inter Rapidísimo · recoger en oficina', mode: 'OFFICE', carrier: 'INTERRAPIDISIMO', description: 'Recogida en una oficina autorizada.' }
]);

// La elección del cliente es independiente de que la cotización y el despacho
// estén listos. El servidor sigue validando la disponibilidad antes de crear el pedido.
export const FENMI_DELIVERY_GROUPS = Object.freeze([
  { id: 'meeting', name: 'Pago contra entrega', description: 'Recoge el producto en un punto de encuentro y paga cuando lo recibas.', methodId: 'meeting_cash' },
  { id: 'envia', name: 'envía', description: 'Escoge entrega en casa o recogida en sucursal.' },
  { id: 'inter', name: 'Inter Rapidísimo', description: 'Escoge entrega en casa o recogida en sucursal.' }
]);

export function selectedDeliveryGroup(methodId) {
  if (methodId === 'meeting_cash') return 'meeting';
  if (methodId === 'envia_home' || methodId === 'envia_office') return 'envia';
  if (methodId === 'inter_home' || methodId === 'inter_office') return 'inter';
  return '';
}

export function deliveryMethodFor(group, preference = 'HOME') {
  if (group === 'meeting') return 'meeting_cash';
  if (!['envia', 'inter'].includes(group)) return '';
  return `${group}_${preference === 'OFFICE' ? 'office' : 'home'}`;
}

export function changeDeliveryGroup(group, currentMethodId = '') {
  if (group === 'meeting') return 'meeting_cash';
  if (!['envia', 'inter'].includes(group)) return '';
  const currentIsOffice = currentMethodId.endsWith('_office');
  return deliveryMethodFor(group, currentIsOffice ? 'OFFICE' : 'HOME');
}

export function deliveryMethodsForCheckout(colombia) {
  const liveMethods = Array.isArray(colombia?.options) ? colombia.options : [];
  const valid = new Map(liveMethods.filter((m) => m && FENMI_DELIVERY_OPTIONS.some((base) => base.id === m.id)).map((m) => [m.id, m]));
  return FENMI_DELIVERY_OPTIONS.map((base) => {
    const official = valid.get(base.id);
    const available = colombia?.enabled === true && official?.available === true;
    return {
      ...base,
      ...(official || {}),
      id: base.id, // nunca aceptar IDs arbitrarios del servidor
      mode: base.mode,
      carrier: base.carrier,
      available,
      unavailableReason: available ? null : official?.unavailableReason || 'FENMI todavía debe habilitar y verificar esta modalidad en el servidor.'
    };
  });
}

// Prepara las cinco opciones sin inventar precios o sucursales. La API del
// servidor sigue decidiendo si la modalidad se puede seleccionar/cobrar.
export function prepareDeliverySettings(previous = {}) {
  const base = previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : {};
  const current = base.options && typeof base.options === 'object' && !Array.isArray(base.options) ? base.options : {};
  const next = { ...current };
  for (const method of FENMI_DELIVERY_OPTIONS) {
    const existing = current[method.id] || {};
    next[method.id] = {
      ...existing,
      enabled: true,
      ...(method.mode === 'HOME' ? { rateMode: 'LIVE_AVEONLINE' } : method.mode === 'OFFICE' ? { rateMode: 'OFFICE_VERIFIED' } : { rateMode: 'MANUAL' })
    };
  }
  return { ...base, enabled: true, options: next, locations: Array.isArray(base.locations) ? base.locations : [] };
}
