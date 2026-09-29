import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import productApi from '@/services/products';
import { useDebounce } from '@/hooks/useDebounce';
import ProductGrid from '@/components/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

export default function SearchPage() {
  const params = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const [debounced] = useDebounce(q, 350);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setResults(null);
    productApi
      .list({ q: debounced, limit: 24 })
      .then((r) => setResults(r.data))
      .catch(() => setResults([]));
  }, [debounced]);

  const submit = (e) => {
    e.preventDefault();
    const v = e.target.elements?.[0]?.value || '';
    navigate(`/search?q=${encodeURIComponent(v)}`);
  };

  return (
    <div className="container" style={{ padding: '56px 56px 72px' }}>
      <h1 className="page-title" style={{ marginBottom: 10 }}>
        Buscar
      </h1>
      <form onSubmit={submit} className="search-page-form">
        <input
          type="text"
          aria-label="Buscar productos"
          defaultValue={q}
          placeholder="Busca por nombre, categoría o etiqueta"
        />
        <button className="btn">Buscar</button>
      </form>

      {q && (
        <p className="search-meta">
          Resultados para <strong>“{q}”</strong>: {results ? results.length : '…'} productos
        </p>
      )}

      {debounced && results === null ? (
        <ProductGridSkeleton count={8} />
      ) : results?.length ? (
        <ProductGrid products={results} />
      ) : results?.length === 0 ? (
        <div className="empty-state">
          <h3>No encontramos nada</h3>
          <p>Prueba con otras palabras.</p>
        </div>
      ) : null}
    </div>
  );
}