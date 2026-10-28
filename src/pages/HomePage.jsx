import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import settingsApi from '@/services/settings';
import productApi from '@/services/products';
import ProductGrid from '@/components/ProductGrid';
import CategoryCard from '@/components/CategoryCard';
import CategoryGrid from '@/components/CategoryGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function HomePage() {
  usePageTitle(null);
  const [config, setConfig] = useState(null);
  const [blocksData, setBlocksData] = useState({});
  const [error, setError] = useState(false);
  const { setHomeHeroAtTop } = useOutletContext();

  useEffect(() => {
    let mounted = true;
    settingsApi
      .get()
      .then((s) => {
        if (!mounted) return;
        setConfig(s);
        const blocks = s.home?.blocks || [];
        blocks.forEach((block) => {
          if (!block.products) return;
          productApi
            .list({
              ...(block.products.params || {}),
              sort: block.products.sort,
              limit: block.products.limit || 4
            })
            .then((result) => {
              if (mounted) setBlocksData((current) => ({ ...current, [block.type]: result.data }));
            })
            .catch(() => {
              if (mounted) setBlocksData((current) => ({ ...current, [block.type]: [] }));
            });
        });
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => { mounted = false; };
  }, []);

  const blocks = config?.home?.blocks || [];
  const firstBlockType = blocks[0]?.type;

  useLayoutEffect(() => {
    setHomeHeroAtTop(firstBlockType === 'hero');
    return () => setHomeHeroAtTop(false);
  }, [firstBlockType, setHomeHeroAtTop]);
  // eslint-disable-next-line no-unused-vars
  const store = config?.store || { name: 'FENMI' };

  if (error) {
    return (
      <div className="empty-state">
        <h3>No pudimos cargar la tienda</h3>
        <p>Revisa tu conexión e intenta de nuevo.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="empty-state">
        <h3>Cargando tienda…</h3>
        <p>Espera unos segundos.</p>
      </div>
    );
  }

  return (
    <>
      {blocks.map((block, i) => (
        <React.Fragment key={`${block.type}-${i}`}>
          {renderBlock(block, blocksData, config)}
        </React.Fragment>
      ))}
    </>
  );
}

function renderBlock(block, data, config) {
  switch (block.type) {
    case 'hero': {
      const heroImg = config?.home?.heroImage || '/uploads/hero/hero.jpg?v=1';
      const heroImgV = config?.home?.heroImageVertical || '/uploads/hero/hero_vertical.jpg?v=1';
      return (
        <section className="hero">
          <picture>
            <source media="(max-width: 768px)" srcSet={heroImgV} />
            <img className="hero-img" src={heroImg} alt="" loading="eager" fetchPriority="high" decoding="async" width="1920" height="1080" />
          </picture>
        </section>
      );
    }
    case 'marquee':
      return (
        <div className="marquee">
          <div className="marquee-track">
            {Array(3).join(`${block.text} · `) + block.text}
          </div>
        </div>
      );
    case 'categories':
      return (
        <div className="container section">
          <div className="heading-row">
            <h2>{block.title || 'Categorías'}</h2>
            {block.cta && (
              <Link className="text-link" to={block.cta.to || '/catalog'}>
                {block.cta.label}
              </Link>
            )}
          </div>
          <CategoryGrid />
        </div>
      );
    case 'featured':
    case 'new':
    case 'bestSeller':
      return (
        <div className="container section">
          <div className="heading-row">
            <h2>{block.title || 'Productos'}</h2>
            {block.cta && (
              <Link className="text-link" to={block.cta.to || '/catalog'}>
                {block.cta.label}
              </Link>
            )}
          </div>
          {data[block.type] ? (
            <ProductGrid products={data[block.type]} />
          ) : (
            <ProductGridSkeleton />
          )}
        </div>
      );
    case 'editorial':
      return (
        <div className="editorial-band">
          <div className="editorial-grid">
            <div className="editorial-copy">
              <p className="eyebrow">{block.eyebrow || 'FENMI EDIT'}</p>
              <h2>{block.title}</h2>
              <p>{block.text}</p>
            </div>
          </div>
        </div>
      );
    case 'statement':
      return (
        <div className="statement">
          <p className="eyebrow">{block.eyebrow || 'FENMI'}</p>
          <h2>{block.text}</h2>
        </div>
      );
    default:
      return null;
  }
}