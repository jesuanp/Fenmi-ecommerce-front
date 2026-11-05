import React, { useEffect, useMemo, useState } from 'react';
import { orderApi } from '@/services/orders';
import AveOnlineCityPicker from '@/components/AveOnlineCityPicker';
import { mergeOfficesForSelect } from '@/utils/officeSelection';

const OFFICIAL = Object.freeze({
  ENVIA: { title: 'envía', url: 'https://envia.co/puntos-de-atencion' },
  INTERRAPIDISIMO: { title: 'Inter Rapidísimo', url: 'https://www3.interrapidisimo.com/SitioOficinaMasCercana/' }
});

export default function ShippingLocationPicker({ locations = [], option, selectedId, onSelect }) {
  const isMeeting = option?.mode === 'MEETING';
  const carrier = option?.carrier;
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [term, setTerm] = useState('');
  const [directory, setDirectory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCity(''); setState(''); setDirectory([]); setTerm(''); setError('');
  }, [carrier, option?.mode]);

  useEffect(() => {
    if (isMeeting || !carrier || !city || !state) {
      setDirectory([]); setBusy(false);
      return undefined;
    }
    let active = true;
    setBusy(true); setError(''); setDirectory([]);
    orderApi.shippingOffices(carrier, city, state)
      .then((points) => { if (active) setDirectory(Array.isArray(points) ? points : []); })
      .catch((err) => { if (active) { setDirectory([]); setError(err.response?.data?.error?.message || 'No se pudo consultar el directorio. Puedes revisar la web de la transportadora.'); } })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [isMeeting, carrier, city, state]);

  const points = useMemo(() => mergeOfficesForSelect({
    approved: locations, directory, carrier, city, state, term, mode: isMeeting ? 'MEETING' : 'OFFICE'
  }), [locations, directory, carrier, city, state, term, isMeeting]);
  const selectedPoint = points.find((point) => point.id === selectedId) || null;
  const authorized = points.filter((point) => point.readyForCheckout === true);
  const browsing = points.filter((point) => point.readyForCheckout !== true);
  const usePoint = (id) => onSelect(id);

  return <section className="shipping-location-picker" aria-label={isMeeting ? 'Puntos de encuentro FENMI' : 'Sucursales para retirar el pedido'}>
    <h3>{isMeeting ? 'Elige el punto donde pagarás y recibirás tu pedido' : 'Elige la sucursal donde prefieres recoger tu pedido'}</h3>
    <p className="shipping-muted">{isMeeting
      ? 'Estos puntos son publicados por FENMI. Pagarás al vendedor únicamente cuando recibas el producto.'
      : 'Busca tu municipio. La lista se llena con oficinas del directorio logístico de la transportadora; solo las confirmadas por FENMI permiten pagar el pedido.'}</p>

    {!isMeeting && <AveOnlineCityPicker
      city={city} state={state}
      onEdit={(next) => { setCity(next); setState(''); setDirectory([]); onSelect(''); }}
      onSelect={(nextCity, nextState) => { setCity(nextCity); setState(nextState); setDirectory([]); onSelect(''); }}
    />}

    <label className="checkout-field"><span>Filtrar por nombre o dirección</span>
      <input className="field" value={term} onChange={(event) => setTerm(event.target.value)} placeholder={isMeeting ? 'Buscar punto de encuentro…' : 'Buscar sucursal, barrio o dirección…'} />
    </label>
    <label className="checkout-field"><span>{isMeeting ? 'Punto de encuentro' : 'Lista de oficinas'}</span>
      <select className="field shipping-office-select" value={points.some((point) => point.id === selectedId) ? selectedId : ''}
        onChange={(event) => usePoint(event.target.value)} aria-label={isMeeting ? 'Elegir punto de encuentro' : 'Elegir oficina de retiro'}>
        <option value="">{busy ? 'Consultando sucursales…' : isMeeting ? 'Selecciona un punto de encuentro' : !city || !state ? 'Primero busca y selecciona un municipio' : 'Selecciona una oficina por nombre y dirección'}</option>
        {authorized.length > 0 && <optgroup label="Oficinas habilitadas por FENMI">
          {authorized.map((point) => <option key={point.id} value={point.id}>{point.name} — {point.address} ({point.city})</option>)}
        </optgroup>}
        {browsing.length > 0 && <optgroup label={isMeeting ? 'Puntos pendientes' : 'Directorio de oficinas — pendientes de habilitación por FENMI'}>
          {browsing.map((point) => <option key={point.id} value={point.id}>{point.name} — {point.address} ({point.city})</option>)}
        </optgroup>}
      </select>
    </label>

    {busy && <p className="shipping-muted" role="status">Consultando oficinas de {OFFICIAL[carrier]?.title || 'la transportadora'}…</p>}
    {error && <p className="shipping-quote-error" role="status">{error}</p>}
    {!busy && !points.length && <p className="shipping-muted" role="status">{isMeeting
      ? 'FENMI aún no ha registrado puntos de encuentro. Deben habilitarse desde el administrador.'
      : !city || !state ? 'Selecciona un municipio para cargar sus oficinas.' : 'No aparecen oficinas en ese municipio o con ese filtro. Consulta el localizador oficial.'}</p>}
    {selectedPoint && <div className="shipping-office-selected" role="status">
      <strong>{selectedPoint.name}</strong>
      <span>{selectedPoint.address} · {selectedPoint.city}, {selectedPoint.state}</span>
      {selectedPoint.readyForCheckout !== true && <small className="shipping-location-warning">Oficina localizada, pero FENMI todavía debe confirmar que admite el retiro y validar el costo del envío. No es posible pagar por este punto aún.</small>}
    </div>}
    {!isMeeting && <div className="shipping-official">
      <a href={OFFICIAL.ENVIA.url} target="_blank" rel="noopener noreferrer">Ver sucursales en el sitio oficial de envía ↗</a>
      <a href={OFFICIAL.INTERRAPIDISIMO.url} target="_blank" rel="noopener noreferrer">Ver sucursales en el sitio oficial de Inter Rapidísimo ↗</a>
      <small>Los enlaces abren cada plataforma directamente, en otra pestaña. FENMI no incrusta mapas.</small>
    </div>}
  </section>;
}
