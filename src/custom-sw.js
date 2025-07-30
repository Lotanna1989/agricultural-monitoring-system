// src/custom-sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all files listed by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Cache Leaflet OpenStreetMap tiles
registerRoute(
  ({ url }) => url.origin.includes('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'osm-tiles',
    plugins: [new ExpirationPlugin({ maxEntries: 200 })],
  })
);

// Cache Firebase (optional)
registerRoute(
  ({ url }) => url.origin.includes('firestore.googleapis.com'),
  new NetworkFirst()
);

// Cache GeoJSON files (for grazing/non-grazing zones)
registerRoute(
  ({ request }) => request.destination === 'document' || request.url.endsWith('.geojson'),
  new StaleWhileRevalidate({
    cacheName: 'geojson-cache',
  })
);
