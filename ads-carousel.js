(() => {
  const grid = document.getElementById('adGrid');
  if (!grid) return;

  let lastSignature = '';
  let working = false;
  const autoTimers = new WeakMap();

  function setupAutoScroll(cardsGrid) {
    if (cardsGrid.dataset.autoScrollReady === '1') return;
    cardsGrid.dataset.autoScrollReady = '1';
    let manual = false;
    let timer = null;
    const step = () => {
      if (manual) return;
      const card = cardsGrid.querySelector('.promo-card');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(cardsGrid).gap || '0');
      const amount = card.getBoundingClientRect().width + gap;
      const atEnd = cardsGrid.scrollLeft + cardsGrid.clientWidth >= cardsGrid.scrollWidth - 4;
      cardsGrid.scrollTo({left: atEnd ? 0 : cardsGrid.scrollLeft + amount, behavior:'smooth'});
    };
    const stop = () => {
      manual = true;
      if (timer) clearInterval(timer);
      timer = null;
    };
    ['wheel','touchstart','pointerdown'].forEach(evt => cardsGrid.addEventListener(evt, stop, {passive:true, once:true}));
    timer = setInterval(step, 5000);
    autoTimers.set(cardsGrid, timer);
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
      list.forEach(card => cardsGrid.appendChild(card));
      section.appendChild(cardsGrid);
      grid.appendChild(section);
      setupAutoScroll(cardsGrid);
    };

    addSection('Paid Books', '💳', paid, 'paid');
    addSection('Free Books', '🆓', free, 'free');

    working = false;
  }

  new MutationObserver(() => setTimeout(setupSections, 0)).observe(grid, { childList: true });
  setTimeout(setupSections, 300);
})();
