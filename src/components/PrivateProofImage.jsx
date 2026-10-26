import React, { useEffect, useState } from 'react';
import client from '@/services/api';

export default function PrivateProofImage({ paymentId }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let valid = true;
    let objectUrl = null;
    client.get(`/payments/proof-file/${paymentId}`, { responseType: 'blob' })
      .then((res) => {
        if (!valid) return;
        objectUrl = URL.createObjectURL(res.data);
        setImageUrl(objectUrl);
      })
      .catch(() => { if (valid) setError(true); });
    return () => { valid = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [paymentId]);
  if (error) return <span style={{ color: 'var(--danger)', fontSize: 12 }}>Comprobante no disponible</span>;
  if (!imageUrl) return <span style={{ fontSize: 12, color: 'var(--mid)' }}>Cargando comprobante…</span>;
  return <a href={imageUrl} target="_blank" rel="noopener noreferrer"><img src={imageUrl} alt="Comprobante privado" style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover' }} /></a>;
}
