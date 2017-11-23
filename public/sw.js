'use strict';

var cacheVersion = 1;
var currentCache = {
  offline: 'offline-cache' + cacheVersion
};
const offlineUrl = 'offline-page.html';

console.log("ivar sw");

this.addEventListener('install', event => {
  console.log("ivar installing");
  event.waitUntil(
    caches.open(currentCache.offline).then(function (cache) {
      return cache.addAll([
        './img/offline.svg',
        offlineUrl
      ]);
    })
  );
});

this.addEventListener('fetch', async event => {
  console.log("fetching: " + event.request.url);
  let url = new URL(event.request.url);
  if (url.pathname.startsWith("/preview/")) {
    let segments = url.pathname.split("/");
    let pathname = segments.slice(2, 4).join("/");
    let filename = segments[segments.length - 1];
    let cacheKey = pathname + "/" + filename;
    if (url.search === "?autoload")
      cacheKey += url.search;
    event.respondWith(caches.match(cacheKey)
      .then(function (response) {
        return response || fetch(event.request);
      })
    );
    // event.respondWith(
    //   caches.open("preview").then(function (previewCache) {
    //     debugger;
    //     previewCache.match(cacheKey).then(function (cachedResponse) {
    //       return cachedResponse || fetch(event.request);
    //     });
    //   })
    // );
    // event.respondWith(
    //   caches.open("preview").then(function (previewCache) {
    //     previewCache.match(cacheKey).then(function (response) {
    //       return response || fetch(event.request);
    //     })
    //   })
    // );
  }

  // request.mode = navigate isn't supported in all browsers
  // so include a check for Accept: text/html header.
  else if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request.url).catch(error => {
        // Return the offline page
        return caches.match(offlineUrl);
      })
    );
  }
  else {
    // Respond with everything else if we can
    event.respondWith(caches.match(event.request)
      .then(function (response) {
        return response || fetch(event.request);
      })
    );
  }
});