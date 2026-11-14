export function registerOfflineWorker(): void {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const { protocol, hostname } = window.location;
  const secureOrigin = protocol === 'https:' || (protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(hostname));
  if (!secureOrigin) return;

  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
  const workerUrl = new URL('service-worker.js', baseUrl);
  void navigator.serviceWorker.register(workerUrl).catch(error => {
    console.warn('[ares-offline] service worker registration failed; offline cache unavailable', error);
  });
}
