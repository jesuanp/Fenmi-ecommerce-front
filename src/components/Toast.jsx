import React from 'react';
import useUI from '@/stores/ui';

export default function Toast() {
  const toast = useUI((s) => s.toast);
  return (
    <div className={'toast' + (toast ? ' show' : '')} role="status">
      {toast || ''}
    </div>
  );
}