/* Final admin History/Hidden/Show/Hide behavior fix. Keeps the existing admin UI and catalogue untouched. */
(() => {
  const hidden = new Set(JSON.parse(localStorage.getItem('adminHiddenOrders') || '[]'));
  let orders = [];
  let books = {};
  let view = 'pending';
  let loadSeq = 0;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&#039;'}[c]));
  const save = () => localStorage.setItem('adminHiddenOrders', JSON.stringify([...hidden]));

  function render() {
    const host = document.getElementById('ordersAdmin');
    if (!host) return;

    const pending = orders.filter(o => o.status === 'pending');
    const completed = orders.filter(o => o.status === 'approved' || o.status === 'rejected');
    const visibleHistory = completed.filter(o => !hidden.has(o.id));
    const hiddenHistory = completed.filter(o => hidden.has(o.id));

    let list;
    if (view === 'pending') list = pending;
    else if (view === 'archived') list = visibleHistory;
    else if (view === 'hidden') list = hiddenHistory;
    else list = orders.filter(o => !hidden.has(o.id));

    const header = `<div class="pay-card" style="margin:10px 0;padding:14px"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <button class="btn ${view==='pending'?'primary':''}" onclick="orderView('pending')">⏳ Pending (${pending.length})</button>
      <button class="btn ${view==='archived'?'primary':''}" onclick="orderView('archived')">📁 History (${visibleHistory.length})</button>
      <button class="btn ${view==='all'?'primary':''}" onclick="orderView('all')">All (${orders.filter(o=>!hidden.has(o.id)).length})</button>
      <button class="btn ${view==='hidden'?'primary':''}" onclick="orderView('hidden')">👁️ Hidden (${hiddenHistory.length})</button>
    </div><p class="small-note" style="margin:10px 0 0">Approved and rejected orders are kept in History. Hide moves an order to Hidden; Show again moves it back to History. Nothing is deleted.</p></div>`;

    const empty = !list.length ? `<div class="pay-card" style="margin:10px 0"><p>${view==='pending'?'🎉 No pending orders. You are all caught up.':view==='hidden'?'No hidden orders.':'No orders in this view.'}</p></div>` : '';

    const cards = list.map(o => {
      const status = String(o.status || '').toLowerCase();
      const pendingOrder = status === 'pending';
      const isHidden = hidden.has(o.id);
      const statusText = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';
      const statusIcon = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
      const action = pendingOrder
        ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><button class="btn primary" onclick="setOrder('${o.id}','approved')">Approve</button><button class="btn" onclick="setOrder('${o.id}','rejected')">Reject</button></div>`
        : `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><button class="btn" onclick="toggleHidden('${o.id}')">${isHidden ? '↩️ Show again' : '🙈 Hide'}</button></div>`;
      return `<div class="pay-card" style="margin:10px 0"><strong>${esc(books[o.book_id] || 'Book')}</strong><span>Customer: ${esc(o.customer_name)} · ${esc(o.customer_phone)}</span><span>${Number(o.amount).toLocaleString()} ${esc(o.currency)} · <b>${statusIcon} ${statusText}</b></span><span>Receipt: ${o.payment_proof_path ? `<button class="btn" onclick="viewProof('${esc(o.payment_proof_path)}')">📷 View receipt</button>` : 'Not uploaded'}</span><small>${new Date(o.created_at).toLocaleString()}</small>${action}<span id="order-feedback-${o.id}" class="small-note"></span></div>`;
    }).join('');

    host.innerHTML = header + empty + cards;
  }

  window.orderView = v => { view = v; render(); };

  window.toggleHidden = id => {
    if (hidden.has(id)) {
      hidden.delete(id);
      save();
      view = 'archived';
    } else {
      hidden.add(id);
      save();
      view = 'hidden';
    }
    render();
  };

  window.loadOrders = async function() {
    const host = document.getElementById('ordersAdmin');
    if (!host) return;
    const seq = ++loadSeq;
    host.innerHTML = 'Loading…';

    const result = await sb.from('orders').select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at').order('created_at',{ascending:false});
    if (seq !== loadSeq) return;
    if (result.error) { host.textContent = result.error.message; return; }

    const bookResult = await sb.from('books').select('id,title');
    if (seq !== loadSeq) return;
    books = {};
    (bookResult.data || []).forEach(b => { books[b.id] = b.title; });
    orders = result.data || [];
    render();
  };

  window.setOrder = async (id, status) => {
    const feedback = document.getElementById('order-feedback-' + id);
    if (feedback) feedback.textContent = status === 'approved' ? 'Approving payment…' : 'Rejecting payment…';
    const { error } = await sb.rpc('admin_update_order', { p_order_id:id, p_status:status });
    if (error) {
      if (feedback) feedback.textContent = '❌ ' + error.message;
      return;
    }
    await window.loadOrders();
  };

  setTimeout(() => window.loadOrders(), 0);
})();
