'use strict';

var cacheVersion = 1;
var currentCache = {
  preview: 'preview'
  //todo careful here, dont do as below. The "preview" name is also used to reference the cache instance in code-preview.html.
  //preview: 'preview' + cacheVersion
};
//inspired by:
// http://deanhume.com/home/blogpost/create-a-really--really-simple-offline-page-using-service-workers/10135
this.addEventListener('install', event => {
  console.log("sw for code.2js.no installed. This makes the preview better");
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
    event.respondWith(caches.open(currentCache.preview)
      .then(function (prevCache) {
          return prevCache.match(cacheKey)
            .then(function (response) {
              return response || fetch(event.request);
            })
        }
      )
    );
  }
});