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

  function directCards() {
    return Array.from(grid.children).filter(el => el.classList?.contains('promo-card'));
  }

  function setupSections() {
    if (working) return;
    const cards = directCards();
    if (!cards.length) return;
    const signature = cards.map(card => card.querySelector('[data-promo-id]')?.dataset.promoId || card.textContent.trim()).join('|');
    if (signature === lastSignature && grid.querySelector('.promo-section')) return;
    lastSignature = signature;
    working = true;

    const paid = cards.filter(card => {
      const value = card.querySelector('.promo-overlay span')?.textContent.trim() || '';
      return !/^FREE$/i.test(value);
    });
    const free = cards.filter(card => {
      const value = card.querySelector('.promo-overlay span')?.textContent.trim() || '';
      return /^FREE$/i.test(value);
    });

    grid.classList.remove('ads-carousel');
    grid.innerHTML = '';

    const addSection = (title, icon, list, kind) => {
      if (!list.length) return;
      const section = document.createElement('section');
      section.className = `promo-section promo-section-${kind}`;
      const heading = document.createElement('div');
      heading.className = 'promo-section-heading';
      heading.innerHTML = `<span>${icon}</span><h3>${title}</h3>`;
      const cardsGrid = document.createElement('div');
      cardsGrid.className = 'promo-section-grid';
      cardsGrid.setAttribute('aria-label', `${title} carousel`);
      list.forEach(card => cardsGrid.appendChild(card));
      section.appendChild(heading);
      section.appendChild(cardsGrid);
      grid.appendChild(section);
      cardsGrid.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      setupAutoScroll(cardsGrid);
    };

    addSection('Paid Books', '💳', paid, 'paid');
    addSection('Free Books', '🆓', free, 'free');
    working = false;
  }

  // Keep the existing promotion cards intact and make the transformation
  // compatible with desktop browsers that do not reliably support :scope.
  grid.addEventListener('click', e => {
    const btn = e.target.closest?.('[data-promo-id]');
    if (!btn || !grid.contains(btn)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const id = btn.dataset.promoId;
    if (id && typeof window.openBook === 'function') window.openBook(id);
  }, true);

  const observer = new MutationObserver(() => setTimeout(setupSections, 0));
  observer.observe(grid, {childList:true, subtree:true});
  setupSections();
})();
