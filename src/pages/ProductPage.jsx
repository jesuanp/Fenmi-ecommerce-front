import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import productApi from '@/services/products';
import useCart from '@/stores/cart';
import useUI from '@/stores/ui';
import { money } from '@/services/settings';
import settingsApi from '@/services/settings';
import ProductGrid from '@/components/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import ReviewsSection from '@/components/ReviewsSection';
import WishlistButton from '@/components/WishlistButton';
import SizeGuideSection from '@/components/SizeGuideSection';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function ProductPage() {
  const { slug } = useParams();
  const cart = useCart();
  const ui = useUI();
  const [product, setProduct] = useState(null);
  usePageTitle(product?.name || null);
  const [related, setRelated] = useState(null);
  const [whatsapp, setWhatsapp] = useState('573018557535');
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setProduct(null);
    setLoadError(false);
    productApi.getBySlug(slug).then((p) => {
      setProduct(p);
      // Seleccionar por defecto la primera variante CON stock (robusto).
      const firstAvailable =
        p.variants?.find((x) => x.stock > 0) ||
        p.variants?.[0] ||
        {};
      setSelectedColorId(firstAvailable.colorId ?? p.colors?.[0]?.id ?? null);
      setSelectedSize(firstAvailable.size ?? p.sizes?.[0] ?? null);
      setMainImg(p.images?.[0]);
    }).catch(() => {
      setLoadError(true);
    });
    productApi.related(slug).then(setRelated).catch(() => setRelated([]));
    settingsApi.get().then((s) => setWhatsapp(s.whatsapp)).catch(() => {});
  }, [slug]);

  // Variante activa según color+talla seleccionados.
  useEffect(() => {
    if (!product || !selectedColorId || !selectedSize) return;
    // Busca la variante exacta; si no existe (p. ej. talla sin stock para este
    // color), trata de completar con una variante del mismo color con stock.
    const exact = product.variants.find(
      (x) => x.colorId === selectedColorId && x.size === selectedSize
    );
    const fallback =
      exact && exact.stock > 0
        ? exact
        : product.variants.find((x) => x.colorId === selectedColorId && x.stock > 0);
    setSelectedVariant(fallback || exact || null);
    setQty(1);
    // Actualiza imagen principal según el color (si hay galería por color).
    const colorImgs = product.imagesByColor?.[`c${selectedColorId}`];
    if (colorImgs && colorImgs.length > 0) {
      setMainImg(colorImgs[0]);
    }
  }, [product, selectedColorId, selectedSize]);

  if (!product) {
    return <ProductDetailSkeleton />;
  }

  const canAdd = selectedVariant && selectedVariant.stock > 0;

  const addToCart = async () => {
    if (!canAdd) {
      ui.showToast('Selecciona una talla con disponibilidad');
      return;
    }
    const ok = await cart.add(product, selectedVariant, qty);
    if (ok) {
      ui.showToast('Agregado al carrito');
      ui.openCart();
    } else {
      ui.showToast('No hay stock suficiente');
    }
  };

  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    `Hola, estoy interesada en ${product?.name || 'este producto'}`
  )}`;

  if (loadError) {
    return (
      <div className="empty-state" style={{ padding: '100px 24px' }}>
        <h3>No se pudo cargar el producto</h3>
        <p style={{ color: 'var(--mid)', fontSize: 14 }}>Puede que el producto no exista o haya sido eliminado.</p>
        <Link to="/catalog" className="btn" style={{ marginTop: 16 }}>Ver catálogo</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '40px 56px' }}>
        <div className="product-layout">
          <div className="gallery-skeleton" style={{ aspectRatio: '4/5', background: 'var(--bg)', borderRadius: 12 }} />
          <div className="product-info">
            <div style={{ height: 20, background: 'var(--bg)', borderRadius: 4, width: 80, marginBottom: 16 }} />
            <div style={{ height: 40, background: 'var(--bg)', borderRadius: 4, width: '70%', marginBottom: 24 }} />
            <div style={{ height: 20, background: 'var(--bg)', borderRadius: 4, width: 120 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 56px 40px' }}>
      <div className="product-layout">
        <Gallery
          images={product.images}
          mainImg={mainImg}
          activeColor={selectedColorId}
          imagesByColor={product.imagesByColor}
          onSelect={(url) => setMainImg(url)}
        />
        <div className="product-info">
          <p className="eyebrow">
            {product.categoryName || 'FENMI'}
          </p>
          <h1 className="product-title">{product.name}</h1>
          <div className="rating-line">
            <RatingStars value={product.rating} />
            <span>
              {product.reviewCount > 0
                ? `${product.reviewCount} reseñas`
                : 'Sin reseñas'}
            </span>
          </div>
          <div className="price-line">
            {product.compareAtPrice && (
              <span className="price-old">{money(product.compareAtPrice)}</span>
            )}
            <span className="price-main">{money(product.price)}</span>
          </div>
          <p className="product-short">{product.shortDescription}</p>

          <ColorSwatches
            colors={product.colors}
            selected={selectedColorId}
            onSelect={setSelectedColorId}
          />
          <SizeSelector
            sizes={product.sizes}
            variants={product.variants}
            colorId={selectedColorId}
            selected={selectedSize}
            onSelect={setSelectedSize}
          />

          <div className="qty-row">
            <QtySelector value={qty} max={selectedVariant?.stock || 1} onChange={setQty} />
            <div className="stock-note">
              {selectedVariant
                ? selectedVariant.stock > 0
                  ? selectedVariant.stock < 5
                    ? `¡Solo quedan ${selectedVariant.stock}!`
                    : 'En existencia'
                  : 'Agotado'
                : 'Sin disponibilidad'}
            </div>
          </div>

          <button
            className={'btn block add-btn' + (canAdd ? '' : ' disabled')}
            onClick={addToCart}
            disabled={!canAdd}
          >
            Agregar al carrito
          </button>
          <a className="btn outline block" href={waLink} target="_blank" rel="noopener">
            ¿Necesitas ayuda? Escríbenos
          </a>

          <TrustRow />

          <Accordions product={product} />

          <WishlistButton productId={product.id} />
        </div>
      </div>

      <ReviewsSection slug={product.slug} />

      <SizeGuideSection slug={product.slug} />

      {related && (
        <div className="section">
          <div className="heading-row">
            <h2>También te puede gustar</h2>
          </div>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  );
}

function QtySelector({ value, max, onChange }) {
  return (
    <div className="qty">
      <button onClick={() => onChange(Math.max(1, value - 1))}>−</button>
      <span>{value}</span>
      <button disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

function RatingStars({ value }) {
  const v = Number(value || 0);
  const stars = [1, 2, 3, 4, 5].map((i) => (i <= Math.round(v) ? '★' : '☆')).join('');
  return <span className="stars">{stars}</span>;
}

function Gallery({ images, mainImg, onSelect }) {
  const list = images || [];
  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={mainImg || list[0]} alt="" />
      </div>
      <div className="gallery-thumbs">
        {list.map((u, i) => (
          <button key={i} onClick={() => onSelect(u)}>
            <img src={u} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorSwatches({ colors, selected, onSelect }) {
  return (
    <div className="option-block">
      <div className="option-title">Color</div>
      <div className="swatches">
        {colors.map((c, i) => (
          <button
            key={c.id != null ? c.id : `${c.name}-${i}`}
            className={'swatch' + (c.id === selected ? ' active' : '')}
            onClick={() => onSelect(c.id)}
            title={c.name}
            style={{ background: c.hex || '#ccc' }}
          >
            <span style={{ background: c.hex || '#ccc' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeSelector({ sizes, variants, colorId, selected, onSelect }) {
  return (
    <div className="option-block">
      <div className="option-title">Talla</div>
      <div className="sizes">
        {sizes.map((s) => {
          const stock = variants.find((v) => v.colorId === colorId && v.size === s)?.stock || 0;
          return (
            <button
              key={s}
              className={'size' + (s === selected ? ' active' : '') + (stock === 0 ? ' out' : '')}
              onClick={() => stock > 0 && onSelect(s)}
              disabled={stock === 0}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrustRow() {
  return (
    <div className="trust-row">
      <span>🚚 Envío a toda Colombia</span>
      <span>↩ Cambios hasta 5 días</span>
      <span>💳 Cuotas Addi</span>
      <span>🔒 Compra segura</span>
    </div>
  );
}

function Accordions({ product }) {
  const sections = [
    { title: 'Descripción', body: product.longDescription },
    {
      title: 'Composición y tejido',
      body: `${product.composition || ''}\n\n${product.fabricType ? `Tipo: ${product.fabricType}` : ''}`
    },
    { title: 'Instrucciones de lavado', body: product.careInstructions },
    { title: 'Envíos y devoluciones', body: product.shippingInfo }
  ];
  return (
    <div className="accordions">
      {sections.map((s) => (
        <details key={s.title}>
          <summary>{s.title}</summary>
          <p>{s.body}</p>
        </details>
      ))}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="product-layout">
      <div className="skeleton" style={{ aspectRatio: '4/5' }} />
      <div className="skeleton" style={{ height: 360 }} />
    </div>
  );
}