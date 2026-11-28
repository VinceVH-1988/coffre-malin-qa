// Coffre Malin, service worker.
// Réseau d'abord : si l'iPhone a du réseau, il prend toujours la dernière version publiée.
// Sans réseau, il utilise la copie gardée en mémoire.
const CACHE = "coffre-malin-v5-pagaille";
const FILES = ["./", "index.html", "styles.css", "data.js", "core.js", "calc.js", "faussaire.js", "deguiseur.js", "menteur.js", "pagaille.js", "ui.js", "boot.js", "fonts/fredoka.woff2", "manifest.webmanifest", "contenu.json", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "illustrations/retenues.svg", "illustrations/tables.svg", "illustrations/deguiseur.svg", "illustrations/faussaire_mot.svg", "illustrations/menteur.svg", "illustrations/mix.svg", "illustrations/pagaille.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
