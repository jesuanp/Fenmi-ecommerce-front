import React from 'react';
import AveOnlineOfficeImport from '@/components/AveOnlineOfficeImport';

const METHODS = [
  ['meeting_cash', 'Encuentro con vendedor · pago presencial'],
  ['envia_home', 'envía · a domicilio'],
  ['envia_office', 'envía · recoger en sucursal'],
  ['inter_home', 'Inter Rapidísimo · a domicilio'],
  ['inter_office', 'Inter Rapidísimo · recoger en sucursal']
];

const BLANK = { enabled: false, options: {}, locations: [] };

export default function ColombiaShippingAdmin({ value, onChange }) {
  const config = value || BLANK;
  const options = config.options || {};
  const locations = config.locations || [];
  const set = (patch) => onChange({ ...config, ...patch });
  const patchOption = (id, patch) => set({ options: { ...options, [id]: { ...(options[id] || {}), ...patch } } });
  const updateLocation = (id, patch) => set({ locations: locations.map((p) => p.id === id ? { ...p, ...patch, verified: false } : p) });
  const setVerified = (id, value) => set({ locations: locations.map((p) => p.id === id ? { ...p, verified: value } : p) });
  const addLocation = () => set({ locations: [...locations, { id: `point-${Date.now()}-${Math.floor(Math.random() * 10000)}`, type: 'OFFICE', carrier: 'ENVIA', name: '', address: '', city: '', state: '', lat: '', lng: '', active: false, verified: false, instructions: '' }] });

  return <div className="colombia-admin">
    <label className="colombia-admin-switch"><input type="checkbox" checked={config.enabled === true} onChange={(e) => set({ enabled: e.target.checked })} /> Activar métodos de entrega de Colombia</label>
    <p>Las cotizaciones automáticas reales se obtienen de AveOnline con origen Barranquilla, según las transportadoras activadas en tu cuenta. Para las sucursales, la API de cotización no documenta un precio individual por oficina: usa únicamente importes comprobados con la agencia.</p>
    <div className="colombia-admin-methods">
      {METHODS.map(([id, label]) => {
        const o = options[id] || {};
        const isMeeting = id === 'meeting_cash';
        const isOffice = id.endsWith('_office');
        return <div key={id} className="colombia-admin-method">
          <label><input type="checkbox" checked={o.enabled === true} onChange={(e) => patchOption(id, { enabled: e.target.checked })} /> <strong>{label}</strong></label>
          {!isMeeting && <div className="colombia-admin-rate">
            <label>Origen de la tarifa
              <select value={o.rateMode || 'MANUAL'} onChange={(e) => patchOption(id, { rateMode: e.target.value, flatCost: null })}>
                <option value="MANUAL">Tarifas confirmadas por FENMI (manual)</option>
                {isOffice ? <option value="OFFICE_VERIFIED">Tarifa verificada por sucursal (vigencia 7 días)</option> : <option value="LIVE_AVEONLINE">Cotización real por API AveOnline (Barranquilla)</option>}
              </select>
            </label>
            {o.rateMode === 'LIVE_AVEONLINE' && <p>Consulta la tarifa del transportador seleccionado por destino y medidas reales del paquete. Se necesitan AVEONLINE_USER, AVEONLINE_PASSWORD y AVEONLINE_IDEMPRESA en el VPS; nunca en Vercel.</p>}
            {o.rateMode === 'OFFICE_VERIFIED' && <p>Cada sucursal requiere su tarifa, fecha de verificación y enlace oficial de respaldo. Una tarifa vencida no se puede cobrar.</p>}
            {!['LIVE_AVEONLINE', 'OFFICE_VERIFIED'].includes(o.rateMode) && <><label>Tarifa plana confirmada (COP; vacío = solo tarifas por destino)
              <input type="number" min="0" step="1" placeholder="Sin tarifa asignada" value={o.flatCost ?? ''} onChange={(e) => patchOption(id, { flatCost: e.target.value === '' ? null : Number(e.target.value) })} />
            </label>
            </>}
            <label><input type="checkbox" checked={o.freeShippingEligible === true} onChange={(e) => patchOption(id, { freeShippingEligible: e.target.checked })} /> Permitir envío gratis por umbral de compra</label>
            {!['LIVE_AVEONLINE', 'OFFICE_VERIFIED'].includes(o.rateMode) && <div className="colombia-admin-rate-rules">
              <strong>Tarifas por destino</strong>
              {(o.rates || []).map((r, i) => <div className="colombia-admin-rule" key={i}>
                <input aria-label="Departamento de tarifa" placeholder="Departamento" value={r.state || ''} onChange={(e) => patchOption(id, { rates: o.rates.map((item, j) => j === i ? { ...item, state: e.target.value } : item) })} />
                <input aria-label="Ciudad de tarifa" placeholder="Ciudad (opcional)" value={r.city || ''} onChange={(e) => patchOption(id, { rates: o.rates.map((item, j) => j === i ? { ...item, city: e.target.value } : item) })} />
                <input aria-label="Tarifa en COP" type="number" min="0" value={r.cost ?? ''} placeholder="COP" onChange={(e) => patchOption(id, { rates: o.rates.map((item, j) => j === i ? { ...item, cost: e.target.value === '' ? null : Number(e.target.value) } : item) })} />
                <button className="btn outline small" type="button" onClick={() => patchOption(id, { rates: o.rates.filter((_, j) => j !== i) })}>Quitar</button>
              </div>)}
              <button className="btn outline small" type="button" onClick={() => patchOption(id, { rates: [...(o.rates || []), { state: '', city: '', cost: null }] })}>+ Tarifa por destino</button>
            </div>}
          </div>}
        </div>;
      })}
    </div>
    <section className="colombia-admin-packaging">
      <h4>Medidas reales del paquete para calcular el envío</h4>
      <p>Cuando varias prendas viajan en una sola caja, cotiza con las dimensiones de esa caja y la suma de los pesos reales. Para compras que excedan la capacidad indicada, el sistema detendrá el cobro hasta revisar el empaque.</p>
      <label>Cómo se empaca el pedido
        <select value={config.packaging?.mode || 'PER_PRODUCT'} onChange={(e) => set({ packaging: { ...(config.packaging || {}), mode: e.target.value } })}>
          <option value="PER_PRODUCT">Un paquete por producto (configuración anterior)</option>
          <option value="SINGLE_BOX">Una caja consolidada para todo el pedido</option>
        </select>
      </label>
      {config.packaging?.mode === 'SINGLE_BOX' && <div className="colombia-admin-packaging-grid">
        {[
          ['lengthCm', 'Largo de la caja (cm)'],
          ['widthCm', 'Ancho de la caja (cm)'],
          ['heightCm', 'Alto de la caja (cm)'],
          ['tareWeightKg', 'Peso de la caja vacía (kg)'],
          ['maxWeightKg', 'Peso máximo admitido (kg)']
        ].map(([key, label]) => <label key={key}>{label}
          <input type="number" step="0.001" min='0.001' value={config.packaging?.[key] ?? ''} onChange={(e) => set({ packaging: { ...(config.packaging || {}), [key]: e.target.value === '' ? null : Number(e.target.value) } })} />
        </label>)}
      </div>}
      <small>Estos datos son de embalaje, no de la prenda sin empacar. No inventes medidas para habilitar tarifas.</small>
    </section>
    <label className="colombia-admin-hours">Vigencia de una solicitud de encuentro (horas, entre 6 y 168)
      <input type="number" min="6" max="168" value={config.meetingReservationHours ?? 48} onChange={(e) => set({ meetingReservationHours: Math.min(168, Math.max(6, Number(e.target.value) || 48)) })} />
    </label>
    <AveOnlineOfficeImport locations={locations} onImport={(point) => set({ locations: [...locations, point] })} />
    <h4>Puntos habilitados para retiro o encuentro</h4>
    <p>Consulta el localizador oficial de cada empresa, confirma con ella si recibe envíos para retiro y registra sus datos. Si usas tarifas por sucursal, guarda el importe real, la fecha y la referencia de la cotización oficial. No se cobra una tarifa vencida.</p>
    <p><a href="https://envia.co/service-points" rel="noopener noreferrer" target="_blank">Mapa de envía ↗</a> · <a href="https://interrapidisimo.com/oficina-mas-cercana/" rel="noopener noreferrer" target="_blank">Mapa de Inter Rapidísimo ↗</a></p>
    {locations.map((p) => <div key={p.id} className="colombia-admin-point">
      <div className="colombia-admin-point-row">
        <label>Tipo<select value={p.type || 'OFFICE'} onChange={(e) => updateLocation(p.id, { type: e.target.value, carrier: e.target.value === 'MEETING' ? null : 'ENVIA' })}><option value="OFFICE">Sucursal de transportadora</option><option value="MEETING">Punto de encuentro con el vendedor</option></select></label>
        {p.type !== 'MEETING' && <label>Transportadora<select value={p.carrier || 'ENVIA'} onChange={(e) => updateLocation(p.id, { carrier: e.target.value })}><option value="ENVIA">envía</option><option value="INTERRAPIDISIMO">Inter Rapidísimo</option></select></label>}
        <label>Nombre<input value={p.name || ''} onChange={(e) => updateLocation(p.id, { name: e.target.value })} /></label>
        <label>Dirección<input value={p.address || ''} onChange={(e) => updateLocation(p.id, { address: e.target.value })} /></label>
        <label>Ciudad<input value={p.city || ''} onChange={(e) => updateLocation(p.id, { city: e.target.value })} /></label>
        <label>Departamento<input value={p.state || ''} onChange={(e) => updateLocation(p.id, { state: e.target.value })} /></label>
        <label>Latitud<input type="number" step="any" value={p.lat ?? ''} onChange={(e) => updateLocation(p.id, { lat: e.target.value })} /></label>
        <label>Longitud<input type="number" step="any" value={p.lng ?? ''} onChange={(e) => updateLocation(p.id, { lng: e.target.value })} /></label>
        {p.type === 'OFFICE' && <>
          <label>Tarifa oficial de esta sucursal (COP)<input type="number" min="0" step="1" value={p.rateCost ?? ''} onChange={(e) => updateLocation(p.id, { rateCost: e.target.value === '' ? null : Number(e.target.value) })} /></label>
          <label>Fecha de cotización<input type="date" value={p.rateCheckedAt || ''} onChange={(e) => updateLocation(p.id, { rateCheckedAt: e.target.value })} /></label>
          <label className="colombia-admin-span">Enlace HTTPS de la cotización o tarifa oficial<input type="url" value={p.rateSourceUrl || ''} onChange={(e) => updateLocation(p.id, { rateSourceUrl: e.target.value })} placeholder="https://..." /></label>
        </>}
        <label className="colombia-admin-span">Instrucciones<input value={p.instructions || ''} onChange={(e) => updateLocation(p.id, { instructions: e.target.value })} /></label>
      </div>
      <div className="colombia-admin-point-actions">
        <label><input type="checkbox" checked={p.active === true} onChange={(e) => updateLocation(p.id, { active: e.target.checked })} /> Activo</label>
        <label><input type="checkbox" checked={p.verified === true} onChange={(e) => setVerified(p.id, e.target.checked)} /> Verificado y autorizado para retiro/encuentro</label>
        <button type="button" className="btn outline small" onClick={() => set({ locations: locations.filter((item) => item.id !== p.id) })}>Quitar punto</button>
      </div>
    </div>)}
    <button className="btn outline small" type="button" onClick={addLocation}>+ Añadir punto de retiro o encuentro</button>
  </div>;
}
