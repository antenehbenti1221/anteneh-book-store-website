/* Admin order list: pending stays active; completed orders can be hidden from this admin view without deleting history. */
(() => {
  const $ = id => document.getElementById(id);
  let allOrders = [];
  let booksBy = {};
  let view = 'pending';
  const hidden = new Set(JSON.parse(localStorage.getItem('adminHiddenOrders') || '[]'));
  const saveHidden = () => localStorage.setItem('adminHiddenOrders', JSON.stringify([...hidden]));
  const esc2 = s => String(s ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&#039;'}[x]));

  function renderOrders() {
    const host = $('ordersAdmin');
    if (!host) return;
    const pending = allOrders.filter(o => o.status === 'pending');
    const approved = allOrders.filter(o => o.status === 'approved');
    const rejected = allOrders.filter(o => o.status === 'rejected');
    const archived = approved.concat(rejected);
    let list = view === 'pending' ? pending : view === 'archived' ? archived.filter(o => !hidden.has(o.id)) : view === 'all' ? allOrders.filter(o => !hidden.has(o.id)) : archived;

    host.innerHTML = `<div class="pay-card" style="margin:10px 0;padding:14px"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><button class="btn ${view==='pending'?'primary':''}" onclick="orderView('pending')">⏳ Pending (${pending.length})</button><button class="btn ${view==='archived'?'primary':''}" onclick="orderView('archived')">📁 History (${archived.filter(o=>!hidden.has(o.id)).length})</button><button class="btn ${view==='all'?'primary':''}" onclick="orderView('all')">All (${allOrders.filter(o=>!hidden.has(o.id)).length})</button><button class="btn ${view==='hidden'?'primary':''}" onclick="orderView('hidden')">👁️ Hidden (${archived.filter(o=>hidden.has(o.id)).length})</button></div><p class="small-note" style="margin:10px 0 0">Approved and rejected orders move to History. Hide removes an item from normal admin views only; it is never deleted.</p></div>`;

    if (view === 'hidden') list = archived.filter(o => hidden.has(o.id));
    if (!list.length) { host.innerHTML += `<div class="pay-card" style="margin:10px 0"><p>${view==='pending'?'🎉 No pending orders. You are all caught up.':view==='hidden'?'No hidden orders.':'No orders in this view.'}</p></div>`; return; }

    host.innerHTML += list.map(o => {
      const status = String(o.status || '').toLowerCase();
      const isPending = status === 'pending';
      const statusText = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';
      const statusIcon = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
      const isHidden = hidden.has(o.id);
      return `<div class="pay-card" style="margin:10px 0"><strong>${esc2(booksBy[o.book_id] || 'Book')}</strong><span>Customer: ${esc2(o.customer_name)} · ${esc2(o.customer_phone)}</span><span>${Number(o.amount).toLocaleString()} ${esc2(o.currency)} · <b>${statusIcon} ${statusText}</b></span><span>Receipt: ${o.payment_proof_path ? `<button class="btn" onclick="viewProof('${esc2(o.payment_proof_path)}')">📷 View receipt</button>` : 'Not uploaded'}</span><small>${new Date(o.created_at).toLocaleString()}</small>${isPending ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><button class="btn primary" onclick="setOrder('${o.id}','approved')">Approve</button><button class="btn" onclick="setOrder('${o.id}','rejected')">Reject</button></div>` : `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><button class="btn" onclick="toggleHidden('${o.id}')">${isHidden ? '↩️ Show again' : '🙈 Hide'}</button></div>`}<span id="order-feedback-${o.id}" class="small-note"></span></div>`;
    }).join('');
  }

  window.orderView = v => { view = v; renderOrders(); };
  window.toggleHidden = id => { if (hidden.has(id)) hidden.delete(id); else hidden.add(id); saveHidden(); renderOrders(); };

  window.loadOrders = async function() {
    const host = $('ordersAdmin'); if (!host) return; host.innerHTML = 'Loading…';
    const {data, error} = await sb.from('orders').select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at').order('created_at',{ascending:false});
    if (error) { host.textContent = error.message; return; }
    const b = (await sb.from('books').select('id,title')).data || []; booksBy = {}; b.forEach(x => booksBy[x.id] = x.title); allOrders = data || []; renderOrders();
  };

  window.setOrder = async (id,status) => {
    const feedback = $('order-feedback-'+id); const buttons = document.querySelectorAll(`button[onclick*="setOrder('${id}'"]`); buttons.forEach(b=>b.disabled=true); if(feedback) feedback.textContent=status==='approved'?'Approving payment…':'Rejecting payment…';
    const {error}=await sb.rpc('admin_update_order',{p_order_id:id,p_status:status});
    if(error){if(feedback)feedback.textContent='❌ '+error.message;buttons.forEach(b=>b.disabled=false);return;}
    if(feedback)feedback.textContent=status==='approved'?'✅ Payment approved — moved to History.':'✅ Payment rejected — moved to History.'; setTimeout(()=>window.loadOrders(),500);
  };

  setTimeout(()=>window.loadOrders(),0);
})();
