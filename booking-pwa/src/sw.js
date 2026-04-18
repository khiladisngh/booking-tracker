/**
 * Custom service worker for the booking PWA.
 *
 * Workbox precache manifest is injected at build time by vite-plugin-pwa
 * (injectManifest strategy). Event handlers below support notification
 * interactions and future server-push delivery.
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Precache all assets emitted by Vite; self.__WB_MANIFEST is replaced at build time.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ---------------------------------------------------------------------------
// Notification click: focus existing window or open a new one.
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus()
        }
        return clients.openWindow('/')
      }),
  )
})

// ---------------------------------------------------------------------------
// Push event: reserved for future server-push support.
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Booking reminder', {
      body: data.body ?? '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    }),
  )
})
