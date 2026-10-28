let scriptPromise = null;

export function loadWompiWidget(timeoutMs = 10000) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Wompi solo está disponible en el navegador.'));
  }
  if (typeof window.WidgetCheckout === 'function') return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const source = 'https://checkout.wompi.co/widget.js';
    const previous = document.querySelector('script[src*="checkout.wompi.co/widget.js"]');
    const script = previous || document.createElement('script');
    const created = !previous;
    let finished = false;
    let timer;

    const cleanup = () => {
      clearTimeout(timer);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
    };
    const settle = (error) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (error) {
        if (created && typeof script.remove === 'function') script.remove();
        reject(error);
        return;
      }
      resolve();
    };
    const loaded = () => {
      settle(typeof window.WidgetCheckout === 'function'
        ? null
        : new Error('Wompi no cargó correctamente.'));
    };
    const failed = () => {
      settle(new Error('No se pudo cargar el widget de Wompi.'));
    };

    script.addEventListener('load', loaded);
    script.addEventListener('error', failed);
    timer = setTimeout(() => {
      settle(new Error('Wompi tardó demasiado en cargar. Se abrirá la pasarela en una página completa.'));
    }, timeoutMs);

    if (created) {
      script.src = source;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}
