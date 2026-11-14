import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/index.css';
import { registerOfflineWorker } from './platform/offline';

registerOfflineWorker();

// Ensure fetch is writable for extension and proxy environments
try {
  if (typeof window !== 'undefined') {
    const orig = window.fetch ? window.fetch.bind(window) : undefined;
    let curr = orig;
    const desc = {
      get() { return curr; },
      set(fn: typeof fetch) { curr = fn; },
      configurable: true,
      enumerable: true
    };
    try { Object.defineProperty(window, 'fetch', desc); } catch (_) {}
    try {
      if (typeof Window !== 'undefined' && Window.prototype) {
        Object.defineProperty(Window.prototype, 'fetch', desc);
      }
    } catch (_) {}
  }
} catch (_) {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
