/* Orçamento Elétrico v3.0 — Desenvolvido por Luís Ricardo de Almeida Siqueira. © 2026 Todos os direitos reservados. */
const VERSAO='3.0';
const $=s=>document.querySelector(s);
const brl=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=v=>parseFloat(String(v).replace(',','.'))||0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoje=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const dataBR=s=>s?s.split('-').reverse().join('/'):'';
const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2200)}
function perguntar(msg,fn){$('#ok-txt').textContent=msg;$('#ok-btn').onclick=()=>{$('#m-ok').classList.remove('on');fn()};$('#m-ok').classList.add('on')}
function copiar(txt,el){
  /* 1º jeito: cópia direta (funciona melhor no iPhone, dentro do toque) */
  let ok=false;
  try{const t=document.createElement('textarea');t.value=txt;t.setAttribute('readonly','');
    t.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
    document.body.appendChild(t);t.focus();t.select();t.setSelectionRange(0,txt.length);
    ok=document.execCommand('copy');t.remove()}catch(e){}
  if(ok){toast('Copiado ✔');return}
  /* 2º jeito: área de transferência do navegador */
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast('Copiado ✔')).catch(()=>selecionar(el))}
  else selecionar(el);
}
function selecionar(el){
  if(el){el.focus();if(el.select)el.select();else{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}}
  toast('Não deu para copiar sozinho. Toque e segure no texto para copiar');
}

const CAT0=[
 ['s','Visita técnica / avaliação','un',80],['s','Ponto de tomada novo','un',45],['s','Ponto de interruptor novo','un',45],
 ['s','Ponto de luz novo','un',50],['s','Troca de tomada ou interruptor','un',25],['s','Instalação de luminária / plafon','un',50],
 ['s','Instalação de ventilador de teto','un',120],['s','Instalação de chuveiro','un',90],['s','Troca de resistência de chuveiro','un',50],
 ['s','Ponto para ar-condicionado','un',150],['s','Troca de disjuntor','un',40],['s','Montagem de quadro de distribuição','un',350],
 ['s','Instalação de padrão de entrada','un',900],['s','Passagem de fiação','m',6],['s','Instalação de eletroduto','m',8],
 ['s','Instalação de DR / DPS','un',60],['s','Aterramento','un',250],['s','Mão de obra (diária)','un',300],
 ['m','Cabo flexível 1,5 mm²','m',2.5],['m','Cabo flexível 2,5 mm²','m',3.5],['m','Cabo flexível 4 mm²','m',5.5],
 ['m','Cabo flexível 6 mm²','m',8],['m','Cabo flexível 10 mm²','m',13],['m','Disjuntor monopolar','un',18],
 ['m','Disjuntor bipolar','un',60],['m','Disjuntor DR','un',180],['m','DPS','un',70],['m','Tomada 10A','un',15],
 ['m','Tomada 20A','un',18],['m','Interruptor simples','un',14],['m','Interruptor paralelo','un',20],['m','Caixa 4x2','un',3],
 ['m','Eletroduto corrugado 3/4"','m',2.5],['m','Quadro para 12 disjuntores','un',90],['m','Haste de aterramento','un',45],
 ['m','Fita isolante','un',8],['m','Conector / emenda (cx)','cx',15],
 ['s','Passagem de cabo','m',7],['s','Passagem de cabo subterrâneo (vala)','m',15],['s','Passagem de cabo por eletroduto existente','m',5],
 ['s','Limpeza de placa solar','un',15],['s','Inspeção do sistema solar','un',80],['s','Deslocamento','un',30],
 ['s','Taxa da ART / TRT (valor da guia)','un',0]
].map((a,i)=>({id:'c'+i,tipo:a[0],nome:a[1],un:a[2],preco:a[3]}));

let cat=LS.get('oe_cat',null)||JSON.parse(JSON.stringify(CAT0));
/* itens novos da tabela padrão entram também para quem já usa o app */
(function(){const conhecidos=LS.get('oe_conhecidos',null);const ids=new Set(cat.map(c=>c.id));
  CAT0.forEach(c=>{if(!ids.has(c.id)&&(!conhecidos||!conhecidos.includes(c.id))&&(conhecidos||+c.id.slice(1)>=37))cat.push({...c})});
  LS.set('oe_cat',cat);LS.set('oe_conhecidos',CAT0.map(c=>c.id));})();
let orcs=LS.get('oe_orcs',[]);
let eu=LS.get('oe_eu',{nome:'',tel:'',doc:'',cid:'Tatuí - SP',val:15});
let cur,fCat='t',fMod='t',fSt='Todos',avParaTabela=false,exemplo=false;

function novo(){return{id:Date.now(),num:0,cliente:'',tel:'',end:'',tipo:'Instalação nova',data:hoje(),val:eu.val||15,prazo:'',pag:'',obs:'',desc:'',descTipo:'%',itens:[],status:'Pendente'}}
function exemploOrc(){
  const o=novo();Object.assign(o,{cliente:'Exemplo: Maria da Silva',end:'Rua Exemplo, 100 - Centro',tipo:'Reforma',prazo:'2 dias',pag:'50% na entrada, 50% ao terminar',desc:'5'});
  const add=(id,q)=>{const c=CAT0.find(x=>x.id===id);o.itens.push({cid:c.id,tipo:c.tipo,nome:c.nome,un:c.un,preco:c.preco,qtd:q})};
  add('c1',4);add('c3',3);add('c7',1);add('c19',40);add('c27',4);add('c25',1);return o;
}

const campos={cliente:'f-cliente',tel:'f-tel',end:'f-end',tipo:'f-tipo',data:'f-data',val:'f-val',prazo:'f-prazo',pag:'f-pag',obs:'f-obs',desc:'f-desc',descTipo:'f-desctipo'};
function preencher(){abertoIx=null;$('#f-art').checked=!!cur.art;$('#f-artn').value=cur.artn||'';$('#art-box').hidden=!cur.art;for(const k in campos)$('#'+campos[k]).value=cur[k]??'';$('#tit').textContent=cur.num?'Orçamento nº '+cur.num:'Novo orçamento';$('#aviso-ex').hidden=!exemplo;renderItens()}
for(const k in campos){const el=$('#'+campos[k]);const f=()=>{cur[k]=el.value;renderTot()};el.addEventListener('input',f);el.addEventListener('change',f)}

$('#f-art').addEventListener('change',e=>{cur.art=e.target.checked;$('#art-box').hidden=!cur.art});
$('#f-artn').addEventListener('input',e=>cur.artn=e.target.value);
const respTec=()=>[eu.nome,eu.tit,eu.crea].filter(Boolean).join(' · ');
function calc(o){
  let s=0,m=0;o.itens.forEach(i=>{const v=num(i.qtd)*num(i.preco);i.tipo==='s'?s+=v:m+=v});
  const sub=s+m;let d=num(o.desc);d=o.descTipo==='%'?sub*d/100:d;d=Math.max(0,Math.min(d,sub));
  return{s,m,sub,d,total:sub-d};
}
let abertoIx=null,abertoCat=null;
const fq=(q,un)=>String(num(q)).replace('.',',')+' '+un;
function renderItens(){
  const box=$('#itens');
  if(!cur.itens.length){box.innerHTML='<div class="empty">Nenhum item ainda. Toque em “Da tabela” para escolher.</div>';renderTot();return}
  box.innerHTML='<p class="hint" style="margin-bottom:2px">Toque num item para mudar quantidade ou preço.</p>'+cur.itens.map((i,ix)=>{const op=abertoIx===ix;
    return`<div class="li ${i.tipo==='m'?'m':'s'} ${op?'open':''}">
    <button class="lh" aria-expanded="${op}" onclick="toggleItem(${ix})"><span class="lq" id="lq${ix}">${fq(i.qtd,esc(i.un))}</span><span class="ln">${esc(i.nome)}</span><span class="lv" id="st${ix}">${brl(num(i.qtd)*num(i.preco))}</span><span class="chev">›</span></button>
    ${op?`<div class="lbx">
      <div class="r"><button class="qb" aria-label="Tirar um" onclick="passo(${ix},-1)">−</button><input id="q${ix}" aria-label="Quantidade" type="number" inputmode="decimal" value="${esc(i.qtd)}" oninput="setItem(${ix},'qtd',this.value)" onfocus="this.select()" style="width:70px;flex:none;text-align:center"><button class="qb add" aria-label="Pôr mais um" onclick="passo(${ix},1)">＋</button><span class="un">${esc(i.un)}</span></div>
      <div class="r">✏️ R$<input id="p${ix}" aria-label="Preço" type="number" inputmode="decimal" value="${esc(i.preco)}" oninput="setItem(${ix},'preco',this.value)" onfocus="this.select()"><span class="un">cada</span></div>
      <div class="r" style="justify-content:space-between"><span class="tag ${i.tipo==='m'?'m':''}" style="margin:0">${i.tipo==='m'?'Material':'Serviço'}</span><button class="btn sm red" onclick="delItem(${ix})">Remover item</button></div>
    </div>`:''}</div>`}).join('');
  renderTot();
}
function toggleItem(ix){abertoIx=abertoIx===ix?null:ix;renderItens()}
function setItem(ix,k,v){cur.itens[ix][k]=v;const i=cur.itens[ix];$('#st'+ix).textContent=brl(num(i.qtd)*num(i.preco));$('#lq'+ix).textContent=fq(i.qtd,i.un);renderTot()}
function passo(ix,d){const q=num(cur.itens[ix].qtd)+d;if(q<=0){cur.itens.splice(ix,1);abertoIx=null}else cur.itens[ix].qtd=q;renderItens()}
function delItem(ix){cur.itens.splice(ix,1);abertoIx=null;renderItens()}
function renderTot(){
  const c=calc(cur);
  $('#tot').innerHTML=`<div><span>Serviços (mão de obra)</span><span>${brl(c.s)}</span></div>
  <div><span>Materiais</span><span>${brl(c.m)}</span></div>
  <div><span>Subtotal</span><span>${brl(c.sub)}</span></div>
  ${c.d?`<div class="d"><span>Desconto</span><span>− ${brl(c.d)}</span></div>`:''}
  <div class="g"><span>TOTAL</span><span>${brl(c.total)}</span></div>`;
}
function limpar(){
  const go=()=>{exemplo=false;cur=novo();preencher();scrollTo(0,0)};
  if(cur.itens.length&&!cur.num&&!exemplo)perguntar('Descartar o orçamento que está sendo montado?',go);else go();
}
function salvar(){
  if(exemplo){toast('Este é o exemplo. Toque em ＋ Novo para criar o seu');return}
  if(!cur.cliente.trim()){toast('Informe o nome do cliente');$('#f-cliente').focus();return}
  if(!cur.itens.length){toast('Adicione pelo menos um item');return}
  if(!cur.num){cur.num=LS.get('oe_num',0)+1;LS.set('oe_num',cur.num)}
  const ix=orcs.findIndex(o=>o.id===cur.id),copia=JSON.parse(JSON.stringify(cur));
  ix>=0?orcs[ix]=copia:orcs.unshift(copia);
  LS.set('oe_orcs',orcs);$('#tit').textContent='Orçamento nº '+cur.num;toast('Orçamento nº '+cur.num+' salvo ✔');
}

function chips(el,val,fn){el.innerHTML=[['t','Todos'],['s','Serviços'],['m','Materiais']].map(([k,n])=>`<button class="chip ${val===k?'on':''}" onclick="${fn}('${k}')">${n}</button>`).join('')}
function abrirCat(){editId=null;$('#m-busca').value='';$('#m-cat').classList.add('on');renderModalCat()}
function setFMod(k){fMod=k;renderModalCat()}
function renderModalCat(){
  chips($('#m-f'),fMod,'setFMod');
  const q=$('#m-busca').value.toLowerCase();
  const l=cat.filter(c=>(fMod==='t'||c.tipo===fMod)&&c.nome.toLowerCase().includes(q));
  $('#m-list').innerHTML=l.map(c=>{const ex=cur.itens.find(i=>i.cid===c.id);const n=ex?num(ex.qtd):0;
    const p=ex?num(ex.preco):num(c.preco),dif=ex&&p!==num(c.preco);
    const ctrl=n?`<button class="qb" aria-label="Tirar um" onclick="menos('${c.id}')">−</button><input class="qin" id="mq-${c.id}" type="number" inputmode="decimal" aria-label="Quantidade em ${esc(c.un)}" value="${n}" oninput="qtdModal('${c.id}',this.value)" onchange="if(num(this.value)<=0)qtdModal('${c.id}',0,true)" onfocus="this.select()"><button class="qb add" aria-label="Pôr mais um" onclick="addCat('${c.id}')">＋</button>`
               :`<button class="qb add" aria-label="Adicionar" onclick="addCat('${c.id}')">＋</button>`;
    const ed=editId===c.id?`<div class="ped"><label for="pe-in" style="margin-top:0">Novo preço para ${esc(c.nome)} (R$ / ${esc(c.un)})</label>
      <input id="pe-in" type="number" inputmode="decimal" value="${p}">
      <div class="row"><button class="btn" onclick="precoSo('${c.id}')">Só neste orçamento</button><button class="btn dk" onclick="precoTabela('${c.id}')">Salvar na tabela</button></div>
      <button class="btn sec" style="margin-top:8px;padding:8px" onclick="editId=null;renderModalCat()">Cancelar</button></div>`:'';
    return`<div class="cat"><div class="ci">${esc(c.nome)}<span class="tag ${c.tipo==='m'?'m':''}">${c.tipo==='m'?'Mat':'Serv'}</span><br><small class="${dif?'dif':''}">${brl(p)} / ${esc(c.un)}${dif?' (tabela '+brl(c.preco)+')':''}</small><button class="pen" aria-label="Editar preço" onclick="editarPreco('${c.id}')">✏️ preço</button></div><div class="qty">${ctrl}</div></div>${ed}`}).join('')||'<div class="empty">Nada encontrado</div>';
  if(editId){const i=$('#pe-in');if(i){i.focus();i.select()}}
}
let editId=null;
function editarPreco(id){editId=editId===id?null:id;renderModalCat()}
function addCat(id){
  const c=cat.find(x=>x.id===id),ex=cur.itens.find(i=>i.cid===id);
  if(ex)ex.qtd=num(ex.qtd)+1;else cur.itens.push({cid:c.id,tipo:c.tipo,nome:c.nome,un:c.un,preco:c.preco,qtd:1});
  renderItens();renderModalCat();
}
function qtdModal(id,v,remover){
  const ix=cur.itens.findIndex(i=>i.cid===id);if(ix<0)return;
  if(remover){cur.itens.splice(ix,1);renderItens();renderModalCat();return}
  if(v!=='')cur.itens[ix].qtd=v;renderItens();
}
function menos(id){
  const ix=cur.itens.findIndex(i=>i.cid===id);if(ix<0)return;
  const q=num(cur.itens[ix].qtd)-1;if(q<=0)cur.itens.splice(ix,1);else cur.itens[ix].qtd=q;
  renderItens();renderModalCat();
}
function precoSo(id){
  const v=num($('#pe-in').value),c=cat.find(x=>x.id===id),ex=cur.itens.find(i=>i.cid===id);
  if(ex)ex.preco=v;else cur.itens.push({cid:c.id,tipo:c.tipo,nome:c.nome,un:c.un,preco:v,qtd:1});
  editId=null;renderItens();renderModalCat();toast('Preço alterado só neste orçamento');
}
function precoTabela(id){
  const v=num($('#pe-in').value),c=cat.find(x=>x.id===id),ex=cur.itens.find(i=>i.cid===id);
  c.preco=v;LS.set('oe_cat',cat);if(ex)ex.preco=v;
  editId=null;renderItens();renderModalCat();toast('Preço salvo na tabela');
}
function abrirAvulso(tab){avParaTabela=!!tab;$('#av-tit').textContent=tab?'Novo item da tabela':'Item avulso';$('#a-qbox').hidden=!!tab;$('#a-nome').value='';$('#a-preco').value='';$('#a-qtd').value=1;$('#m-av').classList.add('on')}
function addAvulso(){
  const nome=$('#a-nome').value.trim(),preco=num($('#a-preco').value);
  if(!nome){toast('Escreva a descrição do item');return}
  const it={tipo:$('#a-tipo').value,nome,un:$('#a-un').value,preco};
  if(avParaTabela){cat.push({id:'u'+Date.now(),...it});LS.set('oe_cat',cat);renderCatEdit()}
  else{cur.itens.push({...it,qtd:num($('#a-qtd').value)||1});renderItens()}
  fechar();toast('Adicionado ✔');
}
function fechar(){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('on'))}

function setFCat(k){fCat=k;renderCatEdit()}
function renderCatEdit(){
  chips($('#fcat'),fCat,'setFCat');
  const q=($('#cbusca').value||'').toLowerCase();
  $('#catlist').innerHTML=cat.map((c,ix)=>{
    if(!((fCat==='t'||c.tipo===fCat)&&c.nome.toLowerCase().includes(q)))return'';
    const ex=cur.itens.find(i=>i.cid===c.id),op=abertoCat===c.id;
    return`<div class="li ${c.tipo==='m'?'m':'s'} ${op?'open':''}">
    <button class="lh" aria-expanded="${op}" onclick="toggleCat('${c.id}')"><span class="ln">${esc(c.nome)}${ex?`<span class="noorc">✔ ${fq(ex.qtd,esc(c.un))} no orçamento</span>`:''}</span><span class="lv">${brl(c.preco)}<small>/${esc(c.un)}</small></span><span class="chev">›</span></button>
    ${op?`<div class="lbx">
      <div class="r"><span class="lb">Preço</span>R$<input id="cp${ix}" type="number" inputmode="decimal" value="${esc(c.preco)}" onfocus="this.select()" oninput="$('#cs${ix}').classList.toggle('mud',num(this.value)!==num(cat[${ix}].preco))" aria-label="Preço"><span class="un">/ ${esc(c.un)}</span><span style="flex:1"></span><button class="ib" id="cs${ix}" aria-label="Salvar preço" onclick="salvarPreco(${ix})">💾</button></div>
      <div class="r"><span class="lb">Qtd</span><input id="cq${ix}" type="number" inputmode="decimal" placeholder="0" aria-label="Quantidade" style="width:78px;flex:none;text-align:center"><span class="un">${esc(c.un)}</span><span style="flex:1"></span><button class="ib ok" aria-label="Pôr no orçamento" onclick="porOrc(${ix})">✔</button></div>
      <div class="r" style="justify-content:space-between"><span class="tag ${c.tipo==='m'?'m':''}" style="margin:0">${c.tipo==='m'?'Material':'Serviço'}</span><button class="btn sm red" onclick="perguntar('Remover este item da tabela?',()=>delCat(${ix}))">Remover da tabela</button></div>
    </div>`:''}</div>`}).join('')||'<div class="empty">Nada encontrado</div>';
}
function toggleCat(id){abertoCat=abertoCat===id?null:id;renderCatEdit();if(abertoCat){const i=document.querySelector('.li.open input');if(i)setTimeout(()=>i.scrollIntoView({block:'nearest',behavior:'smooth'}),30)}}
function salvarPreco(ix){cat[ix].preco=num($('#cp'+ix).value);LS.set('oe_cat',cat);$('#cs'+ix).classList.remove('mud');toast('Preço salvo ✔')}
function porOrc(ix){
  const q=num($('#cq'+ix).value);if(q<=0){toast('Digite a quantidade primeiro');$('#cq'+ix).focus();return}
  const c=cat[ix];
  if(num($('#cp'+ix).value)!==num(c.preco))salvarPreco(ix);
  if(exemplo){exemplo=false;cur=novo();preencher()}
  const ex=cur.itens.find(i=>i.cid===c.id);
  if(ex)ex.qtd=num(ex.qtd)+q;else cur.itens.push({cid:c.id,tipo:c.tipo,nome:c.nome,un:c.un,preco:c.preco,qtd:q});
  renderItens();renderCatEdit();toast(String(q).replace('.',',')+' '+c.un+' de '+c.nome+' no orçamento ✔');
}
function delCat(ix){cat.splice(ix,1);LS.set('oe_cat',cat);renderCatEdit()}
function restaurar(){cat=JSON.parse(JSON.stringify(CAT0));LS.set('oe_cat',cat);renderCatEdit();toast('Tabela restaurada')}

const STS=['Pendente','Aprovado','Recusado','Concluído'];
const COR={Pendente:'var(--stP)',Aprovado:'var(--stA)',Recusado:'var(--stR)','Concluído':'var(--stC)'};
function setFSt(s){fSt=s;renderSalvos()}
function renderSalvos(){
  $('#fst').innerHTML=['Todos',...STS].map(s=>`<button class="chip ${fSt===s?'on':''}" onclick="setFSt('${s}')">${s}</button>`).join('');
  const q=$('#busca').value.toLowerCase();
  const l=orcs.filter(o=>(fSt==='Todos'||o.status===fSt)&&(o.cliente.toLowerCase().includes(q)||String(o.num).includes(q)));
  const ap=orcs.filter(o=>o.status==='Aprovado'||o.status==='Concluído').reduce((a,o)=>a+calc(o).total,0);
  $('#resumo').textContent=`${orcs.length} orçamento(s) · Aprovados e concluídos: ${brl(ap)}`;
  $('#lista').innerHTML=l.map(o=>`<div class="card"><div class="oc"><div><b>Nº ${o.num} · ${esc(o.cliente)}</b><small>${dataBR(o.data)} · ${esc(o.tipo)}</small><small>${o.itens.length} item(ns)</small></div>
   <div style="text-align:right"><div class="v">${brl(calc(o).total)}</div><select class="st" aria-label="Situação" style="background:${COR[o.status]}" onchange="setSt(${o.id},this.value)">${STS.map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></div></div>
   <div class="acts"><button class="btn sm" onclick="abrir(${o.id})">Abrir</button><button class="btn sm wa" onclick="enviar(achar(${o.id}))">Enviar</button><button class="btn sm sec" onclick="duplicar(${o.id})">Duplicar</button><button class="btn sm red" onclick="perguntar('Excluir o orçamento nº ${o.num}?',()=>excluir(${o.id}))">Excluir</button></div></div>`).join('')||'<div class="card empty">Nenhum orçamento salvo ainda.</div>';
}
const achar=id=>orcs.find(o=>o.id===id);
function setSt(id,s){achar(id).status=s;LS.set('oe_orcs',orcs);if(cur.id===id)cur.status=s;renderSalvos()}
function abrir(id){exemplo=false;cur=JSON.parse(JSON.stringify(achar(id)));preencher();ir('novo')}
function duplicar(id){exemplo=false;cur=JSON.parse(JSON.stringify(achar(id)));cur.id=Date.now();cur.num=0;cur.data=hoje();cur.status='Pendente';preencher();ir('novo');toast('Cópia criada. Salve para gerar um novo nº')}
function excluir(id){orcs=orcs.filter(x=>x.id!==id);LS.set('oe_orcs',orcs);renderSalvos();toast('Excluído')}

function texto(o){
  const c=calc(o),L=[];
  L.push(`*ORÇAMENTO${o.num?' Nº '+o.num:''} — SERVIÇOS ELÉTRICOS*`);
  if(eu.nome)L.push(`${eu.nome}${eu.tit?' · '+eu.tit:''}${eu.crea?' · '+eu.crea:''}${eu.tel?' · '+eu.tel:''}`);
  L.push('',`*Cliente:* ${o.cliente}`);if(o.end)L.push(`*Endereço:* ${o.end}`);
  L.push(`*Data:* ${dataBR(o.data)} · ${o.tipo}`);
  if(o.art)L.push(`*Serviço com ART/TRT*${o.artn?' nº '+o.artn:''}${respTec()?' · Resp. técnico: '+respTec():''}`);
  const bloco=(t,n)=>{const it=o.itens.filter(i=>i.tipo===t);if(!it.length)return;L.push('',`*${n}*`);it.forEach(i=>L.push(`• ${String(i.qtd).replace('.',',')} ${i.un} ${i.nome} — ${brl(num(i.qtd)*num(i.preco))}`))};
  bloco('s','Serviços');bloco('m','Materiais');
  L.push('',`Serviços: ${brl(c.s)}`,`Materiais: ${brl(c.m)}`);
  if(c.d)L.push(`Desconto: − ${brl(c.d)}`);
  L.push(`*TOTAL: ${brl(c.total)}*`,'');
  if(o.prazo)L.push(`Prazo de execução: ${o.prazo}`);
  if(o.pag)L.push(`Pagamento: ${o.pag}`);
  L.push(`Validade do orçamento: ${o.val||15} dias`);
  if(o.obs)L.push(`Obs.: ${o.obs}`);
  return L.join('\n');
}
let envOrc=null;
function enviar(o){
  if(!o.itens.length){toast('Adicione itens primeiro');return}
  envOrc=JSON.parse(JSON.stringify(o));
  const t=texto(o);$('#env-txt').textContent=t;
  let tel=String(o.tel||'').replace(/\D/g,'');if(tel&&tel.length<=11)tel='55'+tel;
  $('#env-wa').href='https://wa.me/'+tel+'?text='+encodeURIComponent(t);
  $('#m-env').classList.add('on');
}
function copiarEnvio(){copiar($('#env-txt').textContent,$('#env-txt'))}

/* ---------- Arquivos: PDF e CSV ---------- */
let dl=null;
document.querySelectorAll('.dl').forEach(e=>e.hidden=false);
const nomeArq=o=>('orcamento-'+(o.num||'novo')+'-'+(o.cliente||'cliente')).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w-]+/g,'-').replace(/-+/g,'-').toLowerCase().slice(0,60);
async function salvarArq(filename,data){
  const tipo=filename.endsWith('.pdf')?'application/pdf':'text/csv';
  const blob=data instanceof Blob?data:new Blob([data],{type:tipo+';charset=utf-8'});
  try{const f=new File([blob],filename,{type:tipo});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:filename});return}
  }catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);toast('Arquivo salvo em Downloads');
}
const nCSV=v=>String(Math.round(num(v)*100)/100).replace('.',',');
const cCSV=v=>{const s=String(v??'');return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
function linhasCSV(lista){
  const L=[['Nº','Data','Cliente','Telefone','Endereço','Tipo','Situação','Item','Categoria','Unidade','Qtd','Preço unit.','Subtotal do item','Desconto do orçamento','Total do orçamento']];
  lista.forEach(o=>{const c=calc(o);o.itens.forEach(i=>L.push([o.num||'',dataBR(o.data),o.cliente,o.tel,o.end,o.tipo,o.status,i.nome,i.tipo==='m'?'Material':'Serviço',i.un,nCSV(i.qtd),nCSV(i.preco),nCSV(num(i.qtd)*num(i.preco)),nCSV(c.d),nCSV(c.total)]))});
  return '﻿'+L.map(r=>r.map(cCSV).join(';')).join('\r\n');
}
function compartilharCSV(){if(envOrc)salvarArq(nomeArq(envOrc)+'.csv',linhasCSV([envOrc]))}
function csvTodos(){if(!orcs.length){toast('Nenhum orçamento salvo ainda');return}salvarArq('orcamentos-'+hoje()+'.csv',linhasCSV(orcs))}

function pdfTxt(s){return String(s??'').replace(/[  ]/g,' ').replace(/[—–−]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'")}
function gerarPDF(o){
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});const c=calc(o);
  const W=210,M=15;let y=0;
  const T=(t,x,yy,op)=>doc.text(pdfTxt(t),x,yy,op);
  const quebra=h=>{if(y+h>280){doc.addPage();y=18}};
  doc.setFillColor(20,32,43);doc.rect(0,0,W,30,'F');doc.setFillColor(242,165,22);doc.rect(0,30,W,1.5,'F');
  doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(17);T('ORÇAMENTO'+(o.num?' Nº '+o.num:'')+' - SERVIÇOS ELÉTRICOS',M,13);
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);T([eu.nome,eu.tit,eu.crea,eu.doc,eu.tel,eu.cid].filter(Boolean).join('  ·  ')||' ',M,21);
  doc.setTextColor(20,32,43);y=42;doc.setFontSize(10.5);
  const campo=(r,v)=>{if(!v)return;doc.setFont('helvetica','bold');T(r,M,y);doc.setFont('helvetica','normal');const l=doc.splitTextToSize(pdfTxt(v),W-2*M-28);doc.text(l,M+28,y);y+=l.length*5+1};
  campo('Cliente:',o.cliente+(o.tel?'  ·  '+o.tel:''));campo('Endereço:',o.end);campo('Data:',dataBR(o.data)+'  ·  '+o.tipo);if(o.art)campo('ART/TRT:',(o.artn?'nº '+o.artn:'a emitir')+(respTec()?'  ·  Resp. técnico: '+respTec():''));
  const tabela=(t,n)=>{const it=o.itens.filter(i=>i.tipo===t);if(!it.length)return;
    y+=4;quebra(16);doc.setFont('helvetica','bold');doc.setFontSize(11);T(n,M,y);y+=3;
    doc.setFillColor(238,241,244);doc.rect(M,y,W-2*M,7,'F');doc.setFontSize(9);
    T('Descrição',M+2,y+5);T('Qtd',125,y+5,{align:'right'});T('Unit.',158,y+5,{align:'right'});T('Total',W-M-2,y+5,{align:'right'});y+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(9.5);
    it.forEach(i=>{const l=doc.splitTextToSize(pdfTxt(i.nome),92);const h=l.length*4.6+3;quebra(h);
      doc.text(l,M+2,y+5);T(String(i.qtd).replace('.',',')+' '+i.un,125,y+5,{align:'right'});T(brl(i.preco),158,y+5,{align:'right'});T(brl(num(i.qtd)*num(i.preco)),W-M-2,y+5,{align:'right'});
      y+=h;doc.setDrawColor(221,227,233);doc.line(M,y,W-M,y)});
  };
  tabela('s','Serviços (mão de obra)');tabela('m','Materiais');
  y+=6;quebra(34);doc.setFontSize(10);
  const tl=(r,v,b)=>{doc.setFont('helvetica',b?'bold':'normal');T(r,125,y);T(v,W-M-2,y,{align:'right'});y+=5.5};
  tl('Serviços',brl(c.s));tl('Materiais',brl(c.m));if(c.d)tl('Desconto','- '+brl(c.d));
  doc.setDrawColor(242,165,22);doc.setLineWidth(.6);doc.line(125,y-2,W-M,y-2);doc.setLineWidth(.2);y+=3;doc.setFontSize(13);tl('TOTAL',brl(c.total),true);
  y+=4;doc.setFontSize(10);
  [['Prazo de execução:',o.prazo],['Pagamento:',o.pag],['Validade:',(o.val||15)+' dias'],['Observações:',o.obs]].forEach(([r,v])=>{if(!v)return;quebra(10);doc.setFont('helvetica','bold');T(r,M,y);doc.setFont('helvetica','normal');const l=doc.splitTextToSize(pdfTxt(v),W-2*M-38);doc.text(l,M+38,y);y+=l.length*5+1});
  y+=18;quebra(14);doc.setDrawColor(120);doc.line(M,y,M+75,y);y+=5;T(eu.nome||'Responsável',M,y);
  const np=doc.getNumberOfPages();
  for(let pg=1;pg<=np;pg++){doc.setPage(pg);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(120);
    T('Dados do cliente usados somente para este orçamento, conforme a LGPD (Lei nº 13.709/2018).',W/2,290,{align:'center'})}
  return doc.output('blob');
}
function gerarDeclaracao(o){
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,M=20;let y=0;const T=(t,x,yy,op)=>doc.text(pdfTxt(t),x,yy,op);
  const par=(t,sz=11,st='normal',gap=2)=>{doc.setFont('helvetica',st);doc.setFontSize(sz);const l=doc.splitTextToSize(pdfTxt(t),W-2*M);if(y+l.length*5.2>270){doc.addPage();y=20}doc.text(l,M,y);y+=l.length*5.2+gap};
  doc.setFillColor(20,32,43);doc.rect(0,0,W,24,'F');doc.setFillColor(242,165,22);doc.rect(0,24,W,1.5,'F');
  doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(15);T('DECLARAÇÃO DE SERVIÇO ELÉTRICO EXECUTADO',W/2,15,{align:'center'});
  doc.setTextColor(20,32,43);y=40;
  const quem=(eu.nome||'_______________________________')+(eu.tit?', '+eu.tit:'')+(eu.crea?', registro '+eu.crea:'')+(eu.doc?', CPF/CNPJ '+eu.doc:'');
  par(`Eu, ${quem}, declaro que executei os serviços elétricos relacionados abaixo para ${o.cliente||'_______________________________'}${o.end?', no imóvel situado em '+o.end:''}, seguindo as normas técnicas aplicáveis, em especial a ABNT NBR 5410 (instalações elétricas de baixa tensão), e as exigências da concessionária de energia, quando for o caso.`,11,'normal',6);
  par('Serviços executados:',11,'bold',1);
  o.itens.filter(i=>i.tipo==='s'&&!/ART|TRT/.test(i.nome)).forEach(i=>par('-  '+String(i.qtd).replace('.',',')+' '+i.un+'  '+i.nome,10.5,'normal',0.5));
  const mats=o.itens.filter(i=>i.tipo==='m');
  if(mats.length){y+=4;par('Principais materiais utilizados:',11,'bold',1);mats.forEach(i=>par('-  '+String(i.qtd).replace('.',',')+' '+i.un+'  '+i.nome,10.5,'normal',0.5))}
  y+=6;
  par('ART / TRT nº: '+(o.artn||'______________________')+'          Orçamento nº: '+(o.num||'____'),11,'normal',2);
  par('Data de conclusão: ____ / ____ / ________',11,'normal',2);
  if(o.obs)par('Observações: '+o.obs,10.5,'normal',2);
  y+=4;par('O responsável se coloca à disposição para esclarecimentos sobre os serviços aqui descritos.',10.5,'normal',4);
  par((eu.cid||'______________')+', '+new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})+'.',11,'normal',4);
  if(y>235){doc.addPage();y=30}
  y=Math.max(y+18,230);doc.setDrawColor(90);doc.line(M,y,M+75,y);doc.line(W-M-75,y,W-M,y);
  doc.setFontSize(9.5);doc.setFont('helvetica','normal');
  T(eu.nome||'Responsável técnico',M,y+5);T([eu.tit,eu.crea].filter(Boolean).join(' · ')||'Título e registro',M,y+10);
  T(o.cliente||'Cliente',W-M-75,y+5);T('Cliente (ciente do serviço)',W-M-75,y+10);
  doc.setFontSize(7.5);doc.setTextColor(120);
  T('Este documento não substitui a ART (CREA) ou a TRT (CFT), que são emitidas somente nos sistemas oficiais desses conselhos.',W/2,284,{align:'center'});
  T('Dados do cliente usados somente para este serviço, conforme a LGPD (Lei nº 13.709/2018).',W/2,289,{align:'center'});
  return doc.output('blob');
}
/* ---------- Prévia da ART ---------- */
const MODELOS0=[
 {nome:'Padrão de entrada',tipo:'Execução',qtd:1,un:'un',txt:'Execução de padrão de entrada de energia elétrica em baixa tensão, conforme normas da concessionária local e ABNT NBR 5410, incluindo caixa de medição, disjuntor geral, aterramento e ramal de entrada.'},
 {nome:'Instalação elétrica residencial',tipo:'Execução',qtd:1,un:'un',txt:'Execução de instalação elétrica de baixa tensão em edificação residencial, incluindo circuitos de iluminação e tomadas, quadro de distribuição com dispositivos de proteção (DR e DPS) e aterramento, conforme ABNT NBR 5410.'},
 {nome:'Reforma / adequação',tipo:'Execução',qtd:1,un:'un',txt:'Reforma e adequação de instalação elétrica de baixa tensão existente, com substituição de condutores, dispositivos de proteção e quadro de distribuição, conforme ABNT NBR 5410.'},
 {nome:'Sistema fotovoltaico',tipo:'Execução',qtd:1,un:'kWp',txt:'Instalação de sistema de microgeração solar fotovoltaica conectado à rede, incluindo módulos, inversor, proteções em corrente contínua e alternada e aterramento, conforme ABNT NBR 16690 e normas da concessionária local.'},
 {nome:'Manutenção',tipo:'Manutenção',qtd:1,un:'un',txt:'Manutenção corretiva de instalação elétrica de baixa tensão, com inspeção, substituição de componentes danificados e testes de funcionamento, conforme ABNT NBR 5410.'}
];
let modelos=LS.get('oe_art_modelos',null)||JSON.parse(JSON.stringify(MODELOS0));
const TIPOS=['Execução','Projeto','Projeto e execução','Manutenção','Laudo / vistoria'];
const CAMPOS=[ // [chave,rótulo,tipo,onde]
 ['ativ','Descrição da atividade','area','f'],
 ['h1','Contratante','h'],
 ['cliente','Nome do contratante','text','c'],['cpf','CPF / CNPJ do contratante','text','f'],
 ['end','Endereço da obra','text','c'],['cidade','Cidade','text','f'],['cep','CEP','text','f'],
 ['h2','Serviço','h'],
 ['tipo','Atividade técnica','sel','f'],['qtd','Quantidade','text','f'],['un','Unidade','text','f'],
 ['valor','Valor do contrato (do orçamento)','ro','x'],['inicio','Data de início','date','f'],['fim','Previsão de término','date','f'],
 ['h3','Depois de registrar no CREA','h'],
 ['artn','Nº da ART / TRT','text','c']
];
function fichaDe(o){
  if(!o.ficha){const m=modelos[0]||MODELOS0[0];o.ficha={mod:0,ativ:m.txt,tipo:m.tipo,qtd:String(m.qtd),un:m.un,cpf:'',cidade:eu.cid||'',cep:'',inicio:hoje(),fim:''}}
  return o.ficha;
}
function valFicha(k){const f=fichaDe(cur);if(k==='valor')return brl(calc(cur).total);if(k==='inicio'||k==='fim')return f[k]?dataBR(f[k]):'';return k==='cliente'||k==='end'||k==='artn'?(cur[k]||''):(f[k]||'')}
function abrirFicha(){
  const f=fichaDe(cur);
  $('#a-mod').innerHTML=modelos.map((m,i)=>`<option value="${i}" ${i==f.mod?'selected':''}>${esc(m.nome)}</option>`).join('');
  $('#art-campos').innerHTML=CAMPOS.map(([k,r,t,w])=>{
    if(t==='h')return`<h3 class="sh">${r}</h3>`;
    const v=w==='c'?(cur[k]||''):w==='x'?'':(f[k]||'');
    const ctl=t==='area'?`<textarea id="af-${k}" rows="5">${esc(v)}</textarea>`
      :t==='sel'?`<select id="af-${k}">${TIPOS.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select>`
      :t==='ro'?`<input id="af-${k}" value="${esc(brl(calc(cur).total))}" readonly>`
      :`<input id="af-${k}" type="${t==='date'?'date':'text'}" ${k==='cpf'||k==='cep'||k==='qtd'?'inputmode="numeric"':''} value="${esc(v)}">`;
    return`<div class="fc"><label for="af-${k}"><span>${r}</span><button class="cpb" type="button" onclick="copiar(valFicha('${k}'))">Copiar</button></label>${ctl}</div>`}).join('');
  CAMPOS.forEach(([k,,t,w])=>{if(t==='h'||t==='ro')return;const el=$('#af-'+k);const f2=()=>{if(w==='c'){cur[k]=el.value;if(k==='artn')$('#f-artn').value=el.value;if(k==='cliente')$('#f-cliente').value=el.value;if(k==='end')$('#f-end').value=el.value}else fichaDe(cur)[k]=el.value};el.addEventListener('input',f2);el.addEventListener('change',f2)});
  fechar();$('#a-nmbox').hidden=true;$('#m-art').classList.add('on');
}
function trocarModelo(){const i=+$('#a-mod').value,m=modelos[i],f=fichaDe(cur);f.mod=i;f.ativ=m.txt;f.tipo=m.tipo;f.qtd=String(m.qtd);f.un=m.un;
  $('#af-ativ').value=m.txt;$('#af-tipo').value=m.tipo;$('#af-qtd').value=m.qtd;$('#af-un').value=m.un}
function salvarModelo(){const i=+$('#a-mod').value,f=fichaDe(cur);Object.assign(modelos[i],{txt:f.ativ,tipo:f.tipo,qtd:f.qtd,un:f.un});LS.set('oe_art_modelos',modelos);toast('Modelo "'+modelos[i].nome+'" atualizado ✔')}
function novoModelo(){const n=$('#a-nm').value.trim();if(!n){toast('Dê um nome ao modelo');return}const f=fichaDe(cur);
  modelos.push({nome:n,txt:f.ativ,tipo:f.tipo,qtd:f.qtd,un:f.un});LS.set('oe_art_modelos',modelos);f.mod=modelos.length-1;$('#a-nm').value='';abrirFicha();toast('Modelo criado ✔')}
function textoFicha(){
  const L=['DADOS PARA REGISTRO DA ART (rascunho)',''];
  CAMPOS.forEach(([k,r,t])=>{if(t==='h'){L.push('',r.toUpperCase());return}const v=valFicha(k);L.push(r+': '+(v||'-'))});
  if(respTec())L.push('','Responsável técnico: '+respTec());
  return L.join('\n');
}
function copiarFicha(){copiar(textoFicha())}
function salvarFicha(){if(cur.num&&!exemplo){salvar()}else toast('Prévia guardada. Salve o orçamento para não perder');fechar()}
function pdfFicha(){
  if(!window.jspdf){toast('O gerador de PDF não carregou. Verifique a internet');return}
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});const W=210,M=18;let y=0;const T=(t,x,yy,op)=>doc.text(pdfTxt(t),x,yy,op);
  doc.setTextColor(232);doc.setFont('helvetica','bold');doc.setFontSize(46);T('RASCUNHO - NÃO É A ART',W/2+8,175,{align:'center',angle:40});
  doc.setFillColor(20,32,43);doc.rect(0,0,W,22,'F');doc.setFillColor(242,165,22);doc.rect(0,22,W,1.5,'F');
  doc.setTextColor(255);doc.setFontSize(14);T('PRÉVIA DE DADOS PARA REGISTRO DE ART / TRT',W/2,13.5,{align:'center'});
  doc.setTextColor(20,32,43);y=34;
  CAMPOS.forEach(([k,r,t])=>{
    if(t==='h'){y+=3;if(y>265){doc.addPage();y=20}doc.setFont('helvetica','bold');doc.setFontSize(11.5);T(r.toUpperCase(),M,y);doc.setDrawColor(242,165,22);doc.line(M,y+1.5,W-M,y+1.5);y+=8;return}
    const l=doc.splitTextToSize(pdfTxt(valFicha(k)||'________________________________'),W-2*M-55);if(y+l.length*5>275){doc.addPage();y=20}
    doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text(doc.splitTextToSize(pdfTxt(r),52),M,y);doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.text(l,M+55,y);y+=Math.max(l.length*5,6)+2});
  if(respTec()){y+=4;doc.setFont('helvetica','bold');doc.setFontSize(9.5);T('Responsável técnico',M,y);doc.setFont('helvetica','normal');doc.setFontSize(10.5);T(respTec(),M+55,y)}
  doc.setFontSize(7.5);doc.setTextColor(120);
  T('Documento de conferência. A ART (CREA) ou TRT (CFT) só tem validade após registro e pagamento no sistema oficial do conselho.',W/2,284,{align:'center'});
  T('Dados do cliente usados somente para este serviço, conforme a LGPD (Lei nº 13.709/2018).',W/2,289,{align:'center'});
  salvarArq('previa-art-'+nomeArq(cur).replace('orcamento-','')+'.pdf',doc.output('blob'));
}

function compartilharDecl(){
  if(!envOrc)return;
  if(!window.jspdf){toast('O gerador de PDF não carregou. Verifique a internet');return}
  salvarArq('declaracao-'+nomeArq(envOrc).replace('orcamento-','')+'.pdf',gerarDeclaracao(envOrc));
}
function compartilharPDF(){
  if(!envOrc)return;
  if(!window.jspdf){toast('O gerador de PDF não carregou. Verifique a internet');return}
  salvarArq(nomeArq(envOrc)+'.pdf',gerarPDF(envOrc));
}

function carregarEu(){$('#e-tit').value=eu.tit||'';$('#e-crea').value=eu.crea||'';$('#e-nome').value=eu.nome;$('#e-tel').value=eu.tel;$('#e-doc').value=eu.doc;$('#e-cid').value=eu.cid;$('#e-val').value=eu.val;$('#sub').textContent=eu.nome||'Monte e envie orçamentos pelo celular'}
function salvarEu(){eu={nome:$('#e-nome').value.trim(),tel:$('#e-tel').value.trim(),doc:$('#e-doc').value.trim(),cid:$('#e-cid').value.trim(),val:num($('#e-val').value)||15,tit:$('#e-tit').value.trim(),crea:$('#e-crea').value.trim()};LS.set('oe_eu',eu);carregarEu();toast('Dados salvos ✔')}
function apagarTudo(){
  ['oe_cat','oe_orcs','oe_eu','oe_num','oe_solar_preco','oe_conhecidos','oe_limp','oe_plano_desc','oe_art_modelos'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
  limps=[];descPl={};modelos=JSON.parse(JSON.stringify(MODELOS0));renderAgenda();cat=JSON.parse(JSON.stringify(CAT0));orcs=[];eu={nome:'',tel:'',doc:'',cid:'Tatuí - SP',val:15};
  exemplo=false;cur=novo();carregarEu();preencher();renderSalvos();renderCatEdit();toast('Todos os dados foram apagados');
}
function gerarCopia(){const t=JSON.stringify({app:'orcamento-eletrico',versao:VERSAO,cat,orcs,eu,n:LS.get('oe_num',0),limps,descPl,modelos});$('#bk').value=t;copiar(t,$('#bk'))}
function importar(){
  try{const d=JSON.parse($('#bk').value);if(d.app!=='orcamento-eletrico')throw 0;
    cat=d.cat||cat;orcs=d.orcs||[];eu=d.eu||eu;limps=d.limps||[];descPl=d.descPl||{};if(d.modelos){modelos=d.modelos;LS.set('oe_art_modelos',modelos)}LS.set('oe_limp',limps);LS.set('oe_plano_desc',descPl);renderAgenda();LS.set('oe_cat',cat);LS.set('oe_orcs',orcs);LS.set('oe_eu',eu);LS.set('oe_num',d.n||0);
    carregarEu();renderCatEdit();renderSalvos();toast('Cópia restaurada ✔')}
  catch(e){toast('Código inválido. Cole a cópia completa gerada pelo app')}
}

/* ---------- Placa solar ---------- */
const precoCat=(id,pad)=>{const c=cat.find(x=>x.id===id);return c?num(c.preco):pad};
const PLANOS={avulsa:{nome:'Limpeza avulsa',ano:0,desc:0,dias:90},mensal:{nome:'Plano mensal',ano:12,desc:20,dias:30},trimestral:{nome:'Plano trimestral',ano:4,desc:15,dias:90},semestral:{nome:'Plano semestral',ano:2,desc:10,dias:180}};
let descPl=LS.get('oe_plano_desc',{}),limps=LS.get('oe_limp',[]);
const planDesc=k=>descPl[k]??PLANOS[k].desc;
const addDias=(iso,n)=>{const d=new Date((iso||hoje())+'T12:00:00');d.setDate(d.getDate()+Math.round(n));return d.toISOString().slice(0,10)};
const diasAte=iso=>Math.round((new Date(iso+'T12:00:00')-new Date(hoje()+'T12:00:00'))/864e5);
const SF=['s-cliente','s-tel','s-end','s-qtd','s-preco','s-desl','s-acesso','s-suj','s-desc','s-dias','s-feita'];
function solarDados(){
  const g=id=>$('#'+id).value,k=g('s-plano'),P=PLANOS[k];
  const qtd=Math.max(0,num(g('s-qtd'))),acesso=num(g('s-acesso')),suj=num(g('s-suj')),desc=Math.min(100,Math.max(0,num(g('s-desc'))));
  const unit=Math.round(num(g('s-preco'))*(1+acesso/100)*(1+suj/100)*100)/100;
  const insp=$('#s-insp').checked?precoCat('c41',80):0,desl=num(g('s-desl'));
  const sub=qtd*unit+insp+desl,d=sub*desc/100,total=sub-d;
  const dias=num(g('s-dias'))||P.dias,feita=g('s-feita')||hoje();
  return{k,P,qtd,unit,insp,desl,desc,sub,d,total,porAno:P.ano?total*P.ano:0,dias,feita,proxima:addDias(feita,dias)};
}
function renderSolar(){
  const d=solarDados();
  $('#s-tot').innerHTML=`<div><span>${String(d.qtd).replace('.',',')} placa(s) × ${brl(d.unit)}</span><span>${brl(d.qtd*d.unit)}</span></div>
  ${d.insp?`<div><span>Inspeção do sistema</span><span>${brl(d.insp)}</span></div>`:''}
  ${d.desl?`<div><span>Deslocamento</span><span>${brl(d.desl)}</span></div>`:''}
  ${d.d?`<div class="d"><span>Desconto ${d.P.ano?'do '+d.P.nome.toLowerCase():''} (${String(d.desc).replace('.',',')}%)</span><span>− ${brl(d.d)}</span></div>`:''}
  <div class="g"><span>${d.P.ano?'POR LIMPEZA':'TOTAL'}</span><span>${brl(d.total)}</span></div>
  ${d.P.ano?`<div class="pl"><span>${d.P.nome}: ${d.P.ano} limpezas por ano</span><span>${brl(d.porAno)}/ano</span></div>`:''}
  <div class="pl"><span>Próxima limpeza (em ${d.dias} dias)</span><span><b>${dataBR(d.proxima)}</b></span></div>`;
}
SF.concat('s-insp').forEach(id=>{const el=$('#'+id);el.addEventListener('input',renderSolar);el.addEventListener('change',renderSolar)});
$('#s-preco').addEventListener('change',()=>LS.set('oe_solar_preco',num($('#s-preco').value)));
$('#s-plano').addEventListener('change',()=>{const k=$('#s-plano').value;$('#s-desc').value=planDesc(k);$('#s-dias').value=PLANOS[k].dias;renderSolar()});
$('#s-desc').addEventListener('change',()=>{descPl[$('#s-plano').value]=num($('#s-desc').value);LS.set('oe_plano_desc',descPl);toast('Desconto salvo para este plano')});
function gerarSolar(){
  const d=solarDados();
  if(!d.qtd){toast('Informe o número de placas');$('#s-qtd').focus();return}
  const ac=$('#s-acesso').selectedOptions[0].text.split(' (')[0].toLowerCase(),sj=$('#s-suj').selectedOptions[0].text.split(':')[0].split(' (')[0].toLowerCase();
  exemplo=false;cur=novo();
  Object.assign(cur,{cliente:$('#s-cliente').value.trim(),tel:$('#s-tel').value.trim(),end:$('#s-end').value.trim(),tipo:'Limpeza de placa solar',data:d.feita,
    obs:'Limpeza com água limpa e escova macia, sem produtos abrasivos. Acesso '+ac+', sujeira '+sj+'. Próxima limpeza prevista para '+dataBR(d.proxima)+' (a cada '+d.dias+' dias).',
    pag:d.P.ano?`${d.P.nome}: ${d.P.ano} limpezas por ano, ${brl(d.total)} cada (${brl(d.porAno)} por ano)`:'',
    desc:d.desc?String(d.desc):'',descTipo:'%',prazo:'1 dia'});
  cur.itens.push({cid:'c40',tipo:'s',nome:'Limpeza de placa solar',un:'un',preco:d.unit,qtd:d.qtd});
  if(d.insp)cur.itens.push({cid:'c41',tipo:'s',nome:'Inspeção do sistema solar',un:'un',preco:d.insp,qtd:1});
  if(d.desl)cur.itens.push({cid:'c42',tipo:'s',nome:'Deslocamento',un:'un',preco:d.desl,qtd:1});
  preencher();ir('novo');toast('Orçamento gerado. Confira, salve e envie');
}
const assina=()=>eu.nome?'\n'+eu.nome+(eu.tel?' · '+eu.tel:''):'';
function msgFeita(e){const P=PLANOS[e.plano]||PLANOS.avulsa;
  return `Olá, ${e.cliente}! ☀️\n\nA limpeza das suas ${e.placas} placas solares foi feita em ${dataBR(e.feita)}.\n\n*Próxima limpeza prevista: ${dataBR(e.proxima)}*${P.ano?'\n'+P.nome+' ('+P.ano+' limpezas por ano)':''}\n\nPlaca limpa gera mais energia. Qualquer dúvida, é só chamar.${assina()}`}
function msgLembrete(e){const n=diasAte(e.proxima);
  return `Olá, ${e.cliente}! ☀️\n\nPassando para lembrar que a próxima limpeza das suas placas solares ${n<0?'estava prevista para':'está prevista para'} *${dataBR(e.proxima)}*.\n\nPosso agendar? Me diga o melhor dia e horário.${assina()}`}
function abrirAviso(tit,txt,tel){
  $('#aviso-tit').textContent=tit;$('#av-txt').textContent=txt;
  let t=String(tel||'').replace(/\D/g,'');if(t&&t.length<=11)t='55'+t;
  $('#av-wa').href='https://wa.me/'+t+'?text='+encodeURIComponent(txt);fechar();$('#m-aviso').classList.add('on');
}
function registrarLimpeza(){
  const d=solarDados(),cliente=$('#s-cliente').value.trim(),tel=$('#s-tel').value.trim();
  if(!cliente){toast('Informe o nome do cliente');$('#s-cliente').focus();return}
  if(!d.qtd){toast('Informe o número de placas');$('#s-qtd').focus();return}
  const e={id:Date.now(),cliente,tel,end:$('#s-end').value.trim(),placas:d.qtd,plano:d.k,dias:d.dias,feita:d.feita,proxima:d.proxima,valor:d.total};
  const ix=limps.findIndex(x=>x.cliente.toLowerCase()===cliente.toLowerCase()&&String(x.tel).replace(/\D/g,'')===tel.replace(/\D/g,''));
  if(ix>=0){e.id=limps[ix].id;limps[ix]=e}else limps.push(e);
  LS.set('oe_limp',limps);renderAgenda();abrirAviso('Limpeza registrada ✔',msgFeita(e),tel);
}
const achaL=id=>limps.find(x=>x.id===id);
function avisar(id){const e=achaL(id);abrirAviso('Lembrete para '+e.cliente,msgLembrete(e),e.tel)}
function feitaHoje(id){const e=achaL(id);e.feita=hoje();e.proxima=addDias(e.feita,e.dias);LS.set('oe_limp',limps);renderAgenda();abrirAviso('Limpeza registrada ✔',msgFeita(e),e.tel)}
function delLimp(id){limps=limps.filter(x=>x.id!==id);LS.set('oe_limp',limps);renderAgenda();toast('Removido da lista')}
function renderAgenda(){
  const l=[...limps].sort((a,b)=>a.proxima.localeCompare(b.proxima));
  const vence=l.filter(e=>diasAte(e.proxima)<=7).length,bd=$('#solar-badge');bd.hidden=!vence;bd.textContent=vence;
  $('#agenda').innerHTML=l.map(e=>{const n=diasAte(e.proxima),P=PLANOS[e.plano]||PLANOS.avulsa;
    const [cls,st]=n<0?['at','Atrasada '+(-n)+' dia(s)']:n===0?['at','É hoje']:n<=15?['av','Vence em '+n+' dia(s)']:['ok','Em dia'];
    return`<div class="ag"><div class="agh"><b>${esc(e.cliente)}</b><span class="pill ${cls}">${st}</span></div>
    <small>${String(e.placas).replace('.',',')} placa(s) · ${P.nome} · feita em ${dataBR(e.feita)}</small>
    <div class="px">Próxima: <b>${dataBR(e.proxima)}</b></div>
    <div class="acts"><button class="btn sm wa" onclick="avisar(${e.id})">Avisar</button><button class="btn sm" onclick="feitaHoje(${e.id})">Limpei hoje</button><button class="btn sm red" onclick="perguntar('Tirar ${esc(e.cliente).replace(/'/g,'')} da lista de limpezas?',()=>delLimp(${e.id}))">Excluir</button></div></div>`}).join('')||'<div class="empty">Nenhuma limpeza registrada ainda.</div>';
}

function ir(t){
  document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('on',s.id==='t-'+t));
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  if(t==='salvos')renderSalvos();if(t==='precos')renderCatEdit();scrollTo(0,0);
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>ir(b.dataset.t));

document.querySelectorAll('.sheet').forEach(sh=>{const d=document.createElement('div');d.className='stop';d.innerHTML='<button type="button" onclick="this.closest(\'.modal\').classList.remove(\'on\')">‹ Voltar</button><button type="button" class="xx" aria-label="Fechar" onclick="this.closest(\'.modal\').classList.remove(\'on\')">✕</button>';sh.prepend(d)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')fechar()});
$('#ver').textContent=VERSAO;
/* ================== ÁREA DO DESENVOLVEDOR / LICENÇAS ==================
   Para BLOQUEAR alguém: coloque o código da pessoa na lista abaixo,
   ex.: const BLOQUEADOS=['K7P2QX','M3AB9Z'];  e suba o app.js de novo no GitHub.
   EXIGIR_LICENCA=true: quem abrir sem link de acesso vê a tela de bloqueio.
   O PIN do desenvolvedor é trocado na própria área do desenvolvedor.        */
const BLOQUEADOS=[];
const EXIGIR_LICENCA=true;
const DEV_PIN_HASH='l08212bx479i';
const SAL='oe-lras-2026';
function hashTxt(t){let h1=0x811c9dc5,h2=0x01000193;for(let i=0;i<t.length;i++){const c=t.charCodeAt(i);h1=Math.imul(h1^c,16777619)>>>0;h2=Math.imul(h2^c,2654435761)>>>0}return h1.toString(36)+h2.toString(36)}
const assinar=o=>hashTxt([o.c,o.n,o.v,SAL].join('|'));
const b64e=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
function lerLinkAcesso(){
  try{const k=new URLSearchParams(location.search).get('k');if(!k)return;
    const o=JSON.parse(b64d(k));
    if(o&&o.c&&o.s===assinar(o)){LS.set('oe_lic',{c:o.c,n:o.n,v:o.v||''});toast('Acesso liberado para '+o.n+' ✔')}
    else toast('Link de acesso inválido');
    history.replaceState(null,'',location.pathname);
  }catch(e){}
}
const ehDev=()=>LS.get('oe_dev',false)===true;
function situacaoLic(){
  if(ehDev())return{ok:true,dev:true};
  const l=LS.get('oe_lic',null);
  if(!l)return{ok:!EXIGIR_LICENCA,motivo:'sem'};
  if(BLOQUEADOS.includes(l.c))return{ok:false,motivo:'bloq',l};
  if(l.v&&diasAte(l.v)<0)return{ok:false,motivo:'venc',l};
  return{ok:true,l};
}
function aplicarLicenca(){
  const s=situacaoLic(),tr=$('#trava');
  const info=$('#lic-info');
  info.textContent=s.dev?'Modo desenvolvedor':s.l?('Licenciado para '+s.l.n+(s.l.v?' · válido até '+dataBR(s.l.v):'')):'';
  info.hidden=!info.textContent;$('#btn-dev').hidden=!s.dev;
  if(s.ok){tr.hidden=true;return}
  $('#trava-tit').textContent=s.motivo==='venc'?'Seu período de uso terminou':s.motivo==='bloq'?'Acesso suspenso':'Acesso não liberado';
  $('#trava-txt').textContent=s.motivo==='venc'?'O período de teste terminou em '+dataBR(s.l.v)+'. Seus orçamentos continuam guardados neste aparelho. Fale com o desenvolvedor para continuar usando.'
    :s.motivo==='bloq'?'O acesso deste aparelho foi suspenso. Seus dados continuam guardados. Fale com o desenvolvedor.'
    :'Este app precisa de um link de acesso. Peça o seu ao desenvolvedor.';
  tr.hidden=false;
}
/* entrada escondida: tocar 5 vezes no número da versão no rodapé */
let toquesVer=0,toqueT=0;
const elVer=$('#ver');let segurar=null;
elVer.addEventListener('pointerup',e=>{clearTimeout(segurar);const t=Date.now();toquesVer=t-toqueT<1500?toquesVer+1:1;toqueT=t;if(toquesVer>=5){toquesVer=0;pedirPin()}});
elVer.addEventListener('pointerdown',()=>{clearTimeout(segurar);segurar=setTimeout(()=>{toquesVer=0;pedirPin()},2000)});
['pointerleave','pointercancel'].forEach(ev=>elVer.addEventListener(ev,()=>clearTimeout(segurar)));
elVer.addEventListener('contextmenu',e=>e.preventDefault());
function pedirPin(){if(ehDev()){abrirDev();return}$('#pin-in').value='';fechar();$('#m-pin').classList.add('on');setTimeout(()=>$('#pin-in').focus(),50)}
function conferirPin(){
  if(hashTxt($('#pin-in').value+SAL)===DEV_PIN_HASH){LS.set('oe_dev',true);aplicarLicenca();abrirDev();toast('Modo desenvolvedor ativado')}
  else{toast('PIN incorreto');$('#pin-in').value=''}
}
function sairDev(){LS.set('oe_dev',false);fechar();aplicarLicenca();toast('Saiu do modo desenvolvedor')}
let devLics=LS.get('oe_dev_lics',[]);
function abrirDev(){
  $('#dv-url').value=LS.get('oe_dev_url','')||(location.origin+location.pathname);
  $('#dv-ver').textContent=VERSAO;
  let tam=0;try{for(const k in localStorage)if(k.startsWith('oe_'))tam+=(localStorage.getItem(k)||'').length}catch(e){}
  $('#dv-stat').textContent=`${orcs.length} orçamento(s) · ${limps.length} limpeza(s) · ${cat.length} itens na tabela · ${(tam/1024).toFixed(1)} KB de dados neste aparelho`;
  $('#dv-out').hidden=true;renderDevLics();fechar();$('#m-dev').classList.add('on');
}
function codigoNovo(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<6;i++)c+=a[Math.floor(Math.random()*a.length)];return c}
function gerarLink(){
  const n=$('#dv-nome').value.trim();if(!n){toast('Escreva o nome da pessoa');$('#dv-nome').focus();return}
  const dias=num($('#dv-dias').value),url=$('#dv-url').value.trim();LS.set('oe_dev_url',url);
  const o={c:codigoNovo(),n,v:dias?addDias(hoje(),dias):''};o.s=assinar(o);
  const link=url+(url.includes('?')?'&':'?')+'k='+b64e(JSON.stringify(o));
  devLics.unshift({c:o.c,n,v:o.v,criado:hoje(),link});LS.set('oe_dev_lics',devLics);
  mostrarMsgLic(devLics[0]);$('#dv-nome').value='';renderDevLics();
}
function msgLic(l){return `Olá, ${l.n}! Segue o seu acesso ao app *Orçamento Elétrico*${l.v?' (teste até '+dataBR(l.v)+')':''}:\n\n${l.link}\n\nDica: abra o link no Safari ou no Chrome e toque em "Adicionar à Tela de Início" para ficar como um app no celular.\n\nQualquer dúvida, é só me chamar.`}
function mostrarMsgLic(l){$('#dv-msg').textContent=msgLic(l);$('#dv-wa').href='https://wa.me/?text='+encodeURIComponent(msgLic(l));$('#dv-out').hidden=false;$('#dv-out').scrollIntoView({block:'nearest',behavior:'smooth'})}
function codigosBloq(){
  const set=new Set(BLOQUEADOS);
  devLics.forEach(l=>{if(l.bloq===true)set.add(l.c);if(l.bloq===false)set.delete(l.c)});
  return[...set];
}
function renderDevLics(){
  $('#dv-lics').innerHTML=devLics.map((l,i)=>{
    const noGit=BLOQUEADOS.includes(l.c),quer=l.bloq===true||(l.bloq!==false&&noGit),venc=l.v&&diasAte(l.v)<0;
    const [cls,st]=quer&&noGit?['at','Bloqueado']:quer?['av','Bloqueio falta subir no GitHub']:noGit?['av','Desbloqueio falta subir no GitHub']:venc?['at','Vencido']:l.v?['av','Até '+dataBR(l.v)]:['ok','Liberado · sem prazo'];
    return`<div class="ag"><div class="agh"><b>${esc(l.n)}</b><span class="pill ${cls}">${st}</span></div>
    <small>Código <b>${l.c}</b> · criado em ${dataBR(l.criado)}</small>
    <div class="acts"><button class="btn sm wa" onclick="mostrarMsgLic(devLics[${i}])">Mensagem</button><button class="btn sm sec" onclick="copiar(devLics[${i}].link)">Copiar link</button>${quer
      ?`<button class="btn sm" onclick="desbloquear(${i})">Desbloquear</button>`
      :`<button class="btn sm red" onclick="perguntar('Bloquear ${esc(l.n).replace(/'/g,'')}? O app dele só trava depois que você colar a linha no app.js do GitHub.',()=>bloquear(${i}))">Bloquear</button>`}</div></div>`}).join('')||'<div class="empty">Nenhum link gerado ainda.</div>';
}
function linhaBloq(){
  const lista=codigosBloq(),linha=`const BLOQUEADOS=[${lista.map(x=>"'"+x+"'").join(',')}];`;
  const igual=lista.length===BLOQUEADOS.length&&lista.every(c=>BLOQUEADOS.includes(c));
  $('#dv-bloq').textContent=linha;
  $('#dv-bloqmsg').innerHTML=igual?'Nada para mudar no GitHub: o app.js já está assim.':'No GitHub, abra o <b>app.js</b>, troque a linha <b>const BLOQUEADOS=…</b> por esta e salve. Vale na próxima vez que a pessoa abrir o app.';
  $('#dv-bloqbox').hidden=false;$('#dv-bloqbox').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function bloquear(i){devLics[i].bloq=true;LS.set('oe_dev_lics',devLics);renderDevLics();linhaBloq();toast(devLics[i].n+' marcado para bloquear')}
function desbloquear(i){devLics[i].bloq=false;LS.set('oe_dev_lics',devLics);renderDevLics();linhaBloq();toast(devLics[i].n+' desbloqueado ✔')}
function gerarPin(){const p=$('#dv-pin').value.trim();if(p.length<4){toast('Use pelo menos 4 dígitos');return}
  $('#dv-pinlinha').textContent=`const DEV_PIN_HASH='${hashTxt(p+SAL)}';`;$('#dv-pinbox').hidden=false}

$('#s-preco').value=LS.get('oe_solar_preco',null)??precoCat('c40',15);$('#s-feita').value=hoje();$('#s-desc').value=planDesc('avulsa');$('#s-dias').value=PLANOS.avulsa.dias;renderSolar();renderAgenda();
carregarEu();
if(!orcs.length&&!LS.get('oe_viu_ex',false)){exemplo=true;cur=exemploOrc();LS.set('oe_viu_ex',true)}else cur=novo();
preencher();
lerLinkAcesso();aplicarLicenca();
/* ---------- Compartilhar e atualizar o app ---------- */
$('#app-ver').textContent=VERSAO;
const urlApp=()=>location.origin+location.pathname;
async function compartilharApp(){
  const txt='Conheça o app *Orçamento Elétrico*: monte orçamentos de serviços elétricos pelo celular e mande para o cliente no WhatsApp.\n\n'+urlApp()+'\n\nPara liberar o acesso, fale com o desenvolvedor: Luís Ricardo de Almeida Siqueira.';
  try{if(navigator.share){await navigator.share({title:'Orçamento Elétrico',text:txt});return}}catch(e){if(e&&e.name==='AbortError')return}
  abrirAviso('Compartilhar aplicativo',txt,'');
}
async function atualizarApp(){
  const b=$('#btn-atu');if(b){b.disabled=true;b.textContent='Procurando atualização…'}
  try{
    const r=await fetch('app.js?nc='+Date.now(),{cache:'reload'});const t=await r.text();
    const m=t.match(/const VERSAO='([\d.]+)'/),nova=m?m[1]:null;
    await Promise.all(['index.html','estilo.css','app.js',location.pathname].map(u=>fetch(u,{cache:'reload'}).catch(()=>{})));
    if(nova&&nova!==VERSAO){toast('Atualizando para a versão '+nova+'…');
      try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)));const rg=await navigator.serviceWorker?.getRegistration();if(rg)await rg.update()}catch(e){}
      setTimeout(()=>location.reload(),700)}
    else{toast('Você já está na versão mais nova ('+VERSAO+') ✔');if(b){b.disabled=false;b.textContent='Atualizar aplicativo'}}
  }catch(e){toast('Sem internet. Tente de novo mais tarde');if(b){b.disabled=false;b.textContent='Atualizar aplicativo'}}
}
/* ---------- Funcionar sem internet (Android e iPhone) ---------- */
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
