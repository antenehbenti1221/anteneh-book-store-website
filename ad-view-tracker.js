(()=>{
  if(window.__ANTENEH_AD_VIEW_TRACKER__)return;window.__ANTENEH_AD_VIEW_TRACKER__=true;
  const KEY='anteneh_ad_visitor_id_v1';
  let id=localStorage.getItem(KEY);
  if(!id){id=crypto.randomUUID();localStorage.setItem(KEY,id)}
  const send=async()=>{try{const C=window.STORE_CONFIG||{},sb=window.sb||window.supabase?.createClient?.(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);if(!sb)return;await sb.rpc('record_ad_page_view',{p_visitor_id:id})}catch(_){}};
  const ad=document.getElementById('ads');
  if(!ad)return;
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){send();io.disconnect()}},{threshold:.15});io.observe(ad)}else send();
})();
