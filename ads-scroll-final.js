(() => {
  const root = document.getElementById('adGrid');
  if (!root) return;
  let ready = false;

  const esc = s => String(s ?? '').replace(/[&<>\"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[x]));
  const freeBook = b => Boolean(b?.is_free) || Number(b?.price || 0) === 0;

  function render() {
    if (ready || !Array.isArray(books) || !books.length) return false;
    const published = books.filter(b => b.is_published !== false);
    if (!published.length) return false;

    const paid = published.filter(b => !freeBook(b));
    const free = published.filter(freeBook);
    root.innerHTML = '';
    root.style.display = 'block';
    root.style.width = '100%';

    const add = (title, icon, list) => {
      if (!list.length) return;
      const section = document.createElement('section');
      section.className = 'promo-section';
      section.style.cssText = 'display:block!important;width:100%!important;clear:both!important;margin:0 0 22px!important;';
      section.innerHTML = `<div class="promo-section-heading"><span>${icon}</span><h3>${title}</h3></div><div class="promo-section-grid"></div>`;
      const row = section.querySelector('.promo-section-grid');
      row.style.cssText = 'display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;gap:12px!important;padding:4px 2px 12px!important;box-sizing:border-box!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important;scroll-behavior:smooth!important;scrollbar-width:none!important;';
      row.innerHTML = list.map(b => `<article class="promo-card" data-ads-book-id="${esc(b.id)}"><div class="promo-image"><img src="${esc(b.cover_url || '')}" alt="${esc(b.title || '')}"></div><div class="promo-action"><button class="btn primary" type="button" data-promo-id="${esc(b.id)}">View</button></div></article>`).join('');
      [...row.children].forEach(card => {
        card.style.cssText += ';flex:0 0 260px!important;width:260px!important;min-width:260px!important;box-sizing:border-box!important;';
        const image = card.querySelector('.promo-image');
        if (image) image.style.cssText += ';height:300px!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;background:#fff!important;padding:4px!important;box-sizing:border-box!important;';
        const img = card.querySelector('img');
        if (img) img.style.cssText += ';width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;display:block!important;margin:auto!important;';
      });
      root.appendChild(section);
      wireScroll(row);
    };

    add('Paid Books', '💳', paid);
    add('Free Books', '🆓', free);
    root.querySelectorAll('[data-promo-id]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const fn = window.openBook;
      if (typeof fn === 'function') fn(btn.dataset.promoId);
    }));
    ready = true;
    return true;
  }

  function wireScroll(row) {
    let pausedUntil = 0, dragging = false, startX = 0, startLeft = 0;
    const pause = () => { pausedUntil = Date.now() + 5000; };
    row.addEventListener('touchstart', pause, {passive:true});
    row.addEventListener('wheel', e => {
      pause();
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); row.scrollLeft += e.deltaY; }
    }, {passive:false});
    row.addEventListener('pointerdown', e => {
      pause(); dragging = true; startX = e.clientX; startLeft = row.scrollLeft;
      row.setPointerCapture?.(e.pointerId);
    });
    row.addEventListener('pointermove', e => { if (dragging) row.scrollLeft = startLeft - (e.clientX - startX); });
    ['pointerup','pointercancel'].forEach(t => row.addEventListener(t, () => { dragging = false; }));
    setInterval(() => {
      if (dragging || Date.now() < pausedUntil) return;
      const cards = row.querySelectorAll('.promo-card');
      const max = row.scrollWidth - row.clientWidth;
      if (cards.length < 2 || max <= 2) return;
      const gap = parseFloat(getComputedStyle(row).gap) || 12;
      const step = cards[0].getBoundingClientRect().width + gap;
      row.scrollTo({left: row.scrollLeft + step >= max - 2 ? 0 : row.scrollLeft + step, behavior:'smooth'});
    }, 5000);
  }

  const wait = () => { if (!render()) setTimeout(wait, 250); };
  wait();
})();
