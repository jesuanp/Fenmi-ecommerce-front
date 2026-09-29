import React, { useEffect, useRef, useState } from 'react';
import productApi from '@/services/products';
import CategoryCard from '@/components/CategoryCard';

const AUTOPLAY_MS = 3000;

function visibleCount() {
  const w = window.innerWidth;
  if (w <= 600) return 1;
  if (w <= 1024) return 2;
  return 3;
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    productApi
      .categories()
      .then((c) => {
        setCategories(c);
        setLoaded(true);
      })
      .catch(() => setCategories([]));
  }, []);

  const count = categories?.length || 0;
  const visible = visibleCount();

  // Track duplicado: la vista en index `count` es idéntica a la de index `0`,
  // por eso el índice va en [0, count] y el cruce de contorno es invisible.
  const items =
    loaded && count > 0 ? [...categories, ...categories] : [null, null, null, null];
  const stepPct = 100 / visible;
  const maxIndex = count; // 0..count (count es equivalente visual a 0)

  function go(delta) {
    if (count === 0) return;
    let next = index + delta;

    const wrapped = next > maxIndex || next < 0;
    if (next > maxIndex) next = 0; // vista idéntica a la de count → invisible
    else if (next < 0) next = maxIndex;

    if (wrapped) {
      // Cambio silencioso: se aplica sin transición y se deja reposar ~40ms para
      // que el navegador pinte el nuevo transform antes de reactivar la animación.
      setInstant(true);
      setIndex(next);
      setTimeout(() => setInstant(false), 40);
      return;
    }
    setIndex(next);
  }

  useEffect(() => {
    if (!loaded || paused || count < 2 || count <= visible) return;
    const timer = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, paused, count, visible, maxIndex, index]);

  useEffect(() => {
    if (index > maxIndex) setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxIndex]);

  const showArrows = loaded && count > 1 && count > visible;

  return (
    <div
      className="category-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {showArrows && (
        <button
          type="button"
          className="category-arrow left"
          aria-label="Anterior"
          onClick={() => {
            setPaused(true);
            go(-1);
          }}
        >
          ‹
        </button>
      )}

      <div
        ref={trackRef}
        className={'category-slider-track' + (instant ? ' no-anim' : '')}
        style={{ transform: `translateX(-${index * stepPct}%)` }}
      >
        {items.map((c, i) =>
          c ? (
            <div
              className="category-slide"
              key={`${c.id}-${i}`}
              style={{ width: `${stepPct}%` }}
            >
              <CategoryCard category={c} />
            </div>
          ) : (
            <div key={i} className="category-slide" style={{ width: `${stepPct}%` }}>
              <div className="category-card skeleton" style={{ minHeight: 140 }} />
            </div>
          )
        )}
      </div>

      {showArrows && (
        <button
          type="button"
          className="category-arrow right"
          aria-label="Siguiente"
          onClick={() => {
            setPaused(true);
            go(1);
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}