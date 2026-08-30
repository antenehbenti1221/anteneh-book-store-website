(()=>{
'use strict';
function init(){
  if(document.getElementById('nsBell')) return;
  const actions=document.querySelector('.nav-actions');
  if(!actions) return;
  const style=document.createElement('style');
  style.textContent=`#nsWrap{display:flex;align-items:center;gap:4px;flex:0 0 auto;order:2}#nsWrap .ns-btn{width:36px;height:36px;padding:0;border:1px solid var(--line);border-radius:50%;background:#fff;display:inline-flex!important;align-items:center;justify-content:center;font-size:17px;line-height:1;cursor:pointer;position:relative;z-index:50}#nsWrap .ns-badge{position:absolute;right:-2px;top:-3px;min-width:15px;height:15px;border-radius:99px;background:var(--red);color:#fff;font:700 9px/15px sans-serif;text-align:center}#nsPanel{position:fixed;right:4%;top:82px;z-index:9999;width:min(390px,92vw);max-height:78vh;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:20px;box-shadow:0 20px 60px #2f1f1230;padding:20px}#nsPanel h3{margin:0 0 12px}.ns-close{float:right;border:0;background:none;font-size:25px;cursor:pointer}.ns-item{padding:12px 0;border-bottom:1px solid var(--line)}.ns-item:last-child{border-bottom:0}.ns-toggle{display:flex;align-items:center;justify-content:space-between;gap:15px}.ns-switch{width:44px;height:24px;appearance:none;border-radius:99px;background:#bbb;position:relative;cursor:pointer}.ns-switch:checked{background:var(--green)}.ns-switch:after{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff}.ns-switch:checked:after{transform:translateX(20px)}.ns-theme{display:flex;gap:6px;flex-wrap:wrap}.ns-theme button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 11px;cursor:pointer}@media(max-width:700px){#nsWrap{gap:3px}#nsWrap .ns-btn{width:32px;height:32px;font-size:15px}.nav-actions{gap:3px}.language-select{max-width:88px;padding-left:7px;padding-right:7px}.nav-actions .auth-button{max-width:72px!important;min-width:72px!important;flex-basis:72px!important;font-size:11px!important;padding-left:6px!important;padding-right:6px!important}.menu{width:34px;flex:0 0 34px;font-size:22px}}@media(max-width:520px){#nsWrap .ns-btn{width:29px;height:29px;font-size:13px}.language-select{max-width:62px;width:62px}.nav-actions .auth-button{max-width:64px!important;min-width:64px!important;flex-basis:64px!important;font-size:10px!important}.menu{width:30px;flex-basis:30px;font-size:20px}}`;
  document.head.appendChild(style);
  const wrap=document.createElement('div');wrap.id='nsWrap';
  wrap.innerHTML='<button class="ns-btn" id="nsBell" type="button" aria-label="Notifications" title="Notifications">🔔<span class="ns-badge" id="nsBadge" hidden>0</span></button><button class="ns-btn" id="nsGear" type="button" aria-label="Settings" title="Settings">⚙️</button><button class="ns-btn" id="nsShare" type="button" aria-label="Share store" title="Share store">🔗</button>';
  const auth=actions.querySelector('#authBtn');
  actions.insertBefore(wrap,auth||actions.firstChild);
  const panel=document.createElement('div');panel.id='nsPanel';panel.hidden=true;document.body.appendChild(panel);
  const key='anteneh_store_settings_v1';
  let settings={theme:'system',newReleases:true,freeBooks:true,promotions:true,readingPosition:true};
  try{Object.assign(settings,JSON.parse(localStorage.getItem(key)||'{}'))}catch(e){}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(settings))}catch(e){}};
  const close=()=>panel.hidden=true;
  function theme(){document.documentElement.classList.toggle('theme-dark',settings.theme==='dark'||(settings.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))}
  function settingsPanel(){
    panel.hidden=false;
    panel.innerHTML='<button class="ns-close" id="nsClose">×</button><h3>⚙️ Settings</h3><div class="ns-item"><b>Appearance</b><div class="ns-theme"><button data-theme="light">☀️ Light</button><button data-theme="dark">🌙 Dark</button><button data-theme="system">🌓 System</button></div></div><div class="ns-item"><div class="ns-toggle"><b>🆕 New releases</b><input class="ns-switch" type="checkbox" data-setting="newReleases" '+(settings.newReleases?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><b>🆓 Free books</b><input class="ns-switch" type="checkbox" data-setting="freeBooks" '+(settings.freeBooks?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><b>📢 Promotions</b><input class="ns-switch" type="checkbox" data-setting="promotions" '+(settings.promotions?'checked':'')+'></div></div><div class="ns-item"><div class="ns-toggle"><b>📖 Reading position</b><input class="ns-switch" type="checkbox" data-setting="readingPosition" '+(settings.readingPosition?'checked':'')+'></div></div>';
    panel.querySelector('#nsClose').onclick=close;
    panel.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{settings.theme=b.dataset.theme;save();theme();settingsPanel()});
    panel.querySelectorAll('[data-setting]').forEach(i=>i.onchange=()=>{settings[i.dataset.setting]=i.checked;save()});
  }
  async function notifications(){
    panel.hidden=false;panel.innerHTML='<button class="ns-close" id="nsClose">×</button><h3>🔔 Notifications</h3><div id="nsList" class="ns-item">Checking for new releases…</div>';panel.querySelector('#nsClose').onclick=close;
    const list=panel.querySelector('#nsList'),badge=wrap.querySelector('#nsBadge');
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
  wrap.querySelector('#nsBell').onclick=notifications;wrap.querySelector('#nsGear').onclick=settingsPanel;
  wrap.querySelector('#nsShare').onclick=async()=>{const url=new URL('./',location.href).href;try{if(navigator.share)await navigator.share({title:'Anteneh Book Store 🇪🇹',text:'Discover books at Anteneh Book Store.',url});else{await navigator.clipboard.writeText(url);alert('Store link copied.')}}catch(e){}};
  document.addEventListener('click',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!wrap.contains(e.target))close()});
  theme();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();