let scriptPromise = null;
export function loadWompiWidget() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Wompi solo está disponible en el navegador.'));
  if (typeof window.WidgetCheckout === 'function') return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => (typeof window.WidgetCheckout === 'function' ? resolve() : reject(new Error('Wompi no cargó correctamente.')));
    script.onerror = () => reject(new Error('No se pudo cargar Wompi. Verifica tu conexión.'));
    document.head.appendChild(script);
  }).catch((err) => { scriptPromise = null; throw err; });
  return scriptPromise;
}
