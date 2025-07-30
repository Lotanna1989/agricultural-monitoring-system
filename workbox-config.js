module.exports = {
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}',
    'manifest.json'
  ],
  globIgnores: [
    '**/node_modules/**/*',
    'service-worker.js',
    'workbox-*.js',
    '**/service-worker.js.map',
    '**/workbox-*.js.map'
  ],
  swDest: 'build/service-worker.js',
  
  // Increase file size limit to handle larger images
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  
  // Runtime caching for images and API calls
  runtimeCaching: [
    {
      // Cache large images with a network-first strategy
      urlPattern: /\.(?:png|jpg|jpeg|gif|webp)$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Cache API calls (but not Firebase auth)
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
    {
      // Handle Firebase services - Network only (don't cache auth requests)
      urlPattern: /^https:\/\/.*\.googleapis\.com/,
      handler: 'NetworkOnly',
    },
    {
      // Cache external resources
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
      },
    },
    {
      // Cache font files
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    }
  ],
  
  // Skip waiting and claim clients immediately
  skipWaiting: true,
  clientsClaim: true,
  
  // Clean up old caches
  cleanupOutdatedCaches: true,
  
  // Add navigation fallback for SPA
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/, /\/api\//],
  
  // Mode for generating the service worker
  mode: 'production',
  
  // Additional configurations for better offline support
  inlineWorkboxRuntime: true,
};