import { useEffect, useState } from 'react';
import settingsApi from '@/services/settings';

// Devuelve el umbral de envío gratis configurado en el panel admin.
// Devuelve 0 hasta que la config carga; 0 hace que el aviso no se muestre.
export default function useShippingSettings() {
  const [threshold, setThreshold] = useState(0);

  useEffect(() => {
    let vivo = true;
    settingsApi
      .get()
      .then((s) => {
        if (!vivo) return;
        setThreshold(Number(s?.shipping?.freeShippingThreshold) || 0);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  return threshold;
}
