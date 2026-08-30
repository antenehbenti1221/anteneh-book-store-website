(()=>{
'use strict';
function init(){
  if(window.__ANTENEH_NS_READY__) return;
  const actions=document.querySelector('.nav-actions');
  if(!actions) return;
  window.__ANTENEH_NS_READY__=true;
  const key='anteneh_store_settings_v1';
  let settings={theme:'system',newReleases:true,freeBooks:true,promotions:true,readingPosition:true};
  try{settings=Object.assign(settings,JSON.parse(localStorage.getItem(key)||'{}'));}catch(e){}
  function save(){try{localStorage.setItem(key,JSON.stringify(settings));}catch(e){}}
  const style=document.createElement('style');
  style.textContent='.ns-actions{display:flex!important;align-items:center;gap:5px;margin-left:4px;flex:0 0 auto!important;visibility:visible!important;opacity:1!important}.ns-btn{position:relative;border:1px solid var(--line);background:#fff;border-radius:999px;width:38px;height:38px;cursor:pointer;font-size:18px;display:inline-flex!important;align-items:center;justify-content:center;visibility:visible!important;opacity:1!important}.ns-badge{position:absolute;right:-2px;top:-3px;min-width:16px;height:16px;padding:0 3px;border-radius:99px;background:var(--red);color:#fff;font:700 10px/16px sans-serif}.ns-panel{position:fixed;right:4%;top:82px;z-index:9999;width:min(390px,92vw);max-height:78vh;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:20px;box-shadow:0 20px 60px #2f1f1230;padding:20px}.ns-panel h3{margin:0 0 12px}.ns-item{padding:12px 0;border-bottom:1px solid var(--line)}.ns-item:last-child{border-bottom:0}.ns-item b{display:block}.ns-item small{display:block;color:var(--muted);margin-top:3px}.ns-toggle{display:flex;align-items:center;justify-content:space-between;gap:15px}.ns-switch{width:44px;height:24px;appearance:none;border-radius:99px;background:#bbb;position:relative;cursor:pointer}.ns-switch:checked{background:var(--green)}.ns-switch:after{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff}.ns-switch:checked:after{transform:translateX(20px)}.ns-theme{display:flex;gap:6px;flex-wrap:wrap}.ns-theme button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 11px;cursor:pointer}.ns-close{float:right;border:0;background:none;font-size:25px;cursor:pointer}@media(max-width:700px){.ns-actions{gap:3px;margin-left:2px}.ns-btn{width:32px;height:32px;font-size:15px}.ns-actions #nsShare{display:none!important}}@media(max-width:520px){.ns-actions{gap:2px}.ns-btn{width:30px;height:30px;font-size:14px}}';
  document.head.appendChild(style);
  const wrap=document.createElement('div');
  wrap.className='ns-actions';
  wrap.innerHTML='<button class="ns-btn" id="nsBell" type="button" aria-label="Notifications" title="Notifications">🔔<span class="ns-badge" id="nsBadge" hidden>0</span></button><button class="ns-btn" id="nsGear" type="button" aria-label="Settings" title="Settings">⚙️</button><button class="ns-btn" id="nsShare" type="button" aria-label="Share store" title="Share store">🔗</button>';
  const auth=actions.querySelector('#authBtn')||actions.querySelector('.auth-button');
  actions.insertBefore(wrap,auth||null);
  const panel=document.createElement('div');panel.className='ns-panel';panel.hidden=true;document.body.appendChild(panel);
  function close(){panel.hidden=true;}
  function openSettings(){
    panel.hidden=false;
    panel.innerHTML='<button class="ns-close" id="nsClose">×</button><h3>⚙️ Settings</h3><div class="ns-item"><b>Appearance</b><div class="ns-theme"><button data-theme="light">☀️ Light</button><button data-theme="dark">🌙 Dark</button><button data-theme="system">🌓 System</button></div></div><div class="ns-item"><div class="ns-toggle"><div><b>🆕 New releases</b><small>Show new-book notifications</small></div><input class="ns-switch" type="checkbox" data-setting="newReleases" '+(settings.newReleases?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><div><b>🆓 Free books</b><small>Notify when a new free book is added</small></div><input class="ns-switch" type="checkbox" data-setting="freeBooks" '+(settings.freeBooks?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><div><b>📢 Promotions</b><small>Show promotion notifications</small></div><input class="ns-switch" type="checkbox" data-setting="promotions" '+(settings.promotions?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><div><b>📖 Reading position</b><small>Remember reading position when supported</small></div><input class="ns-switch" type="checkbox" data-setting="readingPosition" '+(settings.readingPosition?'checked':'')+'></div></div>';
    panel.querySelector('#nsClose').onclick=close;
    panel.querySelectorAll('[data-theme]').forEach(function(b){b.onclick=function(){settings.theme=b.getAttribute('data-theme');save();applyTheme();openSettings();};});
    panel.querySelectorAll('[data-setting]').forEach(function(i){i.onchange=function(){settings[i.getAttribute('data-setting')]=i.checked;save();};});
  }
  function openNotifications(){
    panel.hidden=false;panel.innerHTML='<button class="ns-close" id="nsClose">×</button><h3>🔔 Notifications</h3><div id="nsList" class="ns-item">Checking for new releases…</div>';panel.querySelector('#nsClose').onclick=close;loadNotifications();
  }
  function applyTheme(){document.documentElement.classList.remove('theme-dark');if(settings.theme==='dark'||(settings.theme==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('theme-dark');}
  applyTheme();
  wrap.querySelector('#nsBell').onclick=openNotifications;
  wrap.querySelector('#nsGear').onclick=openSettings;
  wrap.querySelector('#nsShare').onclick=async function(){const url=new URL('./',location.href).href;try{if(navigator.share)await navigator.share({title:'Anteneh Book Store 🇪🇹',text:'Discover books at Anteneh Book Store.',url:url});else{await navigator.clipboard.writeText(url);alert('Store link copied.');}}catch(e){}};
  document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&!wrap.contains(e.target))close();});
  async function loadNotifications(){
    const list=panel.querySelector('#nsList'),badge=wrap.querySelector('#nsBadge');
    if(!settings.newReleases){list.textContent='New-release notifications are turned off in Settings.';badge.hidden=true;return;}
    try{
      const C=window.STORE_CONFIG||{};const sb=window.sb;
      if(!sb||!C.SUPABASE_URL||!C.SUPABASE_PUBLISHABLE_KEY){list.textContent='Notifications are unavailable right now.';badge.hidden=true;return;}
      const since=new Date(Date.now()-30*86400000).toISOString();
      const r=await sb.from('books').select('id,title,is_free,created_at').eq('is_published',true).is('deleted_at',null).gte('created_at',since).order('created_at',{ascending:false}).limit(12);
      if(r.error)throw r.error;const rows=r.data||[];
      if(!rows.length){list.textContent='No new releases in the last 30 days.';badge.hidden=true;return;}
      list.innerHTML=rows.map(function(b){return '<div class="ns-item"><b>🆕 '+escapeHtml(b.title||'New book')+'</b><small>'+(b.is_free?'🆓 New free book':'📚 New release')+' · '+new Date(b.created_at).toLocaleDateString()+'</small></div>';}).join('');
      badge.textContent=rows.length>9?'9+':String(rows.length);badge.hidden=false;
    }catch(e){list.textContent='Notifications are unavailable right now.';badge.hidden=true;}
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();