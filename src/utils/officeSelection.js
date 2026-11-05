// El directorio logístico informa ubicaciones; solo los puntos aprobados por
// FENMI pueden usarse para crear un pedido de recogida en sucursal.
export function normalOfficeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function mergeOfficesForSelect({ approved = [], directory = [], carrier, city = '', state = '', term = '', mode = 'OFFICE' } = {}) {
  const clean = (row) => row && row.id && row.name && row.address && row.city && row.state;
  const sameCity = (row) => (!city || normalOfficeText(row.city) === normalOfficeText(city)) && (!state || normalOfficeText(row.state) === normalOfficeText(state));
  const approvedList = (Array.isArray(approved) ? approved : []).filter((row) => clean(row) && row.type === mode && (mode === 'MEETING' || row.carrier === carrier) && sameCity(row));
  const result = new Map(approvedList.map((row) => [row.id, { ...row, fromDirectory: false }]));
  if (mode === 'OFFICE') {
    for (const row of Array.isArray(directory) ? directory : []) {
      if (!clean(row) || row.carrier !== carrier || !sameCity(row)) continue;
      const matchesApproved = approvedList.find((point) => point.id === row.id ||
        (normalOfficeText(point.name) === normalOfficeText(row.name) && normalOfficeText(point.address) === normalOfficeText(row.address)));
      if (matchesApproved) continue;
      result.set(row.id, { ...row, type: 'OFFICE', readyForCheckout: false, fromDirectory: true });
    }
  }
  const needle = normalOfficeText(term);
  return [...result.values()]
    .filter((row) => !needle || normalOfficeText(`${row.name} ${row.address} ${row.city} ${row.state}`).includes(needle))
    .sort((a, b) => Number(b.readyForCheckout === true) - Number(a.readyForCheckout === true) ||
      `${a.city} ${a.name} ${a.address}`.localeCompare(`${b.city} ${b.name} ${b.address}`, 'es'));
}
