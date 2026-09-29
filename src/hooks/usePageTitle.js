import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · FENMI` : 'FENMI — Activewear';
  }, [title]);
}