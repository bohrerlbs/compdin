// Service Worker dedicado para notificações push
self.addEventListener('push', function(event) {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.corpo || '',
    icon: '/58.jpg',
    badge: '/58.jpg',
    tag: data.tipo || 'compdin',
    data: { link: data.link || '/' },
    requireInteraction: false,
    silent: false,
  };
  event.waitUntil(
    self.registration.showNotification(data.titulo, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
