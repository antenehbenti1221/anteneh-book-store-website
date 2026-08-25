(() => {
  const grid = document.getElementById('adGrid');
  if (!grid) return;

  let lastSignature = '';
  let working = false;

  const esc = s => String(s ?? '').replace(/[&<>\"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&#039;',"'":'&#039;'}[x]));
  const price = b => b.is_free || Number(b.price) === 0 ? 'FREE' : `${Number(b.price).toLocaleString()} ${esc(b.currency || 'ETB')}`;
  const promoCard = b => `<article class="promo-card"><div class="promo-image">${b.cover_url ? `<img src="${esc(b.cover_url)}" alt="${esc(b.title)}">` : '📚'}<div class="promo-overlay"><strong>${esc(b.title)}</strong><span>${price(b)}</span></div></div><div class="promo-action"><button class="btn primary" data-promo-id="${esc(b.id)}">View</button></div></article>`;

  function setupAutoScroll(cardsGrid) {
    if (cardsGrid.dataset.autoScrollReady === '1') return;
    cardsGrid.dataset.autoScrollReady = '1';
    let timer = null, resumeTimer = null, dragging = false, startX = 0, startScroll = 0;

    const cardStep = () => {
      const card = cardsGrid.querySelector('.promo-card');
      if (!card) return 0;
      return card.getBoundingClientRect().width + parseFloat(getComputedStyle(cardsGrid).gap || '0');
    };
    const step = () => {
      if (dragging) return;
      const amount = cardStep();
      if (!amount || cardsGrid.scrollWidth <= cardsGrid.clientWidth + 4) return;
      const atEnd = cardsGrid.scrollLeft + cardsGrid.clientWidth >= cardsGrid.scrollWidth - 6;
      cardsGrid.scrollTo({left: atEnd ? 0 : cardsGrid.scrollLeft + amount, behavior:'smooth'});
    };
    const startAuto = () => { if (timer) clearInterval(timer); timer = setInterval(step, 5000); };
    const userMoved = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      if (timer) clearInterval(timer);
      timer = null;
      resumeTimer = setTimeout(startAuto, 5000);
    };

    cardsGrid.addEventListener('wheel', userMoved, {passive:true});
    cardsGrid.addEventListener('touchstart', userMoved, {passive:true});
    cardsGrid.addEventListener('pointerdown', e => { dragging = true; startX = e.clientX; startScroll = cardsGrid.scrollLeft; cardsGrid.setPointerCapture?.(e.pointerId); userMoved(); });
    cardsGrid.addEventListener('pointermove', e => { if (dragging) cardsGrid.scrollLeft = startScroll - (e.clientX - startX); });
    cardsGrid.addEventListener('pointerup', () => { dragging = false; });
    cardsGrid.addEventListener('pointercancel', () => { dragging = false; });
    startAuto();
  }

  function setupSections() {
    if (working) return;
    const cards = [...grid.querySelectorAll(':scope > .promo-card')];
    if (!cards.length) return;
    const signature = cards.map(card => card.querySelector('[data-promo-id]')?.dataset.promoId || card.textContent.trim()).join('|');
    if (signature === lastSignature && grid.querySelector('.promo-section')) return;
    lastSignature = signature;
    working = true;

    const paid = cards.filter(card => !/^FREE$/i.test(card.querySelector('.promo-overlay span')?.textContent.trim() || ''));
    const free = cards.filter(card => /^FREE$/i.test(card.querySelector('.promo-overlay span')?.textContent.trim() || ''));
    grid.classList.remove('ads-carousel');
    grid.innerHTML = '';

    const addSection = (title, icon, list, kind) => {
      if (!list.length) return;
      const section = document.createElement('section');
      section.className = `promo-section promo-section-${kind}`;
      section.innerHTML = `<div class="promo-section-heading"><span>${icon}</span><h3>${title}</h3></div>`;
      const cardsGrid = document.createElement('div');
      cardsGrid.className = 'promo-section-grid';
      cardsGrid.setAttribute('aria-label', `${title} carousel`);
      list.forEach(card => cardsGrid.appendChild(card));
      section.appendChild(cardsGrid);
      grid.appendChild(section);
      setupAutoScroll(cardsGrid);
    };

    addSection('Paid Books', '💳', paid, 'paid');
    addSection('Free Books', '🆓', free, 'free');
    grid.querySelectorAll('[data-promo-id]').forEach(btn => btn.onclick = () => window.openBook?.(btn.dataset.promoId));
    working = false;
  }

  async function loadAllPublishedBooks() {
    try {
      const cfg = window.STORE_CONFIG;
      if (!cfg?.SUPABASE_URL || !cfg?.SUPABASE_PUBLISHABLE_KEY || !window.supabase?.createClient) return setupSections();
      const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
      const {data, error} = await client.from('books').select('id,title,description,language,type,format,price,currency,is_free,cover_url,created_at,is_published').eq('is_published', true).order('created_at', {ascending:false});
      if (error || !Array.isArray(data)) return setupSections();
      const cards = data.map(promoCard).join('');
      grid.innerHTML = cards || '<div class="ad-placeholder">Your latest products and promotions will appear here.</div>';
      lastSignature = '';
      setupSections();
    } catch (_) {
      setupSections();
    }
  }

  new MutationObserver(() => setTimeout(setupSections, 0)).observe(grid, {childList:true});
  setTimeout(loadAllPublishedBooks, 350);
})();
