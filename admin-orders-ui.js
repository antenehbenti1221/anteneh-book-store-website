/* Admin Orders UI — single instance only. Keeps completed orders in History; Hide moves to Hidden; Show again returns to History. */
(() => {
  if (window.__ANTENEH_ADMIN_ORDERS_UI__) return;
  window.__ANTENEH_ADMIN_ORDERS_UI__ = true;

  const $ = id => document.getElementById(id);
  let allOrders = [];
  let booksBy = {};
  let currentView = 'pending';
  let loadToken = 0;
  let loading = false;

  const hiddenKey = 'anteneh_admin_hidden_orders_v2';
  let hiddenIds = new Set();
  try { hiddenIds = new Set(JSON.parse(localStorage.getItem(hiddenKey) || '[]')); } catch (_) {}
  const persistHidden = () => localStorage.setItem(hiddenKey, JSON.stringify([...hiddenIds]));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function normalStatus(o) { return String(o?.status || '').trim().toLowerCase(); }
  function completed(o) { const s = normalStatus(o); return s === 'approved' || s === 'rejected'; }

  function getLists() {
    const pending = allOrders.filter(o => normalStatus(o) === 'pending');
    const completedOrders = allOrders.filter(completed);
    const history = completedOrders.filter(o => !hiddenIds.has(String(o.id)));
    const hidden = completedOrders.filter(o => hiddenIds.has(String(o.id)));
    const visibleAll = allOrders.filter(o => !hiddenIds.has(String(o.id)));
    return { pending, history, hidden, visibleAll };
  }

  function render() {
    const host = $('ordersAdmin');
    if (!host) return;
    const { pending, history, hidden, visibleAll } = getLists();
    const lists = { pending, history, hidden, all: visibleAll };
    const list = lists[currentView] || pending;

    host.replaceChildren();

    const controls = document.createElement('div');
    controls.className = 'pay-card admin-order-controls';
    controls.style.cssText = 'margin:10px 0;padding:14px';
    controls.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <button type="button" class="btn ${currentView==='pending'?'primary':''}" data-order-view="pending">⏳ Pending <span>(${pending.length})</span></button>
        <button type="button" class="btn ${currentView==='history'?'primary':''}" data-order-view="history">📁 History <span>(${history.length})</span></button>
        <button type="button" class="btn ${currentView==='all'?'primary':''}" data-order-view="all">All <span>(${visibleAll.length})</span></button>
        <button type="button" class="btn ${currentView==='hidden'?'primary':''}" data-order-view="hidden">👁️ Hidden <span>(${hidden.length})</span></button>
      </div>
      <p class="small-note" style="margin:10px 0 0">Hide removes an approved/rejected order from the visible History. Show again returns it to History. Orders are never deleted.</p>`;
    host.appendChild(controls);

    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'pay-card';
      empty.style.margin = '10px 0';
      empty.innerHTML = `<p>${currentView==='pending' ? '🎉 No pending orders.' : currentView==='hidden' ? 'No hidden orders.' : 'No orders in this view.'}</p>`;
      host.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach(o => {
      const id = String(o.id);
      const status = normalStatus(o);
      const isPending = status === 'pending';
      const isHidden = hiddenIds.has(id);
      const card = document.createElement('div');
      card.className = 'pay-card admin-order-card';
      card.style.margin = '10px 0';
      const statusText = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';
      const statusIcon = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
      card.innerHTML = `
        <strong>${esc(booksBy[o.book_id] || 'Book')}</strong>
        <span>Customer: ${esc(o.customer_name)}${o.customer_phone ? ' · ' + esc(o.customer_phone) : ''}</span>
        <span>${Number(o.amount || 0).toLocaleString()} ${esc(o.currency || 'ETB')} · <b>${statusIcon} ${statusText}</b></span>
        <span>Receipt: ${o.payment_proof_path ? '<button type="button" class="btn" data-receipt="'+esc(o.payment_proof_path)+'">📷 View receipt</button>' : 'Not uploaded'}</span>
        <small>${o.created_at ? new Date(o.created_at).toLocaleString() : ''}</small>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
          ${isPending ? '<button type="button" class="btn primary" data-order-action="approve">Approve</button><button type="button" class="btn" data-order-action="reject">Reject</button>' : '<button type="button" class="btn" data-order-action="toggle-hidden">'+(isHidden ? '↩️ Show again' : '🙈 Hide')+'</button>'}
        </div>
        <span class="small-note" data-feedback></span>`;
      card.dataset.orderId = id;
      fragment.appendChild(card);
    });
    host.appendChild(fragment);
  }

  async function loadOrders() {
    const host = $('ordersAdmin');
    if (!host || !window.sb) return;
    const token = ++loadToken;
    if (!loading) host.dataset.loading = '1';
    loading = true;
    try {
      const result = await sb.from('orders')
        .select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at')
        .order('created_at', { ascending: false });
      if (token !== loadToken) return;
      if (result.error) { host.textContent = result.error.message; return; }

      const booksResult = await sb.from('books').select('id,title');
      if (token !== loadToken) return;
      if (booksResult.error) { host.textContent = booksResult.error.message; return; }

      booksBy = {};
      (booksResult.data || []).forEach(b => { booksBy[String(b.id)] = b.title; });
      allOrders = Array.isArray(result.data) ? result.data : [];

      /* Remove stale hidden IDs that no longer belong to completed orders. */
      const valid = new Set(allOrders.filter(completed).map(o => String(o.id)));
      const cleaned = [...hiddenIds].filter(id => valid.has(String(id)));
      if (cleaned.length !== hiddenIds.size) { hiddenIds = new Set(cleaned); persistHidden(); }

      render();
    } finally {
      if (token === loadToken) { loading = false; delete host.dataset.loading; }
    }
  }

  async function setOrder(id, status, card) {
    const feedback = card?.querySelector('[data-feedback]');
    const buttons = card?.querySelectorAll('button') || [];
    buttons.forEach(b => b.disabled = true);
    if (feedback) feedback.textContent = status === 'approved' ? 'Approving payment…' : 'Rejecting payment…';
    const { error } = await sb.rpc('admin_update_order', { p_order_id: id, p_status: status });
    if (error) {
      if (feedback) feedback.textContent = '❌ ' + error.message;
      buttons.forEach(b => b.disabled = false);
      return;
    }
    await loadOrders();
  }

  async function viewReceipt(path) {
    if (!path) return;
    const { data, error } = await sb.storage.from('payment-proofs').createSignedUrl(path, 600);
    if (error || !data?.signedUrl) { alert('Receipt could not be opened: ' + (error?.message || 'Unknown error')); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  function handleClick(event) {
    const host = $('ordersAdmin');
    if (!host || !host.contains(event.target)) return;

    const viewButton = event.target.closest('[data-order-view]');
    if (viewButton) {
      event.preventDefault();
      currentView = viewButton.dataset.orderView;
      render();
      return;
    }

    const receiptButton = event.target.closest('[data-receipt]');
    if (receiptButton) {
      event.preventDefault();
      viewReceipt(receiptButton.dataset.receipt);
      return;
    }

    const actionButton = event.target.closest('[data-order-action]');
    if (!actionButton) return;
    event.preventDefault();
    const card = actionButton.closest('[data-order-id]');
    if (!card) return;
    const id = String(card.dataset.orderId);
    const action = actionButton.dataset.orderAction;

    if (action === 'toggle-hidden') {
      if (hiddenIds.has(id)) {
        hiddenIds.delete(id);
        persistHidden();
        currentView = 'history';
      } else {
        hiddenIds.add(id);
        persistHidden();
        currentView = 'hidden';
      }
      render();
      return;
    }

    if (action === 'approve') setOrder(id, 'approved', card);
    if (action === 'reject') setOrder(id, 'rejected', card);
  }

  document.addEventListener('click', handleClick);

  window.orderView = view => { currentView = view; render(); };
  window.toggleHidden = id => {
    const key = String(id);
    if (hiddenIds.has(key)) { hiddenIds.delete(key); currentView = 'history'; }
    else { hiddenIds.add(key); currentView = 'hidden'; }
    persistHidden();
    render();
  };
  window.loadOrders = loadOrders;

  /* Initial render/load is deliberately delayed until the page's auth refresh has created sb. */
  setTimeout(loadOrders, 0);
})();

/* Catalogue styling is kept separate from the order logic above. */
(() => {
  if (window.__ANTENEH_ADMIN_CATALOGUE_UI__) return;
  window.__ANTENEH_ADMIN_CATALOGUE_UI__ = true;
  const style = document.createElement('style');
  style.textContent = `
    #booksAdmin .catalogue-sections{display:grid;gap:18px;margin-top:14px}
    #booksAdmin .catalogue-section{margin:0}
    #booksAdmin .catalogue-section-heading{display:flex;align-items:center;gap:7px;margin:0 0 7px;padding:0 2px;font-size:1rem}
    #booksAdmin .catalogue-section-heading .catalogue-icon{font-size:15px;line-height:1}
    #booksAdmin .catalogue-section-heading h4{margin:0;font-size:1rem}
    #booksAdmin .catalogue-section-count{font-size:.78rem;font-weight:600;opacity:.62}
    #booksAdmin .catalogue-section-list{display:grid;gap:6px}
    #booksAdmin .catalogue-item-title{display:block;width:100%;padding:12px 14px;border:0;background:transparent;text-align:left;font:inherit;font-weight:700;font-size:.86rem;cursor:pointer;color:inherit}
    #booksAdmin .catalogue-item-title:after{content:'⌄';float:right;opacity:.5;transition:transform .18s ease}
    #booksAdmin .catalogue-item-title[aria-expanded="true"]:after{transform:rotate(180deg)}
    #booksAdmin .catalogue-item{overflow:hidden;margin:0!important}
    #booksAdmin .catalogue-item-details{display:none;padding:0 14px 12px}
    #booksAdmin .catalogue-item.open .catalogue-item-details{display:block}
    #booksAdmin .catalogue-item-details .btn{padding:8px 12px;font-size:.9rem}
  `;
  document.head.appendChild(style);

  function polishCatalogue() {
    const host = document.getElementById('booksAdmin');
    if (!host) return;
    host.querySelectorAll(':scope > .pay-card').forEach(card => {
      if (card.dataset.cataloguePolished === '1') return;
      const title = card.querySelector(':scope > b');
      if (!title) return;
      card.dataset.cataloguePolished = '1';
      card.classList.add('catalogue-item');
      const details = document.createElement('div');
      details.className = 'catalogue-item-details';
      while (title.nextSibling) details.appendChild(title.nextSibling);
      const titleButton = document.createElement('button');
      titleButton.type = 'button';
      titleButton.className = 'catalogue-item-title';
      titleButton.textContent = title.textContent || '';
      titleButton.setAttribute('aria-expanded','false');
      title.replaceWith(titleButton);
      card.appendChild(details);
      titleButton.addEventListener('click', () => {
        const open = card.classList.contains('open');
        host.querySelectorAll('.catalogue-item.open').forEach(other => {
          if (other !== card) {
            other.classList.remove('open');
            const t = other.querySelector('.catalogue-item-title');
            if (t) t.setAttribute('aria-expanded','false');
          }
        });
        card.classList.toggle('open', !open);
        titleButton.setAttribute('aria-expanded', String(!open));
      });
    });

    const sections = host.querySelector(':scope > .catalogue-sections');
    if (sections) return;
    const cards = [...host.querySelectorAll(':scope > .catalogue-item')];
    if (!cards.length) return;
    const free = cards.filter(c => /\bFREE\b/i.test(c.querySelector('.catalogue-item-details span')?.textContent || ''));
    const paid = cards.filter(c => !free.includes(c));
    const wrap = document.createElement('div');
    wrap.className = 'catalogue-sections';
    const add = (label, icon, items) => {
      if (!items.length) return;
      const section = document.createElement('section');
      section.className = 'catalogue-section';
      section.innerHTML = `<div class="catalogue-section-heading"><span class="catalogue-icon">${icon}</span><h4>${label}</h4><span class="catalogue-section-count">${items.length}</span></div>`;
      const list = document.createElement('div');
      list.className = 'catalogue-section-list';
      items.forEach(card => list.appendChild(card));
      section.appendChild(list);
      wrap.appendChild(section);
    };
    add('Paid Books','💳',paid);
    add('Free Books','🆓',free);
    host.appendChild(wrap);
  }

  setTimeout(polishCatalogue, 0);
  const observer = new MutationObserver(() => setTimeout(polishCatalogue, 0));
  setTimeout(() => {
    const host = document.getElementById('booksAdmin');
    if (host) observer.observe(host, {childList:true, subtree:true});
  }, 0);
})();