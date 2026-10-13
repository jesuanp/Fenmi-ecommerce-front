import React, { useEffect, useState } from 'react';
import settingsApi from '@/services/settings';

const FALLBACK_NUMBER = '573018557535';
const DEFAULT_MESSAGE = 'Hola, vengo de la web y quiero más información.';

export default function WhatsAppFloat() {
  const [wa, setWa] = useState(FALLBACK_NUMBER);

  useEffect(() => {
    settingsApi
      .get()
      .then((s) => {
        if (s?.whatsapp) {
          const digits = String(s.whatsapp).replace(/\D/g, '');
          if (digits) setWa(digits);
        }
      })
      .catch(() => {});
  }, []);

  const href = `https://wa.me/${wa}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-float"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
    >
      <svg className="wa-float-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <path fill="#fff" d="M19.11 17.21c-.28-.14-1.65-.81-1.9-.9-.26-.09-.44-.14-.63.14-.18.28-.72.9-.88 1.08-.16.18-.32.21-.6.07-.28-.14-1.18-.43-2.25-1.39-.83-.74-1.39-1.66-1.55-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.55-.46-.47-.63-.48l-.54-.01c-.18 0-.48.07-.74.35-.26.28-.97.95-.97 2.32 0 1.37 1 2.69 1.14 2.88.14.18 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.18-.54-.32z" />
        <path fill="#fff" d="M16 3C8.83 3 3 8.83 3 16c0 2.29.61 4.49 1.76 6.42L3 29l6.74-1.73A12.94 12.94 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16 3zm0 23.6c-1.97 0-3.89-.53-5.56-1.52l-.4-.24-4.13 1.06 1.1-4.02-.26-.41A10.6 10.6 0 1 1 26.6 16 10.6 10.6 0 0 1 16 26.6z" />
      </svg>
      <span className="wa-float-pulse" aria-hidden="true" />
    </a>
  );
}
