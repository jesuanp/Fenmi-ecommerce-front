import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reviewApi } from '@/services/extras';
import useAuth from '@/stores/auth';
import useUI from '@/stores/ui';

export default function ReviewsSection({ slug }) {
  const auth = useAuth();
  const ui = useUI();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await reviewApi.list(slug);
      setData(d);
    } catch {
      setData({ average: null, total: 0, distribution: {}, reviews: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await reviewApi.create(slug, form);
      ui.showToast('Reseña enviada. Gracias por tu comentario');
      setForm({ rating: 5, title: '', comment: '' });
      setShowForm(false);
    } catch (err) {
      ui.showToast(err.response?.data?.error?.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  if (loading || !data) return <div style={{ margin: '50px 0' }}><div className="skeleton" style={{ height: 120 }} /></div>;

  const total = data.total || 0;

  return (
    <div className="reviews-block">
      <div className="reviews-head">
        <div className="reviews-summary">
          <h2>Reseñas</h2>
          <div className="big-rating">
            <span className="big-num">{data.average ? data.average.toFixed(1) : '—'}</span>
            <span className="stars">{ratingStars(data.average)}</span>
            <span className="count">({total})</span>
          </div>
        </div>
        <button className="btn outline small" onClick={() => {
          if (auth.status !== 'authenticated') return nav('/login');
          setShowForm((v) => !v);
        }}>
          Escribir una reseña
        </button>
      </div>

      {/* Distribución */}
      {total > 0 && (
        <div className="rating-dist">
          {[5, 4, 3, 2, 1].map((n) => (
            <div className="dist-row" key={n}>
              <span className="dist-label">{n}★</span>
              <div className="dist-bar"><div className="dist-fill" style={{ width: `${((data.distribution[n] || 0) / total) * 100}%` }} /></div>
              <span className="dist-count">{data.distribution[n] || 0}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form className="review-form" onSubmit={submit}>
          <div className="rating-picker">
            <span className="rating-picker-label">Tu calificación</span>
            <div className="stars" role="radiogroup" aria-label="Calificación">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={form.rating === n}
                  aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                  className={'rating-star' + (n <= form.rating ? ' filled' : '')}
                  onClick={() => setForm({ ...form, rating: n })}
                >
                  {n <= form.rating ? '★' : '☆'}
                </button>
              ))}
            </div>
            <span className="rating-picker-note">{form.rating} de 5</span>
          </div>
          <input className="field" placeholder="Título (opcional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="field textarea" placeholder="Cuéntanos tu experiencia…" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} required />
          <button className="btn lime small" disabled={sending}>{sending ? 'Enviando…' : 'Enviar reseña'}</button>
        </form>
      )}

      {/* Lista */}
      <div className="reviews-list">
        {data.reviews.length === 0 ? (
          <p style={{ color: 'var(--mid)', fontSize: 13 }}>Aún no hay reseñas. Sé la primera en opinar.</p>
        ) : (
          data.reviews.map((r) => (
            <div className="review-item" key={r.id}>
              <div className="review-top">
                <strong>{r.user}</strong>
                {r.verified && <span className="verified-badge">✓ Compra verificada</span>}
              </div>
              <div className="stars">{ratingStars(r.rating)}</div>
              {r.title && <h4>{r.title}</h4>}
              <p>{r.comment}</p>
              <span className="review-date">{new Date(r.createdAt).toLocaleDateString('es-CO')}</span>
            </div>
          ))
        )}
      </div>

      {auth.status !== 'authenticated' && (
        <p style={{ fontSize: 12, color: 'var(--mid)' }}>
          <Link to="/login">Inicia sesión</Link> para escribir una reseña.
        </p>
      )}
    </div>
  );
}

function ratingStars(v) {
  const val = Number(v || 0);
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= Math.round(val) ? '★' : '☆';
  return s;
}