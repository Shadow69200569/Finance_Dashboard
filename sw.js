/**
 * ============================================================
 *  Vertex Expense Tracker — Service Worker (sw.js)
 * ============================================================
 *  Implements a Cache-First strategy for offline PWA support.
 *
 *  Lifecycle:
 *    1. install  → Pre-caches all core app assets
 *    2. fetch    → Serves from cache first, falls back to network
 *    3. activate → Deletes stale caches from older versions
 *
 *  Update the CACHE_NAME version string whenever you deploy a
 *  new version so old caches are invalidated on next visit.
 * ============================================================
 */

// Cache version key — bump this (e.g., 'Vertex-v7') on new deployments
// The activate event will automatically clean up old cache versions.
const CACHE_NAME = 'Vertex-v6';

// List of all files to pre-cache on install.
// These assets will be available even when the user is offline.
const ASSETS_TO_CACHE = [
    '/',                                // Root (resolves to login.html)
    '/login.html',                      // Entry point / auth page
    '/dashboard.html',                  // Main financial overview
    '/add_expense.html',                // Expense logging form
    '/history.html',                    // Full transaction history
    '/settings.html',                   // User preferences page
    '/js/app.js',                       // Shared core logic
    '/manifest.json',                   // PWA web app manifest
    '/vertex_app_icon.png',             // App icon for PWA install prompt
    'https://cdn.tailwindcss.com?plugins=forms,container-queries',  // Tailwind CSS
    'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap',                        // Manrope font CSS
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap' // Material icons CSS
];


// ─────────────────────────────────────────────────────────────
//  INSTALL EVENT
//  Fired when the service worker is first registered.
//  Pre-caches all assets listed in ASSETS_TO_CACHE.
//  skipWaiting() forces the new SW to activate immediately
//  without waiting for all existing tabs to close.
// ─────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activate immediately (don't wait for old SW to die)

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Add all app assets to the cache in one batch
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});


// ─────────────────────────────────────────────────────────────
//  FETCH EVENT
//  Intercepts every network request made by the app.
//  Strategy: Cache First → Network Fallback
//    - If the resource is in the cache, serve it instantly.
//    - Otherwise, fetch from network (and the browser will cache
//      responses normally for future visits).
// ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if available (offline-first)
            if (cachedResponse) {
                return cachedResponse;
            }
            // Otherwise, go to the network as a fallback
            return fetch(event.request);
        })
    );
});


// ─────────────────────────────────────────────────────────────
//  ACTIVATE EVENT
//  Fired after the SW takes control (after install + skip-wait).
//  Cleans up any caches from previous versions.
//  clients.claim() immediately takes control of all open tabs
//  without requiring a page reload.
// ─────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    // Delete any cache that doesn't match the current version
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take immediate control of all tabs
    );
});
