const WOMPI_FRAME = /wompi(?:\.co|\.pa)?/i;

export function isWompiWidgetVisible(doc = globalThis.document) {
  if (!doc?.querySelectorAll) return false;
  return Array.from(doc.querySelectorAll('iframe')).some((frame) => {
    const identity = [
      frame.getAttribute?.('src'),
      frame.getAttribute?.('title'),
      frame.getAttribute?.('name'),
      frame.getAttribute?.('id')
    ].filter(Boolean).join(' ');
    if (!WOMPI_FRAME.test(identity)) return false;
    if (frame.isConnected === false) return false;
    if (!frame.getClientRects) return true;
    return frame.getClientRects().length > 0;
  });
}

export function watchWompiWidgetClose(onClose, doc = globalThis.document, Observer = globalThis.MutationObserver) {
  if (!doc?.documentElement || typeof Observer !== 'function') return () => {};
  let observedOpen = isWompiWidgetVisible(doc);
  let stopped = false;
  const observer = new Observer(() => {
    if (stopped) return;
    if (isWompiWidgetVisible(doc)) {
      observedOpen = true;
    } else if (observedOpen) {
      stop();
      onClose();
    }
  });
  const stop = () => {
    if (stopped) return;
    stopped = true;
    observer.disconnect();
  };
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden', 'src']
  });
  return stop;
}
