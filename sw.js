/* Orçamento Elétrico v3.4 — funcionamento offline. © 2026 Luís Ricardo de Almeida Siqueira */
const CACHE='oe-v3.4';
const ARQ=['./','index.html','estilo.css','app.js','manifest.json','icone-192.png','icone-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(ARQ.map(u=>c.add(new Request(u,{cache:'reload'})))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
/* Arquivos do app: primeiro tenta a internet (sempre a versão mais nova);
   sem internet, usa a cópia guardada. Bibliotecas externas: cópia guardada primeiro. */
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.searchParams.has('nc'))return;
  const proprio=url.origin===location.origin;
  const cdn=/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.host);
  if(!proprio&&!cdn)return;
  const chave=req.mode==='navigate'?'index.html':req;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const guardado=()=>c.match(chave,{ignoreSearch:proprio});
    if(cdn){const g=await guardado();if(g)return g;
      try{const r=await fetch(req);if(r&&(r.ok||r.type==='opaque'))c.put(chave,r.clone());return r}catch(err){return new Response('',{status:503})}}
    try{
      const r=await Promise.race([fetch(req,{cache:'no-cache'}),new Promise((_,no)=>setTimeout(()=>no('demorou'),4000))]);
      if(r&&r.ok)c.put(chave,r.clone());return r;
    }catch(err){
      return (await guardado())||new Response('Sem internet',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
