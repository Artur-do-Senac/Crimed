/* ============================================================================
   CRIMED · sw.js — Service Worker
   Estratégia "rede primeiro, cache como reserva" para os arquivos do portal.
   Depois da primeira visita o sistema abre mesmo sem internet — importante
   para unidades de saúde com conexão instável (risco R3 do projeto).
   ========================================================================= */
var CACHE = "crimed-v4";

var ARQUIVOS = [
  "./",
  "./index.html",
  "./acesso.html",
  "./dashboard.html",
  "./consultas.html",
  "./teleconsulta.html",
  "./prontuarios.html",
  "./perfil.html",
  "./medico.html",
  "./admin.html",
  "./sobre.html",
  "./manifest.json",
  "./assets/css/base.css",
  "./assets/css/components.css",
  "./assets/css/layout.css",
  "./assets/css/pages.css",
  "./assets/js/icons.js",
  "./assets/js/core.js",
  "./assets/js/data.js",
  "./assets/js/app.js",
  "./assets/js/paciente.js",
  "./assets/js/gestao.js",
  "./assets/js/teleconsulta.js",
  "./assets/js/assistente.js",
  "./assets/js/charts.js",
  "./assets/vendor/qrcode.js",
  "./assets/img/favicon.svg",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/criciuma.jpg",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* addAll falha inteiro se um arquivo faltar — por isso, um a um */
      return Promise.all(
        ARQUIVOS.map(function (url) {
          return c.add(url).catch(function () {});
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(
        nomes.map(function (n) {
          if (n !== CACHE) return caches.delete(n);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  /* recursos externos (fontes, VLibras) nunca entram no cache local */
  if (url.origin !== location.origin) return;

  /* Rede primeiro, cache como reserva.
     Assim uma versão nova publicada no GitHub Pages aparece na hora, e o
     sistema continua abrindo quando a conexão cai. */
  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copia);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
  );
});
