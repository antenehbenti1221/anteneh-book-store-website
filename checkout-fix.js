// Minimal paid-book checkout bridge. Does not alter catalogue, View modal, or layouts.
(function(){
  window.openCheckout=function(b){
    const modal=document.querySelector('#modal');
    const details=document.querySelector('#details');
    if(!modal||!details||!b)return;
    const session=window.STORE_AUTH?.session;
    if(!session){
      details.innerHTML='<div class="order-card"><p class="eyebrow">SIGN IN REQUIRED</p><h2>Please sign in first.</h2><p>You need to be signed in before creating an order.</p><button class="btn primary" id="checkoutSignIn">Sign in</button></div>';
      modal.classList.add('open');
      document.querySelector('#checkoutSignIn')?.addEventListener('click',()=>document.querySelector('#authBtn')?.click());
      return;
    }
    const meta=session.user?.user_metadata||{};
    const phone=meta.phone||'';
    details.innerHTML=`<div class="badge">${String(b.type||'Book')}</div><h2>${String(b.title||'Untitled').replace(/[&<>\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&#039;',"'":'&#039;'}[x]))}</h2><p><b>Price:</b> ${Number(b.price||0).toLocaleString()} ${String(b.currency||'ETB')}</p><div class="buy-note"><b>🇪🇹 Payment</b><br>Pay using CBE, CBE Birr, or Telebirr, then upload one clear receipt screenshot.</div><div class="checkout-form"><label>Payment receipt screenshot<input id="paymentProof" type="file" accept="image/*,.pdf" required></label>${phone?`<p class="small-note">Phone: ${phone}</p>`:'<p class="small-note">Please add your phone number to your account before submitting the order.</p>'}<p id="checkoutMsg" class="small-note" role="status"></p><button class="btn primary" id="submitOrderBtn" type="button">Submit order</button></div>`;
    modal.classList.add('open');
    document.querySelector('#submitOrderBtn')?.addEventListener('click',()=>window.submitOrder(b));
  };
})();
