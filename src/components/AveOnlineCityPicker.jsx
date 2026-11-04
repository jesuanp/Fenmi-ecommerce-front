import React, { useEffect, useState } from 'react';
import { orderApi } from '@/services/orders';

export default function AveOnlineCityPicker({ city, state, onSelect, onEdit }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || String(city || '').trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      orderApi.shippingCities(city.trim())
        .then((rows) => { if (active) setSuggestions(Array.isArray(rows) ? rows : []); })
        .catch(() => { if (active) setSuggestions([]); })
        .finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [city, open]);

  return <div className="shipping-city-picker field-span-2">
    <label className="checkout-field">
      <span>Municipio de destino <em>*</em></span>
      <input className="field" type="text" autoComplete="off" value={city || ''} placeholder="Busca tu ciudad (ej. Medellín)" onFocus={() => setOpen(true)} onChange={(e) => { onEdit(e.target.value); setOpen(true); }} />
    </label>
    <p className="checkout-hint">Selecciona tu municipio y departamento en el catálogo de la transportadora para calcular el flete real.</p>
    {state && <p className="shipping-city-state">Departamento: <strong>{state}</strong></p>}
    {open && <div className="shipping-city-results">
      {loading ? <span>Buscando municipios…</span> : suggestions.length === 0 ? <span>Escribe al menos 2 letras para buscar tu municipio.</span> : suggestions.map((item) =>
        <button type="button" key={`${item.code}-${item.name}`} onClick={() => { onSelect(item.city, item.state); setOpen(false); setSuggestions([]); }}>
          <strong>{item.city}</strong> <span>{item.state}</span>
        </button>
      )}
    </div>}
    {open && suggestions.length > 0 && <button className="text-link shipping-city-close" type="button" onClick={() => setOpen(false)}>Cerrar lista</button>}
  </div>;
}
