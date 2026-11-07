import React from 'react';
import { prepareDeliverySettings } from '@/utils/colombiaDeliverySetup';
import { COLOMBIA_DEPARTMENTS } from '@/utils/colombiaDepartments';

const HOME_METHODS = [
  ['envia_home', 'envía · entrega a domicilio'],
  ['inter_home', 'Inter Rapidísimo · entrega a domicilio']
];

const BLANK = { enabled: true, options: {}, locations: [] };

export default function ColombiaShippingAdmin({ value, onChange }) {
  const config = value || BLANK;
  const options = config.options || {};
  const set = (patch) => onChange({ ...config, ...patch });
  const patchOption = (id, patch) => {
    const current = options[id] || {};
    set({ options: { ...options, [id]: { rateMode: 'MANUAL', flatCost: null, rates: [], ...current, ...patch, enabled: true } } });
  };

  return <div className="colombia-admin">
    <div className="colombia-admin-setup">
      <button type="button" className="btn outline" onClick={() => onChange(prepareDeliverySettings(config))}>
        Preparar entrega contra pago y domicilio
      </button>
      <p>Contra entrega queda habilitado sin Wompi. envía e Inter Rapidísimo quedan habilitados para domicilio y se cobran por Wompi con las tarifas que configures abajo.</p>
    </div>

    <section className="colombia-admin-method">
      <h4>Pago contra entrega · punto de encuentro</h4>
      <p>El cliente escribe el lugar donde quiere encontrarse con el vendedor. El costo de envío es $0 y FENMI no abre Wompi. El pago se confirma en el panel cuando el vendedor recibe el dinero y entrega el producto.</p>
    </section>

    <h4>Tarifas de envío a domicilio</h4>
    <p>Configura cada transportadora por separado. Una tarifa con ciudad tiene prioridad sobre la tarifa general del departamento. La tarifa de respaldo es opcional y solo se usa cuando no existe una regla más específica.</p>

    <div className="colombia-admin-methods">
      {HOME_METHODS.map(([id, label]) => {
        const o = options[id] || {};
        const rateMode = o.rateMode === 'LIVE_AVEONLINE' ? 'LIVE_AVEONLINE' : 'MANUAL';
        const rates = Array.isArray(o.rates) ? o.rates : [];
        return <div key={id} className="colombia-admin-method">
          <strong>{label}</strong>
          <div className="colombia-admin-rate">
            <label>Cómo calcular el envío
              <select value={rateMode} onChange={(e) => patchOption(id, { rateMode: e.target.value, flatCost: null })}>
                <option value="MANUAL">Tarifas configuradas en el panel</option>
                <option value="LIVE_AVEONLINE">Cotización por API AveOnline (opcional)</option>
              </select>
            </label>

            {rateMode === 'LIVE_AVEONLINE' ? (
              <p>Si la API está conectada, FENMI usa su cotización. Si falla, solo podrá usar reglas manuales que ya estén guardadas; nunca inventará un costo.</p>
            ) : <>
              <label>Tarifa de respaldo para Colombia (COP, opcional)
                <input type="number" min="0" step="1" placeholder="Ej. 18000" value={o.flatCost ?? ''} onChange={(e) => patchOption(id, { flatCost: e.target.value === '' ? null : Number(e.target.value) })} />
              </label>
              <div className="colombia-admin-rate-rules">
                <strong>Tarifas por departamento o ciudad</strong>
                <p>Deja Ciudad vacía para aplicar la tarifa a todo el departamento. Si agregas una ciudad, ese valor tendrá prioridad.</p>
                {rates.map((r, i) => <div className="colombia-admin-rule" key={`${id}-${i}`}>
                  <select aria-label="Departamento de tarifa" value={r.state || ''} onChange={(e) => patchOption(id, { rates: rates.map((item, j) => j === i ? { ...item, state: e.target.value } : item) })}><option value="">Departamento</option>{COLOMBIA_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}</select>
                  <input aria-label="Ciudad de tarifa" placeholder="Ciudad (opcional)" value={r.city || ''} onChange={(e) => patchOption(id, { rates: rates.map((item, j) => j === i ? { ...item, city: e.target.value } : item) })} />
                  <input aria-label="Tarifa en COP" type="number" min="0" step="1" value={r.cost ?? ''} placeholder="COP" onChange={(e) => patchOption(id, { rates: rates.map((item, j) => j === i ? { ...item, cost: e.target.value === '' ? null : Number(e.target.value) } : item) })} />
                  <button className="btn outline small" type="button" onClick={() => patchOption(id, { rates: rates.filter((_, j) => j !== i) })}>Quitar</button>
                </div>)}
                <button className="btn outline small" type="button" onClick={() => patchOption(id, { rates: [...rates, { state: '', city: '', cost: null }] })}>+ Añadir tarifa por destino</button>
              </div>
            </>}
          </div>
        </div>;
      })}
    </div>

    <section className="colombia-admin-method">
      <h4>Retiro en sucursal</h4>
      <p><strong>Próximamente.</strong> Esta opción permanece deshabilitada para el cliente.</p>
      <p><a href="https://envia.co/puntos-de-atencion" rel="noopener noreferrer" target="_blank">Ver oficinas de envía ↗</a> · <a href="https://www3.interrapidisimo.com/SitioOficinaMasCercana/" rel="noopener noreferrer" target="_blank">Ver oficinas de Inter Rapidísimo ↗</a></p>
    </section>
  </div>;
}
