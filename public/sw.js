// Service worker minimal — rend l'app installable (PWA) sur téléphone.
// Ne met rien en cache de façon agressive : l'app a besoin du réseau pour
// fonctionner (elle appelle son propre serveur), donc on se contente de
// laisser passer les requêtes normalement. Sa seule présence + le manifest
// suffisent à faire apparaître "Installer l'application" dans le navigateur.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Pass-through — pas de cache personnalisé.
});
