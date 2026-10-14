/* Sunday Meeting Buddy — shared mini-game engine (week of Oct 5–11, 2026).
   Each games/w-XX.html sets window.GAME = {id,title,sub,rounds:[...],done} and loads this file.
   Round types: quiz, tf, sort, order, fill, match, unscramble, find.
   When every round is finished it shows GAME.done and (inside the app only) posts
   {type:'smb-game-complete', game:GAME.id} once. Reset starts over (the app gives no extra stars). */
(function(){
const G=window.GAME; if(!G) return;
const css=`
:root{--ink:#1a2236;--accent:#6d5dfc;--ok:#1f9d5b;--bad:#d24b4b}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#eef2fb;color:var(--ink)}
.wrap{max-width:860px;margin:0 auto;padding:12px 12px 30px}
h1{font-size:22px;margin:0 0 2px}
.sub{color:#5b6478;font-weight:700;margin-bottom:8px;font-size:15px}
.dots{display:flex;gap:6px;margin:6px 0 10px}.dot{flex:1;height:8px;border-radius:6px;background:#d8dcec}.dot.on{background:var(--accent)}.dot.done{background:var(--ok)}
.hold{min-height:54px;background:#fff8df;border:1px solid #efd27b;border-radius:14px;padding:10px 12px;font-weight:800;text-align:center;margin-bottom:12px;font-size:17px;line-height:1.3}
.hold.good{background:#e7f8ee;border-color:#8fd3a8}.hold.bad{background:#fdecec;border-color:#f2a7a7}
.q{font-size:20px;font-weight:900;margin:4px 0 10px;text-align:center;line-height:1.3}
.ref{font-size:14px;color:#5b6478;font-weight:700;text-align:center;margin:-4px 0 10px}
.opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.btn{min-height:58px;border:2px solid #d7dcea;background:#fff;border-radius:16px;padding:10px 12px;font-size:18px;font-weight:800;color:var(--ink);cursor:pointer;touch-action:manipulation;text-align:center}
.btn .e{font-size:30px;display:block;line-height:1.1;margin-bottom:2px}
.btn.sel{outline:4px solid var(--accent)}.btn.right{background:#e7f8ee;border-color:var(--ok)}.btn.wrong{animation:shake .4s}
.btn:disabled{opacity:.45}
@keyframes shake{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.tfrow{display:flex;gap:12px;justify-content:center}.tfrow .btn{min-width:140px;font-size:22px}
.stmt{background:#fff;border-radius:16px;border:2px solid #d7dcea;padding:14px;font-size:20px;font-weight:800;text-align:center;margin-bottom:12px}
.bins{display:grid;gap:8px}.bin{background:#fff;border:3px dashed #c9a227;border-radius:16px;min-height:120px;padding:8px;cursor:pointer}
.bin h3{margin:0 0 6px;font-size:16px;text-align:center}.in{background:#e7f8ee;border-radius:10px;padding:6px 8px;margin:4px 0;font-weight:800;font-size:15px}
.cards{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}.cards .btn{flex:1 1 200px;max-width:100%}
.line{background:#fff;border-radius:14px;border:2px solid #d7dcea;padding:8px 10px;margin:6px 0;font-weight:800;font-size:17px;min-height:44px}
.line .n{display:inline-block;width:28px;height:28px;border-radius:50%;background:var(--accent);color:#fff;text-align:center;line-height:28px;margin-right:8px}
.sentence{background:#fff;border-radius:16px;border:2px solid #d7dcea;padding:14px;font-size:21px;font-weight:700;text-align:center;line-height:1.5;margin-bottom:12px}
.blank{display:inline-block;min-width:90px;border-bottom:4px solid var(--accent);color:var(--accent);font-weight:900}
.mcols{display:grid;grid-template-columns:1fr 1fr;gap:10px}.mcols .btn{width:100%;margin-bottom:8px;font-size:16px}
.slots{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:8px 0 14px}.slot{width:46px;height:54px;border-radius:10px;border-bottom:4px solid var(--accent);background:#fff;font-size:28px;font-weight:900;display:flex;align-items:center;justify-content:center}
.tiles{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.tiles .btn{width:58px;font-size:26px;padding:0}
.pic{position:relative;border-radius:14px;overflow:hidden;border:2px solid #d7dcea;touch-action:manipulation}.pic img{width:100%;display:block}
.hot{position:absolute;border:4px solid var(--ok);border-radius:12px;background:rgba(31,157,91,.15);pointer-events:none}
.find{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.find span{background:#fff;border:2px solid #d7dcea;border-radius:999px;padding:6px 12px;font-weight:800}.find span.got{background:#e7f8ee;border-color:var(--ok);text-decoration:line-through}
.reset{margin-top:16px;width:100%;min-height:48px;border:0;border-radius:12px;background:#efeaff;color:#4c43b8;font-weight:900;font-size:17px}
.win{text-align:center;font-size:64px;margin:10px 0}
@media (max-width:520px){h1{font-size:19px}.bin h3{font-size:13px}.in{font-size:13px}.bin{padding:6px}.q{font-size:18px}.sentence{font-size:18px}.tfrow .btn{min-width:110px}.mcols .btn{font-size:15px}}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
const app=document.getElementById('app')||document.body.appendChild(document.createElement('div'));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const mix=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
const WAIT=1500;
const HINT={quiz:'Tap the right answer.',tf:'True or false? Think about the paragraph.',sort:'Tap a card, then tap the box it belongs in.',order:'Tap them in the right order.',fill:'Tap the missing word.',match:'Tap one on the left, then its partner on the right.',unscramble:'Tap the letters in the right order.',find:'Tap each thing in the picture.'};
let R=0, S={}, busy=false, sent=false;
app.innerHTML=`<div class="wrap"><h1>${esc(G.title)}</h1><div class="sub">${esc(G.sub||'')}</div>
<div class="dots" id="dots"></div><div class="hold" id="hold"></div><div id="stage"></div>
<button class="reset" id="reset">↺ Reset</button></div>`;
const $=id=>document.getElementById(id);
function hold(m,cls){const h=$('hold');h.textContent=m;h.className='hold'+(cls?' '+cls:'')}
function dots(){$('dots').innerHTML=G.rounds.map((_,i)=>`<div class="dot ${i<R?'done':i===R?'on':''}"></div>`).join('')}
function later(fn){busy=true;setTimeout(()=>{busy=false;fn()},WAIT)}
function nextRound(){R++;S={};draw()}
function finished(){
  dots(); $('stage').innerHTML=`<div class="win">${esc(G.doneEmoji||'🎉')}</div>`; hold(G.done,'good');
  if(!sent&&window.parent!==window){sent=true;setTimeout(()=>{try{window.parent.postMessage({type:'smb-game-complete',game:G.id},'*')}catch(e){}},1200)}
}
function draw(){
  dots(); if(R>=G.rounds.length) return finished();
  const r=G.rounds[R]; hold(r.hint||HINT[r.type]||'Read the paragraph, then tap.');
  ({quiz,tf,sort,order,fill,match,unscramble,find})[r.type](r,$('stage'));
}
function wrongBtn(b,msg){b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');hold(msg||'Not quite. Look at the paragraph again.','bad')}
/* quiz: {q, ref?, img?, opts:[{t,e?,ok?,why?}]} */
function quiz(r,el){
  if(!S.order) S.order=mix(r.opts.map((o,i)=>i));
  el.innerHTML=`${r.img?`<div class="pic" style="margin-bottom:10px"><img src="${esc(r.img)}" alt=""></div>`:''}<div class="q">${esc(r.q)}</div>${r.ref?`<div class="ref">${esc(r.ref)}</div>`:''}
  <div class="opts">${S.order.map(i=>{const o=r.opts[i];return `<button class="btn" data-i="${i}">${o.e?`<span class="e">${o.e}</span>`:''}${esc(o.t)}</button>`}).join('')}</div>`;
  el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ if(busy) return; const o=r.opts[+b.dataset.i];
    if(o.ok){b.classList.add('right');el.querySelectorAll('[data-i]').forEach(x=>x.disabled=x!==b);hold(o.why||'Yes!','good');later(nextRound)}
    else wrongBtn(b,o.why)});
}
/* tf: {items:[{t,ok,why}]} one statement at a time */
function tf(r,el){
  S.k=S.k||0; const it=r.items[S.k];
  el.innerHTML=`<div class="q">${esc(r.q||'True or false?')} <span class="ref">(${S.k+1} of ${r.items.length})</span></div><div class="stmt">${esc(it.t)}</div>
  <div class="tfrow"><button class="btn" data-v="1"><span class="e">✅</span>True</button><button class="btn" data-v="0"><span class="e">❌</span>False</button></div>`;
  el.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{ if(busy) return;
    if((b.dataset.v==='1')===!!it.ok){b.classList.add('right');hold(it.why||'Right!','good');later(()=>{S.k++; if(S.k>=r.items.length) nextRound(); else tf(r,el)})}
    else wrongBtn(b,'Hmm, not quite. Read that one again.')});
}
/* sort: {bins:[..], cards:[{t,b,why}]} tap a card, then its bin */
function sort(r,el){
  S.put=S.put||[]; if(!S.order) S.order=mix(r.cards.map((c,i)=>i));
  const left=S.order.filter(i=>!S.put.includes(i));
  el.innerHTML=`${r.q?`<div class="q">${esc(r.q)}</div>`:''}<div class="bins" style="grid-template-columns:repeat(${r.bins.length},1fr)">${r.bins.map((b,i)=>`<div class="bin" data-b="${i}"><h3>${esc(b)}</h3>${S.put.filter(k=>r.cards[k].b===i).map(k=>`<div class="in">${esc(r.cards[k].t)}</div>`).join('')}</div>`).join('')}</div>
  <div class="cards">${left.map(i=>`<button class="btn${S.sel===i?' sel':''}" data-c="${i}">${esc(r.cards[i].t)}</button>`).join('')}</div>`;
  el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{if(busy) return;S.sel=+b.dataset.c;hold('Now tap the box it belongs in.');sort(r,el)});
  el.querySelectorAll('[data-b]').forEach(bin=>bin.onclick=()=>{ if(busy||S.sel==null) return; const c=r.cards[S.sel];
    if(c.b===+bin.dataset.b){S.put.push(S.sel);S.sel=null;hold(c.why||'Yes!','good');later(()=>{if(S.put.length===r.cards.length) nextRound(); else sort(r,el)});sort(r,el);busy=true}
    else {hold(c.no||'That one goes in the other box. Think about the paragraph.','bad')}});
}
/* order: {q, items:[...] in the right order} */
function order(r,el){
  S.done=S.done||[]; if(!S.order) S.order=mix(r.items.map((x,i)=>i));
  el.innerHTML=`<div class="q">${esc(r.q)}</div>${S.done.map((i,n)=>`<div class="line"><span class="n">${n+1}</span>${esc(r.items[i])}</div>`).join('')}
  <div class="cards">${S.order.filter(i=>!S.done.includes(i)).map(i=>`<button class="btn" data-o="${i}">${esc(r.items[i])}</button>`).join('')}</div>`;
  el.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{ if(busy) return; const i=+b.dataset.o;
    if(i===S.done.length){S.done.push(i); if(S.done.length===r.items.length){order(r,el);hold(r.why||'Right order!','good');later(nextRound)} else {hold('Yes! What comes next?','good');order(r,el)}}
    else wrongBtn(b,'Not yet. What happened before that?')});
}
/* fill: {before, after, ref?, opts:[...], ans} */
function fill(r,el){
  if(!S.order) S.order=mix(r.opts.slice());
  el.innerHTML=`<div class="sentence">${esc(r.before)} <span class="blank">${S.got?esc(r.ans):'&nbsp;?&nbsp;'}</span> ${esc(r.after||'')}</div>${r.ref?`<div class="ref">${esc(r.ref)}</div>`:''}
  <div class="opts">${S.order.map(o=>`<button class="btn" data-f="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{ if(busy) return;
    if(b.dataset.f===r.ans){S.got=1;fill(r,el);hold(r.why||'That is what it says!','good');later(nextRound)}
    else wrongBtn(b,'That word does not fit. Look at the paragraph.')});
}
/* match: {q, pairs:[{a,b}]} tap left, then its partner */
function match(r,el){
  S.ok=S.ok||[]; if(!S.L) {S.L=mix(r.pairs.map((p,i)=>i));S.R=mix(r.pairs.map((p,i)=>i))}
  el.innerHTML=`<div class="q">${esc(r.q||'Match them up.')}</div><div class="mcols"><div>${S.L.map(i=>`<button class="btn${S.ok.includes(i)?' right':''}${S.sel===i?' sel':''}" data-l="${i}" ${S.ok.includes(i)?'disabled':''}>${esc(r.pairs[i].a)}</button>`).join('')}</div>
  <div>${S.R.map(i=>`<button class="btn${S.ok.includes(i)?' right':''}" data-r="${i}" ${S.ok.includes(i)?'disabled':''}>${esc(r.pairs[i].b)}</button>`).join('')}</div></div>`;
  el.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{if(busy) return;S.sel=+b.dataset.l;hold('Now tap its partner.');match(r,el)});
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{ if(busy||S.sel==null) return;
    if(+b.dataset.r===S.sel){S.ok.push(S.sel);const p=r.pairs[S.sel];S.sel=null;hold(p.why||'A match!','good');match(r,el);if(S.ok.length===r.pairs.length) later(nextRound)}
    else wrongBtn(b,'Those two do not go together.')});
}
/* unscramble: {word, hint} tap the letters in order */
function unscramble(r,el){
  const W=r.word.toUpperCase(); S.n=S.n||0; if(!S.order) {do S.order=mix(W.split('').map((c,i)=>i)); while(W.length>2&&S.order.every((x,i)=>x===i))}
  S.used=S.used||[];
  el.innerHTML=`<div class="q">${esc(r.q||'Unscramble the word.')}</div>${r.ref?`<div class="ref">${esc(r.ref)}</div>`:''}<div class="slots">${W.split('').map((c,i)=>`<div class="slot">${i<S.n?c:''}</div>`).join('')}</div>
  <div class="tiles">${S.order.map(i=>`<button class="btn" data-u="${i}" ${S.used.includes(i)?'disabled':''}>${W[i]}</button>`).join('')}</div>`;
  el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{ if(busy) return; const i=+b.dataset.u;
    if(W[i]===W[S.n]){S.used.push(i);S.n++; if(S.n===W.length){unscramble(r,el);hold(r.why||('You spelled '+W+'!'),'good');later(nextRound)} else {hold(r.hint||'Keep going!');unscramble(r,el)}}
    else wrongBtn(b,'Not that letter yet. Hint: '+(r.hint||''))});
}
/* find: {img, q, spots:[{t,x,y,w,h,why}] in percent} tap each thing in the picture */
function find(r,el){
  S.got=S.got||[];
  el.innerHTML=`<div class="q">${esc(r.q)}</div><div class="find">${r.spots.map((s,i)=>`<span class="${S.got.includes(i)?'got':''}">${esc(s.t)}</span>`).join('')}</div>
  <div class="pic" id="pic"><img src="${esc(r.img)}" alt="">${S.got.map(i=>{const s=r.spots[i];return `<div class="hot" style="left:${s.x}%;top:${s.y}%;width:${s.w}%;height:${s.h}%"></div>`}).join('')}</div>`;
  $('pic').onclick=e=>{ if(busy) return; const b=$('pic').getBoundingClientRect(), px=(e.clientX-b.left)/b.width*100, py=(e.clientY-b.top)/b.height*100;
    const i=r.spots.findIndex((s,k)=>!S.got.includes(k)&&px>=s.x&&px<=s.x+s.w&&py>=s.y&&py<=s.y+s.h);
    if(i<0){hold('Look again — tap right on one of the things in the list.','bad');return}
    S.got.push(i);hold(r.spots[i].why||('Found: '+r.spots[i].t),'good');find(r,el);if(S.got.length===r.spots.length) later(nextRound)};
}
$('reset').onclick=()=>{R=0;S={};busy=false;draw()};
draw();
})();
