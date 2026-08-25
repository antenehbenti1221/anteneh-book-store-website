(() => {
  const root = document.getElementById('adGrid');
  if (!root) return;
  const timers = new WeakMap();

  const forceSections = () => {
    const sections = [...root.querySelectorAll(':scope > .promo-section')];
    if (!sections.length) return;
    const paid = sections.find(s => s.classList.contains('promo-section-paid'));
    const free = sections.find(s => s.classList.contains('promo-section-free'));
    if (paid && free) root.append(paid, free);
    root.style.cssText += ';display:block!important;width:100%!important;';
    [paid, free].filter(Boolean).forEach(section => {
      section.style.cssText += ';display:block!important;width:100%!important;clear:both!important;';
      const row = section.querySelector('.promo-section-grid');
      if (!row) return;
      row.style.cssText += ';display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important;';
      installScroller(row);
    });
  };

  function installScroller(row) {
    if (!row || timers.has(row)) return;
    let pausedUntil = 0;
    const pause = () => { pausedUntil = Date.now() + 5000; };
    ['touchstart','pointerdown','wheel'].forEach(type => row.addEventListener(type, pause, {passive:true}));
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil) return;
      const cards = row.querySelectorAll('.promo-card');
      if (cards.length < 2) return;
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(row).gap) || 14;
      const max = Math.max(0, row.scrollWidth - row.clientWidth);
      if (max <= 2) return;
      const next = row.scrollLeft + cardWidth + gap;
      row.scrollTo({left: next >= max - 2 ? 0 : next, behavior:'smooth'});
    }, 5000);
    timers.set(row, timer);
  }

  const formatDescription = () => {
    const details = document.getElementById('details');
    if (!details) return;
    [...details.querySelectorAll('p')].forEach(p => {
      if (p.dataset.adsBulletDone === '1') return;
      const text = p.textContent.trim();
      if (!text || /^(Language:|Price:|Total:|🇪🇹 Local payment)/i.test(text)) return;
      const parts = text.split(/\n+|\s*[•●▪◦]\s*|\s*;\s*(?=[A-Z0-9])/).map(x => x.replace(/^[-–—]\s*/, '').trim()).filter(Boolean);
      if (parts.length < 2) return;
      const ul = document.createElement('ul');
      ul.className = 'ads-description-list';
      parts.forEach(item => { const li=document.createElement('li'); li.textContent=item; ul.appendChild(li); });
      p.replaceWith(ul);
    });
  };

  root.addEventListener('click', () => setTimeout(formatDescription, 80), true);
  new MutationObserver(() => { setTimeout(forceSections, 0); setTimeout(formatDescription, 100); }).observe(root, {childList:true, subtree:true});
  setTimeout(forceSections, 400);
  setInterval(forceSections, 2000);
})();
