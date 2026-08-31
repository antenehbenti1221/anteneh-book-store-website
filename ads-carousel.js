(() => {
  const grid = document.getElementById('adGrid');
  if (!grid) return;

  let lastSignature = '';
  let working = false;

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
    const startAuto = () => { if (timer) clearInterval(timer); timer = setInterval(step, 3000); };
    const userMoved = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      if (timer) clearInterval(timer);
      timer = null;
      resumeTimer = setTimeout(startAuto, 3000);
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
      cardsGrid.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      setupAutoScroll(cardsGrid);
    };
    addSection('Paid Books', '💳', paid, 'paid');
    addSection('Free Books', '🆓', free, 'free');
    // Keep the existing Ads-page View buttons in place and delegate only their
    // book-opening action. This avoids the desktop overlay/layout intercepting clicks.
    grid.querySelectorAll('[data-promo-id]').forEach(btn => {
      if (btn.closest('.promo-action')) {
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          const id = btn.dataset.promoId;
          if (id && typeof window.openBook === 'function') window.openBook(id);
        }, {capture:true});
      }
    });
    working = false;
  }

  new MutationObserver(() => setTimeout(setupSections, 0)).observe(grid, {childList:true});
  setupSections();
})();