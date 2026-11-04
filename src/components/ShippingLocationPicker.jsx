import React, { useEffect, useMemo, useRef, useState } from 'react';

const OFFICIAL = {
  ENVIA: { title: 'envía', url: 'https://envia.co/service-points' },
  INTERRAPIDISIMO: { title: 'Inter Rapidísimo', url: 'https://interrapidisimo.com/oficina-mas-cercana/' }
};

let leafletPromise;
function loadLeaflet() {
  if (window.L?.map) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('[data-fenmi-leaflet-style]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.dataset.fenmiLeafletStyle = 'true';
      document.head.appendChild(css);
    }
    const existing = document.querySelector('[data-fenmi-leaflet-script]');
    const script = existing || document.createElement('script');
    if (!existing) {
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.dataset.fenmiLeafletScript = 'true';
    }
    const timeout = window.setTimeout(() => reject(new Error('Mapa no disponible')), 12000);
    const finish = () => { window.clearTimeout(timeout); resolve(window.L); };
    const fail = () => { window.clearTimeout(timeout); reject(new Error('El mapa no pudo cargarse')); };
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', fail, { once: true });
    if (!existing) document.head.appendChild(script);
    else if (window.L?.map) finish();
  }).catch((err) => { leafletPromise = null; throw err; });
  return leafletPromise;
}

function BranchMap({ locations, selectedId, onSelect }) {
  const node = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef(null);
  const [failed, setFailed] = useState(false);
  const points = useMemo(() => locations.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)), [locations]);

  useEffect(() => {
    if (!points.length || !node.current) return undefined;
    let mounted = true;
    loadLeaflet().then((L) => {
      if (!mounted || !node.current) return;
      const map = L.map(node.current, { scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
      }).addTo(map);
      markers.current = L.layerGroup().addTo(map);
      const bounds = [];
      points.forEach((point) => {
        const marker = L.marker([point.lat, point.lng]).addTo(markers.current);
        marker.bindPopup(`<strong>${escapeMarkup(point.name)}</strong><div>${escapeMarkup(point.address)}</div>`);
        marker.on('click', () => onSelect(point.id));
        bounds.push([point.lat, point.lng]);
      });
      if (bounds.length === 1) map.setView(bounds[0], 15);
      else map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
      window.setTimeout(() => map.invalidateSize(), 150);
    }).catch(() => { if (mounted) setFailed(true); });
    return () => { mounted = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [points]);

  useEffect(() => {
    const selected = points.find((p) => p.id === selectedId);
    if (mapRef.current && selected) mapRef.current.setView([selected.lat, selected.lng], Math.max(mapRef.current.getZoom(), 13), { animate: true });
  }, [selectedId, points]);

  if (!points.length) return <p className="shipping-map-hint">Aún no hay coordenadas verificadas para mostrar puntos en este mapa.</p>;
  if (failed) return <p className="shipping-map-hint">No pudimos cargar el mapa. Puedes elegir la oficina desde la lista o abrir el localizador oficial.</p>;
  return <div ref={node} className="shipping-map" aria-label="Mapa de puntos disponibles" />;
}

function escapeMarkup(value) {
  return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export default function ShippingLocationPicker({ locations, option, selectedId, onSelect }) {
  const [term, setTerm] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);
  const carrier = option?.carrier;
  const directory = OFFICIAL[carrier];
  const filtered = useMemo(() => {
    const norm = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return locations.filter((p) => !norm || `${p.name} ${p.city} ${p.state} ${p.address}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(norm));
  }, [locations, term]);

  return <div className="shipping-location-picker">
    <h3>{option?.mode === 'MEETING' ? 'Escoge el lugar del encuentro' : 'Selecciona dónde recoger tu pedido'}</h3>
    <p className="shipping-muted">Solo puedes elegir puntos confirmados por FENMI. Consulta también la red oficial para conocer sucursales cercanas.</p>
    <label className="checkout-field"><span>Buscar por ciudad, departamento o dirección</span>
      <input className="field" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Ej. Bogotá, Medellín, dirección…" />
    </label>
    <div className="shipping-location-layout">
      <div className="shipping-location-list" role="radiogroup" aria-label="Puntos disponibles para recoger">
        {filtered.length ? filtered.map((p) => <button key={p.id} type="button" role="radio" aria-checked={selectedId === p.id} className={`shipping-location-item ${selectedId === p.id ? 'selected' : ''}`} onClick={() => onSelect(p.id)}>
          <strong>{p.name}</strong><span>{p.address}</span><small>{p.city}, {p.state}</small>
        </button>) : <div className="shipping-muted">No hay puntos habilitados que coincidan con esta búsqueda.</div>}
      </div>
      <BranchMap locations={filtered} selectedId={selectedId} onSelect={onSelect} />
    </div>
    {directory && <div className="shipping-official">
      <a href={directory.url} target="_blank" rel="noopener noreferrer">Abrir localizador oficial de {directory.title} ↗</a>
      <button type="button" className="btn outline small" onClick={() => setShowDirectory(!showDirectory)} aria-expanded={showDirectory}>{showDirectory ? 'Ocultar mapa oficial' : 'Ver mapa oficial de sucursales'}</button>
      {showDirectory && <div className="shipping-directory-frame"><iframe title={`Puntos oficiales de ${directory.title}`} src={directory.url} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /><p>Si el sitio de la transportadora no permite mostrarse aquí, abre el localizador en otra pestaña.</p></div>}
      <small>El mapa oficial es informativo. Una sucursal solo estará disponible para recibir tu pedido cuando FENMI la habilite arriba.</small>
    </div>}
  </div>;
}
