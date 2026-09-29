import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import productApi from '@/services/products';
import { useDebounce } from '@/hooks/useDebounce';
import { money } from '@/services/settings';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [debounced] = useDebounce(q, 350);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    productApi.search(debounced).then(setResults).catch(() => setResults([]));
  }, [debounced]);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setResults([]);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setResults([]);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form className="search-bar" onSubmit={submit} ref={boxRef}>
      <input
        type="text"
        placeholder="Buscar"
        aria-label="Buscar productos"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" aria-label="Buscar">
        ⌕
      </button>
      {debounced.trim() && results.length > 0 && (
        <div className="search-suggest">
          {results.map((r) => (
            <Link key={r.slug} to={`/products/${r.slug}`} onClick={() => setResults([])}>
              <img src={r.image} alt="" />
              <div>
                <div className="s-name">{r.name}</div>
                <div className="s-price">{money(r.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}