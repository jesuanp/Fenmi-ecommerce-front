import React, { useState } from 'react';
import { orderApi } from '@/services/orders';
import AveOnlineCityPicker from '@/components/AveOnlineCityPicker';

export default function AveOnlineOfficeImport({ locations, onImport }) {
  const [carrier, setCarrier] = useState('ENVIA');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!city || !state) return;
    setLoading(true);
    setError('');
    setOffices([]);
    try {
      const result = await orderApi.shippingOffices(carrier, city, state);
      setOffices(Array.isArray(result) ? result : []);
      if (!result?.length) setError('La transportadora no devolvió oficinas para este municipio.');
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No fue posible consultar las oficinas. Comprueba la conexión con AveOnline.');
    } finally {
      setLoading(false);
    }
  };

  const register = (point) => {
    if (locations.some((item) => item.id === point.id)) return;
    onImport({
      id: point.id,
      type: 'OFFICE',
      carrier: point.carrier,
      name: point.name,
      address: point.address,
      city: point.city,
      state: point.state,
      lat: '', lng: '',
      active: false, verified: false,
      rateCost: null, rateCheckedAt: '', rateSourceUrl: '',
      instructions: '',
      source: 'AVEONLINE_OFFICE_DIRECTORY'
    });
  };

  return <section className="colombia-admin-office-import">
    <h4>Buscar oficinas registradas por la transportadora</h4>
    <p>El directorio de AveOnline devuelve puntos para consulta, pero no confirma la tarifa ni la disponibilidad para retiro. Al agregar una oficina queda desactivada hasta verificar que acepte pedidos para retiro y confirmar una tarifa vigente.</p>
    <div className="colombia-admin-office-query">
      <label>Transportadora
        <select value={carrier} onChange={(e) => { setCarrier(e.target.value); setOffices([]); setError(''); }}>
          <option value="ENVIA">envía</option>
          <option value="INTERRAPIDISIMO">Inter Rapidísimo</option>
        </select>
      </label>
      <AveOnlineCityPicker city={city} state={state} onEdit={(text) => { setCity(text); setState(''); setOffices([]); }} onSelect={(nextCity, nextState) => { setCity(nextCity); setState(nextState); setOffices([]); }} />
      <button className="btn outline small" disabled={!city || !state || loading} onClick={search} type="button">{loading ? 'Consultando…' : 'Buscar oficinas'}</button>
    </div>
    {error && <p role="alert" className="shipping-quote-error">{error}</p>}
    {offices.length > 0 && <div className="colombia-admin-offices-found">
      {offices.map((point) => <div key={point.id} className="colombia-admin-office-found">
        <span><strong>{point.name}</strong><small>{point.address}, {point.city}</small></span>
        <button type="button" className="btn outline small" disabled={locations.some((item) => item.id === point.id)} onClick={() => register(point)}>{locations.some((item) => item.id === point.id) ? 'Ya registrado' : 'Agregar como borrador'}</button>
      </div>)}
    </div>}
  </section>;
}
