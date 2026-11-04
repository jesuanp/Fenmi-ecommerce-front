import React, { useState } from 'react';

const DIRECTORIES = [
  { id: 'envia', name: 'envía', url: 'https://envia.co/service-points' },
  { id: 'inter', name: 'Inter Rapidísimo', url: 'https://interrapidisimo.com/oficina-mas-cercana/' }
];

export default function OfficialCarrierExplorer() {
  const [carrier, setCarrier] = useState('');
  const selected = DIRECTORIES.find((item) => item.id === carrier);
  return <section className="shipping-explorer" aria-label="Consultar redes oficiales de sucursales">
    <div><strong>Busca sucursales oficiales en Colombia</strong><p>Consulta las redes de las transportadoras. La recogida de compras de FENMI solo estará disponible en los puntos autorizados que aparezcan en el selector de arriba.</p></div>
    <div className="shipping-explorer-tabs">
      {DIRECTORIES.map((item) => <button key={item.id} type="button" className={`btn outline small ${carrier === item.id ? 'shipping-explorer-active' : ''}`} onClick={() => setCarrier(carrier === item.id ? '' : item.id)} aria-expanded={carrier === item.id}>Ver sucursales de {item.name}</button>)}
    </div>
    {selected && <div className="shipping-directory-frame">
      <a href={selected.url} target="_blank" rel="noopener noreferrer">Abrir mapa oficial de {selected.name} en otra pestaña ↗</a>
      <iframe key={selected.id} src={selected.url} title={`Localizador oficial de ${selected.name}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      <small>Algunas transportadoras bloquean mapas incrustados. Si el recuadro no carga, utiliza el enlace oficial.</small>
    </div>}
  </section>;
}
