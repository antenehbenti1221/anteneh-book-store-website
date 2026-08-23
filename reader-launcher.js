// Ebook-only access: keep audiobooks unchanged, but route ebooks through the read-only viewer.
(function(){
  const C=window.STORE_CONFIG||{};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&#039;',"'":'&#039;'}[x]));
  window.requestAccess=async function(orderId,bookId,token,kind){
    const out=document.querySelector('#orderStatus')||document.querySelector('#details');
    if(!out)return;
    out.innerHTML='<div class="order-card"><p>Preparing your secure access…</p></div>';
    try{
      const r=await fetch(`${C.SUPABASE_URL}/functions/v1/deliver-purchase`,{method:'POST',headers:{'Content-Type':'application/json',apikey:C.SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({access_token:token,kind})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Delivery unavailable');
      if(kind==='ebook'){
        // The read-only viewer needs the purchase access token so it can request the PDF
        // directly from the secure delivery function. Do not pass the signed Storage URL.
        const readerUrl=`reader.html#token=${encodeURIComponent(token)}&kind=ebook`;
        out.innerHTML=`<div class="order-card"><p class="eyebrow">✅ ACCESS READY</p><h3>📖 Ebook</h3><span>Your read-only secure access is ready.</span><a class="btn primary" href="${esc(readerUrl)}" target="_blank" rel="noopener">Open ebook</a><button class="btn" id="backPurchases">Back to My Purchases</button></div>`;
      }else{
        out.innerHTML=`<div class="order-card"><p class="eyebrow">✅ ACCESS READY</p><h3>🎧 Audiobook</h3><span>Your secure access is ready.</span><a class="btn primary" href="${esc(j.url)}" target="_blank" rel="noopener">Open audiobook</a><button class="btn" id="backPurchases">Back to My Purchases</button></div>`;
      }
      document.querySelector('#backPurchases').onclick=window.checkOrder;
    }catch(e){
      out.innerHTML=`<div class="order-card"><b>Could not open the purchase.</b><span>${esc(e.message)}</span><button class="btn" id="retryAccess">Try again</button></div>`;
      document.querySelector('#retryAccess').onclick=()=>window.requestAccess(orderId,bookId,token,kind);
    }
  };
})();
