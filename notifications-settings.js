(()=>{
'use strict';
function init(){
  if(document.getElementById('nsBell')) return;
  const nav=document.getElementById('siteNav');
  if(!nav) return;
  const style=document.createElement('style');
  style.textContent=`
    #nsMenuItems{border-top:1px solid var(--line);margin-top:4px;padding-top:4px}
    #nsMenuItems .ns-menu-btn{display:block;width:100%;text-align:left;border:0;border-radius:10px;background:transparent;padding:14px 18px;font:inherit;font-weight:600;color:inherit;cursor:pointer}
    #nsMenuItems .ns-menu-btn:hover{background:var(--line)}
    #nsPanel{position:fixed;right:4%;top:82px;z-index:9999;width:min(390px,92vw);max-height:78vh;overflow:auto;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:20px;box-shadow:0 20px 60px #2f1f1230;padding:20px}
    #nsPanel h3{margin:0 0 12px}.ns-close{float:right;border:0;background:none;color:inherit;font-size:25px;cursor:pointer}
    .ns-item{padding:12px 0;border-bottom:1px solid var(--line)}.ns-item:last-child{border-bottom:0}
    .ns-toggle{display:flex;align-items:center;justify-content:space-between;gap:15px}
    .ns-switch{width:44px;height:24px;appearance:none;border-radius:99px;background:#bbb;position:relative;cursor:pointer}
    .ns-switch:checked{background:var(--green)}.ns-switch:after{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff}.ns-switch:checked:after{transform:translateX(20px)}
    .ns-theme{display:flex;gap:6px;flex-wrap:wrap}.ns-theme button{border:1px solid var(--line);background:var(--bg);color:var(--text);border-radius:10px;padding:8px 11px;cursor:pointer}
    html.theme-dark{--bg:#171717;--text:#f5f2eb;--muted:#c7c0b6;--line:#4b463f;--green:#35b875;--accent:#35b875;--gold:#e2b91a;--red:#e05b50}
    html.theme-dark body{background:#111;color:#f5f2eb}html.theme-dark header,html.theme-dark footer{background:#171717;color:#f5f2eb}
    html.theme-dark .nav a,html.theme-dark .brand,html.theme-dark .nav small{color:#f5f2eb}html.theme-dark .language-select,html.theme-dark .auth-button{background:#222;color:#f5f2eb;border-color:#4b463f}
    html.theme-dark .section.soft,html.theme-dark .ad-space{background:#1d1d1d;color:#f5f2eb}html.theme-dark .book,html.theme-dark .promo-card,html.theme-dark .order-card,html.theme-dark input,html.theme-dark select{background:#222;color:#f5f2eb;border-color:#4b463f}
    @media(max-width:700px){#nsPanel{top:70px;right:3%;width:94vw;max-height:82vh}}
  `;
  document.head.appendChild(style);
  const items=document.createElement('div');items.id='nsMenuItems';
  items.innerHTML='<button class="ns-menu-btn" id="nsBell" type="button">🔔 Notifications <span class="ns-badge" id="nsBadge" hidden>0</span></button><button class="ns-menu-btn" id="nsGear" type="button">⚙️ Settings</button>';
  const support=Array.from(nav.querySelectorAll('a')).find(a=>a.getAttribute('href')==='#support');
  if(support) nav.insertBefore(items,support); else nav.appendChild(items);
  const panel=document.createElement('div');panel.id='nsPanel';panel.hidden=true;document.body.appendChild(panel);
  const key='anteneh_store_settings_v1';
  let settings={theme:'system',newReleases:true,freeBooks:true,promotions:true,readingPosition:true};
  try{Object.assign(settings,JSON.parse(localStorage.getItem(key)||'{}'))}catch(e){}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(settings))}catch(e){}};
  const close=()=>panel.hidden=true;
  function theme(){
    const dark=settings.theme==='dark'||(settings.theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('theme-dark',dark);
  }
  function settingsPanel(){
    panel.hidden=false;
    panel.innerHTML='<button class="ns-close" id="nsClose">×</button><h3>⚙️ Settings</h3><div class="ns-item"><b>Appearance</b><div class="ns-theme"><button data-theme="light">☀️ Light</button><button data-theme="dark">🌙 Dark</button><button data-theme="system">🌓 System</button></div></div><div class="ns-item"><div class="ns-toggle"><b>🆕 New releases</b><input class="ns-switch" type="checkbox" data-setting="newReleases" '+(settings.newReleases?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><b>🆓 Free books</b><input class="ns-switch" type="checkbox" data-setting="freeBooks" '+(settings.freeBooks?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><b>📢 Promotions</b><input class="ns-switch" type="checkbox" data-setting="promotions" '+(settings.promotions?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><b>📖 Reading position</b><input class="ns-switch" type="checkbox" data-setting="readingPosition" '+(settings.readingPosition?'checked':'')+'></div></div>';
    panel.querySelector('#nsClose').onclick=close;
    panel.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{settings.theme=b.dataset.theme;save();theme();settingsPanel()});
    panel.querySelectorAll('[data-setting]').forEach(i=>i.onchange=()=>{settings[i.dataset.setting]=i.checked;save()});
  }
  async function notifications(){
    panel.hidden=false;panel.innerHTML='<button class="ns-close" id="nsClose">×</button><h3>🔔 Notifications</h3><div id="nsList" class="ns-item">Checking for new releases…</div>';panel.querySelector('#nsClose').onclick=close;
    const list=panel.querySelector('#nsList'),badge=items.querySelector('#nsBadge');
    if(!settings.newReleases){list.textContent='New-release notifications are turned off in Settings.';badge.hidden=true;return}
    try{
      const C=window.STORE_CONFIG||{},sb=window.sb;if(!sb||!C.SUPABASE_URL||!C.SUPABASE_PUBLISHABLE_KEY)throw Error('unavailable');
      const since=new Date(Date.now()-30*86400000).toISOString();
      const r=await sb.from('books').select('id,title,is_free,created_at').eq('is_published',true).is('deleted_at',null).gte('created_at',since).order('created_at',{ascending:false}).limit(12);
      if(r.error)throw r.error;const rows=r.data||[];
      if(!rows.length){list.textContent='No new releases in the last 30 days.';badge.hidden=true;return}
      list.innerHTML=rows.map(b=>'<div class="ns-item"><b>🆕 '+String(b.title||'New book').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))+'</b><small>'+(b.is_free?'🆓 New free book':'📚 New release')+' · '+new Date(b.created_at).toLocaleDateString()+'</small></div>').join('');badge.textContent=rows.length>9?'9+':rows.length;badge.hidden=false;
    }catch(e){list.textContent='Notifications are unavailable right now.';badge.hidden=true}
  }
  items.querySelector('#nsBell').onclick=notifications;
  items.querySelector('#nsGear').onclick=settingsPanel;
  document.addEventListener('click',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!items.contains(e.target))close()});
  theme();
  if(window.matchMedia){window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(settings.theme==='system')theme()})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();