import React from 'react';

export default function Pagination({ page, onPage }) {
  if (!page || page.totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={!page.hasPrev} onClick={() => onPage(page.page - 1)}>
        ←
      </button>
      <span>
        Página {page.page} de {page.totalPages}
      </span>
      <button disabled={!page.hasNext} onClick={() => onPage(page.page + 1)}>
        →
      </button>
    </div>
  );
}