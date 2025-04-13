self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('skull-king-cache').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/app.js',
                '/sk_rulebook_thumbsk_rulebook_thumbnail_250x369.png',
                // Add other assets as needed
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});