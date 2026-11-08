import { useEffect, useState } from 'react';
import { orderApi } from '@/services/orders';

let cachedCatalog = null;
let catalogRequest = null;

function loadCatalog() {
  if (cachedCatalog) return Promise.resolve(cachedCatalog);
  if (!catalogRequest) {
    catalogRequest = orderApi.shippingDestinations().then((result) => {
      const departments = result?.departments;
      if (!Array.isArray(departments) || departments.length !== 33 || departments.some((item) => !item?.name || !Array.isArray(item.cities) || !item.cities.length)) {
        throw new Error('No se recibió un catálogo completo de destinos.');
      }
      cachedCatalog = departments;
      return departments;
    }).finally(() => { catalogRequest = null; });
  }
  return catalogRequest;
}

export function normalizeDestination(value) {
  const normal = String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^bogota( d c| dc)?$/.test(normal)) return 'bogota';
  if (['archipielago de san andres', 'archipielago de san andres providencia y santa catalina', 'san andres providencia y santa catalina'].includes(normal)) return 'san andres y providencia';
  if (normal === 'cartagena de indias') return 'cartagena';
  if (normal === 'santiago de cali') return 'cali';
  return normal;
}

export function matchDepartment(departments, name) {
  return (departments || []).find((item) => normalizeDestination(item.name) === normalizeDestination(name)) || null;
}

export function matchCity(departments, state, city) {
  const row = matchDepartment(departments, state);
  return row?.cities.find((name) => normalizeDestination(name) === normalizeDestination(city)) || '';
}

export default function useColombiaDestinations() {
  const [departments, setDepartments] = useState(cachedCatalog || []);
  const [loading, setLoading] = useState(!cachedCatalog);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadCatalog()
      .then((result) => { if (active) { setDepartments(result); setError(''); } })
      .catch(() => { if (active) { setDepartments([]); setError('No se pudieron cargar los departamentos y municipios. Reintenta antes de continuar.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  return { departments, loading, error, retry: () => setAttempt((count) => count + 1) };
}
