/* Toptec Global — installable public website shortcut */

(() => {
  'use strict';

  const installButton = document.getElementById('install-app');
  const pwaEnabled = document.querySelector('meta[name="toptec-pwa-enabled"]')?.content !== 'false';
  let deferredPrompt = null;

  const disableInstallButton = () => {
    if (!installButton) return;
    installButton.disabled = true;
    installButton.setAttribute('aria-disabled', 'true');
  };

  const enableInstallButton = () => {
    if (!installButton) return;
    installButton.disabled = false;
    installButton.removeAttribute('aria-disabled');
  };

  if (installButton) {
    disableInstallButton();
  }

  if (!pwaEnabled) {
    return;
  }

  if (installButton) {

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      enableInstallButton();
    });

    installButton.addEventListener('click', async () => {
      if (!deferredPrompt || installButton.disabled) return;

      disableInstallButton();
      const promptEvent = deferredPrompt;
      deferredPrompt = null;

      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (error) {
        console.warn('[PWA] The browser could not complete the install prompt.', error);
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      disableInstallButton();
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed.', error);
        });
    }, { once: true });
  }
})();
