import React from 'react';
import { prepareDeliverySettings } from '@/utils/colombiaDeliverySetup';
import useColombiaDestinations, { matchCity, matchDepartment } from '@/hooks/useColombiaDestinations';

const HOME_METHODS = [
  ['envia_home', 'envía · entrega a domicilio'],
  ['inter_home', 'Inter Rapidísimo · entrega a domicilio']
];

const BLANK = { enabled: true, options: {}, locations: [] };

export default function ColombiaShippingAdmin({ value, onChange }) {
  const config = value || BLANK;
  const options = config.options || {};
  const { departments, loading: destinationsLoading, error: destinationsError, retry } = useColombiaDestinations();
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
    <p>Selecciona un departamento y, si quieres una tarifa especial, una ciudad de su lista. Una tarifa por ciudad tiene prioridad sobre la tarifa general del departamento. La tarifa de respaldo nacional es opcional.</p>
    {destinationsLoading && <p role="status">Cargando departamentos y municipios…</p>}
    {destinationsError && <p role="alert" className="shipping-quote-error">{destinationsError} <button type="button" className="btn outline small" onClick={retry}>Reintentar</button></p>}

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

            {rateMode === 'LIVE_AVEONLINE' && <p>Si la API está conectada, FENMI usa su cotización. Si falla, se utilizan las tarifas manuales que ya estén guardadas; nunca se inventa un costo.</p>}
            {rateMode === 'MANUAL' && <label>Tarifa de respaldo para Colombia (COP, opcional)
              <input type="number" min="0" max="100000000" step="1" placeholder="Ej. 18000" value={o.flatCost ?? ''} onChange={(e) => patchOption(id, { flatCost: e.target.value === '' ? null : Number(e.target.value) })} />
            </label>}
            <div className="colombia-admin-rate-rules">
              <strong>Tarifas por departamento o ciudad</strong>
              <p>Deja la ciudad en «Todo el departamento» para aplicar esa tarifa a cualquier municipio que no tenga una tarifa especial. Puedes dejar estas tarifas como respaldo cuando uses AveOnline.</p>
              {rates.map((r, i) => {
                const activeDepartment = matchDepartment(departments, r.state);
                const cities = activeDepartment?.cities || [];
                const cityValue = matchCity(departments, r.state, r.city);
                return <div className="colombia-admin-rule" key={`${id}-${i}`}>
                  <select aria-label="Departamento de tarifa" value={activeDepartment?.name || ''} disabled={destinationsLoading || !!destinationsError} onChange={(e) => patchOption(id, { rates: rates.map((item, j) => j === i ? { ...item, state: e.target.value, city: '' } : item) })}>
                    <option value="">Selecciona departamento</option>
                    {departments.map((department) => <option key={department.name} value={department.name}>{department.name}</option>)}
                  </select>
                  <select aria-label="Ciudad de tarifa" value={cityValue || ''} disabled={!activeDepartment || destinationsLoading || !!destinationsError} onChange={(e) => patchOption(id, { rates: rates.map((item, j) => j === i ? { ...item, city: e.target.value } : item) })}>
                    <option value="">Todo el departamento</option>
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                  <input aria-label="Tarifa en COP" type="number" min="0" max="100000000" step="1" value={r.cost ?? ''} placeholder="Costo COP" onChange={(e) => patchOption(id, { rates: rates.map((item, j) => j === i ? { ...item, cost: e.target.value === '' ? null : Number(e.target.value) } : item) })} />
                  <button className="btn outline small" type="button" onClick={() => patchOption(id, { rates: rates.filter((_, j) => j !== i) })}>Quitar</button>
                  {r.city && activeDepartment && !cityValue && <small role="alert">Vuelve a seleccionar la ciudad de esta tarifa.</small>}
                </div>;
              })}
              <button className="btn outline small" type="button" disabled={destinationsLoading || !!destinationsError} onClick={() => patchOption(id, { rates: [...rates, { state: '', city: '', cost: null }] })}>+ Añadir tarifa por destino</button>
            </div>
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
