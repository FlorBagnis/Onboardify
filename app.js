/* Mi onboarding — lógica de la app. Creado by Flor Bagnis */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const IC=n=>`<svg class="i"><use href="#i-${n}"/></svg>`;
const K="onboarding-v1";
let S={notes:[],cards:[],hours:[],qs:[],cos:[],co:null,hs:"co",theme:"rosa",rate:3,fx:1500,goal:8,tab:"apuntes",cur:null,show:false};
try{const r=localStorage.getItem(K);if(r)Object.assign(S,JSON.parse(r))}catch(e){}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};

/* Empresas: si había datos de antes, pasan todos a la primera empresa */
if(!Array.isArray(S.cos)||!S.cos.length)S.cos=[{id:uid(),name:"General",rate:S.rate,fx:S.fx,goal:S.goal}];
if(!S.cos.some(c=>c.id===S.co))S.co=S.cos[0].id;
["notes","cards","hours","qs"].forEach(k=>S[k].forEach(x=>{if(!x.c)x.c=S.co}));
const co=()=>S.cos.find(c=>c.id===S.co);
const mine=k=>S[k].filter(x=>x.c===S.co);

/* Tema: Rosa, Oscuro o Black (se guarda y también se usa en el PDF) */
const THEMES={rosa:"light",oscuro:"dark",black:"black"};
if(!THEMES[S.theme])S.theme="rosa";
const applyTheme=()=>{
 document.documentElement.dataset.theme=THEMES[S.theme];
 document.querySelectorAll("[data-th]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.th===S.theme)));
};
applyTheme();
$("themes").onclick=e=>{const b=e.target.closest("[data-th]");if(!b)return;S.theme=b.dataset.th;save();applyTheme()};

const TABS=[["apuntes",IC("note")+"Apuntes"],["tarjetas",IC("star")+"Tarjetas"],["horas",IC("clock")+"Horas"],["dudas",IC("chat")+"Dudas"],["historial",IC("history")+"Historial"],["tema",IC("palette")+"Tema"]];
const money=n=>n.toLocaleString("es-AR",{maximumFractionDigits:0});
const DEL=IC("trash")+'<span class="xt">Borrar</span>';

function tabs(){
 $("tabs").innerHTML=TABS.map(([k,l])=>`<button role="tab" aria-selected="${S.tab===k}" data-t="${k}">${l}</button>`).join("");
 TABS.forEach(([k])=>$("p-"+k).hidden=S.tab!==k);
}
$("tabs").onclick=e=>{const t=e.target.closest("[data-t]");if(t){S.tab=t.dataset.t;save();tabs();hist()}};

function drawCos(){
 $("chips").innerHTML=S.cos.map(c=>`<button class="chip" type="button" aria-pressed="${c.id===S.co}" data-co="${c.id}">${IC("shop")}${esc(c.name)}</button>`).join("");
}
function fields(){const C=co();$("rate").value=C.rate;$("fxr").value=C.fx;$("goal").value=C.goal}
function renderAll(){drawCos();tabs();notes();cards();hours();qs();fields();hist()}
$("chips").onclick=e=>{const b=e.target.closest("[data-co]");if(!b)return;S.co=b.dataset.co;$("comsg").textContent="";pick();save();renderAll()};
$("addCo").onclick=()=>{
 const n=$("con").value.trim(),m=$("comsg");
 if(!n){m.textContent="Escribí el nombre de la empresa.";return}
 if(S.cos.some(c=>c.name.toLowerCase()===n.toLowerCase())){m.textContent="Ya tenés una empresa con ese nombre.";return}
 const C=co();S.cos.push({id:uid(),name:n,rate:C.rate,fx:C.fx,goal:C.goal});S.co=S.cos[S.cos.length-1].id;
 $("con").value="";m.textContent="";pick();save();renderAll()};
$("renCo").onclick=()=>{
 const n=$("con").value.trim(),m=$("comsg");
 if(!n){m.textContent="Escribí el nombre nuevo y tocá Renombrar.";return}
 if(S.cos.some(c=>c.id!==S.co&&c.name.toLowerCase()===n.toLowerCase())){m.textContent="Ya tenés una empresa con ese nombre.";return}
 co().name=n;$("con").value="";m.textContent="";save();drawCos()};
$("delCo").onclick=()=>{
 const m=$("comsg");
 if(S.cos.length<2){m.textContent="Tiene que quedar al menos una empresa.";return}
 if(!confirm(`¿Borrar "${co().name}" con todos sus apuntes, tarjetas, horas y dudas?`))return;
 const id=S.co;["notes","cards","hours","qs"].forEach(k=>{S[k]=S[k].filter(x=>x.c!==id)});
 S.cos=S.cos.filter(c=>c.id!==id);S.co=S.cos[0].id;m.textContent="";pick();save();renderAll()};

function notes(){
 const N=mine("notes");
 $("notes").innerHTML=N.length?N.map(n=>`<div class="item"><div><h3>${esc(n.t)}</h3><p>${esc(n.b)}</p></div><button class="x" data-del="notes:${n.id}" aria-label="Borrar apunte">${DEL}</button></div>`).join(""):'<p class="empty">Todavía no hay apuntes. Escribí el primero cuando termines una lección.</p>';
}
$("addNote").onclick=()=>{const t=$("nt").value.trim(),b=$("nb").value.trim();if(!t&&!b)return;S.notes.unshift({id:uid(),at:Date.now(),c:S.co,t:t||"Sin título",b});$("nt").value=$("nb").value="";save();notes()};

(function(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition,b=$("mic"),m=$("micmsg");
 if(!SR){b.disabled=true;m.textContent="Tu navegador no permite dictar. Probá con Chrome o Safari.";return}
 let r=null,on=false,base="";
 const stop=()=>{on=false;b.innerHTML=IC("mic")+"Dictar apunte";if(r)try{r.stop()}catch(e){}};
 b.onclick=()=>{
  if(on){stop();m.textContent="";return}
  r=new SR();r.lang="es-AR";r.continuous=true;r.interimResults=true;
  base=$("nb").value;if(base&&!/\s$/.test(base))base+=" ";
  r.onresult=ev=>{let fin="",tmp="";for(let i=0;i<ev.results.length;i++){if(ev.results[i].isFinal)fin+=ev.results[i][0].transcript;else tmp+=ev.results[i][0].transcript}
   $("nb").value=base+fin+tmp};
  r.onerror=ev=>{stop();m.textContent=(ev.error==="not-allowed"||ev.error==="service-not-allowed")?"No hay permiso para el micrófono. Habilitalo en el navegador o escribí el apunte.":"No se pudo dictar. Probá de nuevo."};
  r.onend=()=>{if(on){try{base=$("nb").value+" ";r.start()}catch(e){stop()}}};
  try{r.start();on=true;b.innerHTML=IC("stop")+"Detener";m.textContent="Escuchando… hablá y se escribe solo."}catch(e){m.textContent="No se pudo iniciar el micrófono."}
 };
})();
function pick(){const p=mine("cards").filter(c=>!c.known);S.cur=p.length?p[Math.floor(Math.random()*p.length)].id:null;S.show=false}
function cards(){const st=$("study");st.classList.remove("flip");void st.offsetWidth;st.classList.add("flip");
 const C=mine("cards"),c=C.find(x=>x.id===S.cur),left=C.filter(x=>!x.known).length;
 if(!C.length)$("study").innerHTML='<span class="empty">Agregá tarjetas con preguntas de lo que vayas viendo.</span>';
 else if(!c)$("study").innerHTML='Repasaste todas las tarjetas. Buen trabajo.';
 else $("study").innerHTML=`<small>${left} por repasar</small>${esc(c.q)}${S.show?`<div style="margin-top:14px;color:var(--accent-text)">${esc(c.a)}</div>`:""}`;
 $("studyBtns").innerHTML=!C.length?"":!c?'<button class="btn ghost" data-a="reset">Empezar de nuevo</button>':!S.show?'<button class="btn" data-a="show">Mostrar respuesta</button>':'<button class="btn ok" data-a="know">La sabía</button><button class="btn bad" data-a="again">Repasar de nuevo</button>';
 $("cards").innerHTML=C.length?C.map(x=>`<div class="item ${x.known?"done":""}"><div><h3>${esc(x.q)}</h3><p>${esc(x.a)}</p></div><button class="x" data-del="cards:${x.id}" aria-label="Borrar tarjeta">${DEL}</button></div>`).join(""):"";
 $("cards").hidden=!C.length;
}
$("addCard").onclick=()=>{const q=$("cq").value.trim(),a=$("ca").value.trim();if(!q||!a)return;S.cards.push({id:uid(),at:Date.now(),c:S.co,q,a,known:false});$("cq").value=$("ca").value="";if(!S.cur)pick();save();cards()};
$("studyBtns").onclick=e=>{const a=e.target.dataset.a;if(!a)return;
 if(a==="show")S.show=true;
 else if(a==="know"){S.cards.find(x=>x.id===S.cur).known=true;pick()}
 else if(a==="again")pick();
 else if(a==="reset"){mine("cards").forEach(x=>x.known=false);pick()}
 save();cards()};

const mins=(s,e)=>{const[a,b]=s.split(":").map(Number),[c,d]=e.split(":").map(Number);return(c*60+d)-(a*60+b)};
function hours(){
 const C=co(),H=mine("hours");
 const tot=H.reduce((s,h)=>s+h.m,0)/60,td=new Date().toISOString().slice(0,10);
 const today=H.filter(h=>h.d===td).reduce((s,h)=>s+h.m,0)/60,usd=tot*C.rate,pct=Math.min(100,today/C.goal*100);
 $("stats").innerHTML=`<div class="stat"><b>${tot.toFixed(1)} h</b><span>Total registrado</span></div><div class="stat"><b>USD ${money(usd)}</b><span>A USD ${C.rate} la hora</span></div><div class="stat"><b>$${money(usd*C.fx)}</b><span>En pesos, a $${money(C.fx)} por dólar</span></div><div class="stat"><b>${today.toFixed(1)} / ${C.goal} h</b><span>Hoy</span><div class="bar"><i style="width:${pct}%"></i></div></div>`;
 const hs=[...H].sort((a,b)=>(b.d+b.s).localeCompare(a.d+a.s));
 $("hours").innerHTML=hs.length?hs.map(h=>`<div class="item"><div><h3>${h.d} · ${h.s} a ${h.e}</h3><p>${(h.m/60).toFixed(2)} h${h.n?" — "+esc(h.n):""}</p></div><button class="x" data-del="hours:${h.id}" aria-label="Borrar bloque">${DEL}</button></div>`).join(""):'<p class="empty">Todavía no registraste bloques. Anotá cada uno apenas termines, así podés chequear que te paguen todo.</p>';
}
$("addHour").onclick=()=>{const d=$("hd").value,s=$("hs").value,e=$("he").value;
 if(!d||!s||!e){$("hmsg").textContent="Completá fecha, hora de inicio y hora de fin.";return}
 const m=mins(s,e);if(m<=0){$("hmsg").textContent="La hora de fin tiene que ser posterior a la de inicio.";return}
 $("hmsg").textContent="";S.hours.push({id:uid(),at:Date.now(),c:S.co,d,s,e,m,n:$("hn").value.trim()});$("hn").value="";save();hours()};
[["rate","rate"],["fxr","fx"],["goal","goal"]].forEach(([id,k])=>{$(id).oninput=()=>{const v=parseFloat($(id).value);if(v>0){co()[k]=v;save();hours()}}});

function qs(){
 const Q=mine("qs");
 $("qs").innerHTML=Q.length?Q.map(q=>`<div class="item ${q.ok?"done":""}"><label style="display:flex;gap:10px;margin:0;font-weight:400"><input type="checkbox" style="width:auto" data-q="${q.id}" ${q.ok?"checked":""}><span><h3 style="display:inline">${esc(q.t)}</h3></span></label><button class="x" data-del="qs:${q.id}" aria-label="Borrar duda">${DEL}</button></div>`).join(""):'<p class="empty">Sin dudas por ahora. Anotalas apenas aparezcan y preguntalas todas juntas.</p>';
}
$("addQ").onclick=()=>{const t=$("dq").value.trim();if(!t)return;S.qs.push({id:uid(),at:Date.now(),c:S.co,t,ok:false});$("dq").value="";save();qs()};
$("qs").onchange=e=>{const id=e.target.dataset.q;if(id){S.qs.find(q=>q.id===id).ok=e.target.checked;save();qs()}};

document.addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;const d=b.dataset.del;const[k,id]=d.split(":");S[k]=S[k].filter(x=>x.id!==id);
 if(k==="cards"&&S.cur===id)pick();save();({notes,cards,hours,qs})[k]()});

/* Historial: cada apunte, tarjeta, bloque de horas y duda, ordenado por fecha */
const pad=n=>String(n).padStart(2,"0");
const tsOf=x=>{if(x.at)return x.at;const n=parseInt(String(x.id).slice(0,8),36);return n>1.5e12&&n<4e12?n:0};
const dkey=t=>{if(!t)return"";const d=new Date(t);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
const dfmt=k=>k?k.split("-").reverse().join("/"):"Sin fecha";
const tfmt=t=>{const d=new Date(t);return pad(d.getHours())+":"+pad(d.getMinutes())};
function entriesOf(id){
 const out=[];
 S.notes.filter(x=>x.c===id).forEach(x=>out.push({ic:"note",t:tsOf(x),title:x.t,det:x.b,lab:"Apunte"}));
 S.cards.filter(x=>x.c===id).forEach(x=>out.push({ic:"star",t:tsOf(x),title:x.q,det:x.a,lab:"Tarjeta"+(x.known?" · la sabía":"")}));
 S.hours.filter(x=>x.c===id).forEach(x=>out.push({ic:"clock",t:new Date(x.d+"T"+x.s).getTime()||tsOf(x),title:x.s+" a "+x.e+" · "+(x.m/60).toFixed(2)+" h",det:x.n||"",lab:"Horas"}));
 S.qs.filter(x=>x.c===id).forEach(x=>out.push({ic:"chat",t:tsOf(x),title:x.t,det:"",lab:"Duda · "+(x.ok?"resuelta":"pendiente")}));
 return out.sort((a,b)=>b.t-a.t);
}
function hist(){
 const all=S.hs==="all";
 document.querySelectorAll("[data-hs]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.hs===S.hs)));
 const rows=[];
 (all?S.cos:[co()]).forEach(c=>entriesOf(c.id).forEach(e=>{e.co=c.name;rows.push(e)}));
 rows.sort((a,b)=>b.t-a.t);
 if(!rows.length){$("hist").innerHTML='<p class="empty">Todavía no hay nada en el historial. Cada apunte, tarjeta, bloque de horas y duda que guardes aparece acá, ordenado por fecha.</p>';return}
 let h="",last=null;
 rows.forEach(e=>{const k=dkey(e.t);
  if(k!==last){h+=`<div class="hday">${IC("history")}${dfmt(k)}</div>`;last=k}
  const d=e.det&&e.det.length>140?e.det.slice(0,140)+"…":e.det;
  h+=`<div class="hrow">${IC(e.ic)}<div><b>${esc(e.title)}</b>${all?`<span class="tag">${esc(e.co)}</span>`:""}<small>${esc(e.lab)}${e.t?" · "+tfmt(e.t):""}${d?" — "+esc(d):""}</small></div></div>`});
 $("hist").innerHTML=h;
}
$("hscope").onclick=e=>{const b=e.target.closest("[data-hs]");if(!b)return;S.hs=b.dataset.hs;save();hist()};

/* Exportar PDF: la empresa actual o todas, con el tema elegido, vía "Guardar como PDF" */
function pdfBlock(C,first){
 const N=S.notes.filter(x=>x.c===C.id),Cd=S.cards.filter(x=>x.c===C.id),Q=S.qs.filter(x=>x.c===C.id);
 const H=S.hours.filter(x=>x.c===C.id).sort((a,b)=>(a.d+a.s).localeCompare(b.d+b.s));
 const fd=d=>d.split("-").reverse().join("/");
 const tot=H.reduce((s,h)=>s+h.m,0)/60,usd=tot*C.rate;
 const sec=(cls,ic,t,b)=>`<section class="pg ${cls}"><h2>${IC(ic)}${t}</h2>${b}</section>`;
 let h=`<div class="blk${first?"":" brk"}"><div class="top"><h1>${IC("flower")}${esc(C.name)}${IC("flower")}</h1><div class="meta">Mi onboarding · ${new Date().toLocaleDateString("es-AR")}</div></div>`;
 if(N.length)h+=sec("n","note","Apuntes",N.map(n=>`<div class="it"><h3>${esc(n.t)}</h3><p>${esc(n.b)}</p></div>`).join(""));
 if(Cd.length)h+=sec("c","star","Tarjetas",Cd.map(c=>`<div class="it"><h3>${esc(c.q)}</h3><p>${esc(c.a)}</p></div>`).join(""));
 if(H.length)h+=sec("h","clock","Horas",`<div class="tots"><div class="t t1"><b>${tot.toFixed(1)} h</b><span>Total registrado</span></div><div class="t t2"><b>USD ${money(usd)}</b><span>A USD ${C.rate} la hora</span></div><div class="t t3"><b>$${money(usd*C.fx)}</b><span>A $${money(C.fx)} por dólar</span></div></div><table><thead><tr><th>Fecha</th><th>Desde</th><th>Hasta</th><th>Horas</th><th>Qué hice</th></tr></thead><tbody>${H.map(x=>`<tr><td>${fd(x.d)}</td><td>${x.s}</td><td>${x.e}</td><td>${(x.m/60).toFixed(2)}</td><td>${esc(x.n||"")}</td></tr>`).join("")}</tbody></table>`);
 if(Q.length)h+=sec("d","chat","Dudas",Q.map(q=>`<div class="it"><h3>${esc(q.t)}<span class="tag ${q.ok?"ok":"pend"}">${q.ok?"Resuelta":"Pendiente"}</span></h3></div>`).join(""));
 const E=entriesOf(C.id);
 if(E.length)h+=sec("g","history","Historial",`<table><thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Detalle</th></tr></thead><tbody>${E.map(e=>`<tr><td>${dfmt(dkey(e.t))}</td><td>${e.t?tfmt(e.t):""}</td><td>${esc(e.lab)}</td><td>${esc(e.title)}</td></tr>`).join("")}</tbody></table>`);
 if(!E.length)h+='<p class="meta" style="text-align:center">Esta empresa todavía no tiene nada cargado.</p>';
 return h+"</div>";
}
let pdfScope="co";
function buildPdf(scope){
 $("pdf").className=S.theme==="oscuro"?"dark":S.theme==="black"?"black":"";
 document.documentElement.dataset.pdf=S.theme;
 $("pdf").innerHTML=(scope==="all"?S.cos.map((c,i)=>pdfBlock(c,i===0)).join(""):pdfBlock(co(),true))+`<div class="sig">Creado by Flor Bagnis ${IC("heart")}</div>`;
}
window.addEventListener("beforeprint",()=>buildPdf(pdfScope));
function doPrint(scope,name){
 pdfScope=scope;buildPdf(scope);
 const t=document.title;document.title="Onboarding - "+name;
 const back=()=>{document.title=t;window.removeEventListener("afterprint",back)};
 window.addEventListener("afterprint",back);
 window.print();
}
$("pdfBtn").onclick=()=>doPrint("co",co().name);
$("pdfAll").onclick=()=>doPrint("all","Todas las empresas");

const RM=matchMedia("(prefers-reduced-motion:reduce)").matches;
function burst(el){if(RM)return;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,cs=["#ffb3d6","#e06aa3","#ffc2e0","#ffe3a3","#cdb8ff"];
 for(let i=0;i<16;i++){const p=document.createElement("i"),a=Math.random()*6.28,d=50+Math.random()*70;p.className="cf";p.style.cssText=`left:${x}px;top:${y}px;background:${cs[i%5]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-20}px`;document.body.appendChild(p);setTimeout(()=>p.remove(),950)}}
const cnt=()=>S.notes.length+S.cards.length+S.hours.length+S.qs.length+S.cards.filter(c=>c.known).length;
document.addEventListener("click",e=>{const t=e.target.closest("#addNote,#addCard,#addHour,#addQ,[data-a=know]");if(!t)return;const b=cnt();setTimeout(()=>{if(cnt()>b)burst(t)},0)},true);
document.addEventListener("change",e=>{if(e.target.dataset.q&&e.target.checked)burst(e.target)});
const PARTS=["heart","star","sparkle","flower"];
for(let i=0;i<12;i++){const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.innerHTML='<use href="#i-'+PARTS[i%4]+'"/>';s.style.cssText=`--x:${Math.random()*95}%;--s:${14+Math.random()*22}px;--d:${14+Math.random()*14}s;--l:-${Math.random()*20}s`;$("fx").appendChild(s)}
$("hd").value=new Date().toISOString().slice(0,10);
if(!mine("cards").find(c=>c.id===S.cur))pick();
renderAll();
