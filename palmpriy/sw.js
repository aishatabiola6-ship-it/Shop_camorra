// Clean-up only: this address used to serve the Strut shop, which installed
// an offline helper. This replacement deletes Strut's saved files and removes
// itself, so returning visitors always get the current Palmpriy site.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: "window" });
    tabs.forEach((t) => t.navigate(t.url));
  })());
});
