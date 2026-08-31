(()=>{
'use strict';
function init(){
  if(document.getElementById('nsBell')) return;
  const nav=document.getElementById('siteNav'); if(!nav) return;
  const style=document.createElement('style');
  style.textContent=`
#nsMenuItems{border-top:1px solid var(--line);margin-top:4px;padding-top:4px}
#nsMenuItems .ns-menu-btn{display:block;width:100%;text-align:left;border:0;border-radius:10px;background:transparent;padding:14px 18px;font:inherit;font-weight:600;color:inherit;cursor:pointer}
#nsMenuItems .ns-menu-btn:hover{background:var(--line)}
#nsPanel{position:fixed;right:4%;top:82px;z-index:9999;width:min(390px,92vw);max-height:78vh;overflow:auto;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:20px;box-shadow:0 20px 60px #2f1f1230;padding:20px}
#nsPanel h3{margin:0 0 12px}.ns-close{float:right;border:0;background:none;color:inherit;font-size:25px;cursor:pointer}.ns-item{padding:12px 0;border-bottom:1px solid var(--line)}.ns-item:last-child{border-bottom:0}
html.theme-dark{color-scheme:dark;--bg:#111827;--text:#f8fafc;--muted:#cbd5e1;--line:#475569;--green:#34d399;--accent:#34d399;--gold:#f2c94c;--red:#f87171}
html.theme-dark body{background:#0b1220!important;color:#f8fafc!important}
html.theme-dark header,html.theme-dark footer{background:#111827!important;color:#f8fafc!important}
html.theme-dark .nav a,html.theme-dark .brand,html.theme-dark .brand b,html.theme-dark .nav small{color:#f8fafc!important}
html.theme-dark .section,html.theme-dark .hero,html.theme-dark main{color:#f8fafc}
html.theme-dark .section.soft,html.theme-dark .ad-space{background:#172033!important;color:#f8fafc!important}
html.theme-dark .book,html.theme-dark .promo-card,html.theme-dark .order-card,html.theme-dark input,html.theme-dark select,html.theme-dark textarea{background:#1e293b!important;color:#f8fafc!important;border-color:#475569!important}
html.theme-dark input::placeholder,html.theme-dark textarea::placeholder{color:#cbd5e1!important}
html.theme-dark h1,html.theme-dark h2,html.theme-dark h3,html.theme-dark h4,html.theme-dark p,html.theme-dark li,html.theme-dark span,html.theme-dark label,html.theme-dark small,html.theme-dark strong,html.theme-dark b{color:inherit}
html.theme-dark .muted,html.theme-dark .lead,html.theme-dark .eyebrow{color:#cbd5e1!important}
html.theme-dark .btn{color:#f8fafc;border-color:#64748b}
html.theme-dark .btn.primary{color:#07130d}
html.theme-dark .language-select,html.theme-dark .auth-button{background:#1e293b!important;color:#f8fafc!important;border-color:#475569!important}
html.theme-dark .modal-card{background:#172033!important;color:#f8fafc!important;border-color:#475569!important}
@media(max-width:700px){#nsPanel{top:70px;right:3%;width:94vw;max-height:82vh}}
`;
  document.head.appendChild(style);
  const items=document.createElement('div');items.id='nsMenuItems';
  items.innerHTML='<button class="ns-menu-btn" id="nsBell" type="button">🔔 Notifications <span class="ns-badge" id="nsBadge" hidden>0</span></button>';
  const support=Array.from(nav.querySelectorAll('a')).find(a=>a.getAttribute('href')==='#support');
  if(support) nav.insertBefore(items,support); else nav.appendChild(items);
  const panel=document.createElement('div');panel.id='nsPanel';panel.hidden=true;document.body.appendChild(panel);
  const close=()=>panel.hidden=true;
  async function notifications(){panel.hidden=false;panel.innerHTML='<button class="ns-close" id="nsClose">×</button><h3>🔔 Notifications</h3><div id="nsList" class="ns-item">Checking for new releases…</div>';panel.querySelector('#nsClose').onclick=close;const list=panel.querySelector('#nsList'),badge=items.querySelector('#nsBadge');try{const C=window.STORE_CONFIG||{},sb=window.sb;if(!sb||!C.SUPABASE_URL||!C.SUPABASE_PUBLISHABLE_KEY)throw Error('unavailable');const since=new Date(Date.now()-30*86400000).toISOString();const r=await sb.from('books').select('id,title,is_free,created_at').eq('is_published',true).is('deleted_at',null).gte('created_at',since).order('created_at',{ascending:false}).limit(12);if(r.error)throw r.error;const rows=r.data||[];if(!rows.length){list.textContent='No new releases in the last 30 days.';badge.hidden=true;return}list.innerHTML=rows.map(b=>'<div class="ns-item"><b>🆕 '+String(b.title||'New book').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))+'</b><small>'+(b.is_free?'🆓 New free book':'📚 New release')+' · '+new Date(b.created_at).toLocaleDateString()+'</small></div>').join('');badge.textContent=rows.length>9?'9+':rows.length;badge.hidden=false}catch(e){list.textContent='Notifications are unavailable right now.';badge.hidden=true}}
  items.querySelector('#nsBell').onclick=notifications;
  document.addEventListener('click',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!items.contains(e.target))close()});
  const savedTheme=localStorage.getItem('anteneh_store_theme');
  const applyTheme=()=>{const dark=savedTheme==='dark';document.documentElement.classList.toggle('theme-dark',dark)};
  applyTheme();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();