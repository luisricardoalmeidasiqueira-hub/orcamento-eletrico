/* Orçamento Elétrico v3.0 — funcionamento offline. © 2026 Luís Ricardo de Almeida Siqueira */
const CACHE='oe-v3.0';
const ARQ=['./','index.html','estilo.css','app.js','manifest.json','icone-192.png','icone-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(ARQ.map(u=>c.add(new Request(u,{cache:'reload'})))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.searchParams.has('nc'))return; /* verificação de atualização: sempre pela internet */
  const proprio=url.origin===location.origin;
  const cdn=/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.host);
  if(!proprio&&!cdn)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const chave=req.mode==='navigate'?'index.html':req;
    const salvo=await c.match(chave,{ignoreSearch:req.mode==='navigate'||proprio});
    const rede=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(chave,r.clone());return r}).catch(()=>null);
    if(salvo){e.waitUntil(rede);return salvo}
    return (await rede)||new Response('Sem internet',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  })());
});
