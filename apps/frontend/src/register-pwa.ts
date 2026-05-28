/** Register the service worker only when the browser passes support checks. */
export const registerPwaServiceWorker = (): void => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  void (async () => {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  })();
};
