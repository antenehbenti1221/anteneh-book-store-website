(() => {
  const root = document.getElementById('adGrid');
  if (!root) return;

  // Ads-only: keep Paid above Free regardless of desktop/grid styles.
  const forceSections = () => {
    const sections = [...root.querySelectorAll(':scope > .promo-section')];
    if (sections.length < 2) return;
    const paid = sections.find(s => s.classList.contains('promo-section-paid'));
    const free = sections.find(s => s.classList.contains('promo-section-free'));
    if (paid && free && paid.nextElementSibling !== free) root.append(paid, free);
    root.style.display = 'block';
    root.style.width = '100%';
    [paid, free].filter(Boolean).forEach(section => {
      section.style.display = 'block';
      section.style.width = '100%';
      const row = section.querySelector('.promo-section-grid');
      if (!row) return;
      row.style.display = 'flex';
      row.style.flexDirection = 'row';
      row.style.flexWrap = 'nowrap';
      row.style.width = '100%';
      row.style.overflowX = 'auto';
      row.style.overflowY = 'hidden';
      row.style.touchAction = 'pan-x';
      row.style.webkitOverflowScrolling = 'touch';
    });
  };

  // Reliable autoplay that does not depend on CSS overflow detection.
  const timers = new WeakMap();
  const installScroller = row => {
    if (!row || timers.has(row)) return;
    let pausedUntil = 0;
    let lastX = 0;
    const pause = () => { pausedUntil = Date.now() + 5000; };
    ['touchstart','pointerdown','wheel'].forEach(type => row.addEventListener(type, pause, {passive:true}));
    row.addEventListener('scroll', () => { lastX = row.scrollLeft; }, {passive:true});
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil) return;
      const cards = row.querySelectorAll('.promo-card');
      if (cards.length < 2) return;
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(row).gap) || 12;
      const max = Math.max(0, row.scrollWidth - row.clientWidth);
      if (max <= 2) {
        // Keep a real carousel even when the browser reports a very tight fit.
        row.style.paddingRight = Math.max(24, cardWidth * 0.2) + 'px';
      }
      const next = lastX + cardWidth + gap;
      row.scrollTo({left: next >= max - 2 ? 0 : next, behavior:'smooth'});
    }, 5000);
    timers.set(row, timer);
  };

  const install = () => {
    forceSections();
    root.querySelectorAll('.promo-section-grid').forEach(installScroller);
  };

  // Format Ads detail descriptions into clean separate bullet items.
  const formatDescription = () => {
    const details = document.getElementById('details');
    if (!details) return;
    const candidates = [...details.querySelectorAll('p')].filter(p => {
      const t = p.textContent.trim();
      return t && !/^Language:|^Price:|^Total:|^🇪🇹 Local payment/i.test(t);
    });
    candidates.forEach(p => {
      if (p.dataset.adsBulletDone === '1') return;
      const raw = p.textContent.trim();
      const parts = raw.split(/\n+|\s*[•●▪◦]\s*|\s*;\s*(?=[A-Z0-9])/).map(x => x.replace(/^[-–—]\s*/, '').trim()).filter(Boolean);
      if (parts.length < 2) return;
      const ul = document.createElement('ul');
      ul.className = 'ads-description-list';
      parts.forEach(text => { const li=document.createElement('li'); li.textContent=text; ul.appendChild(li); });
      p.replaceWith(ul);
      ul.dataset.adsBulletDone = '1';
    });
  };

  root.addEventListener('click', () => setTimeout(formatDescription, 50), true);
  new MutationObserver(install).observe(root, {childList:true, subtree:true});
  setTimeout(install, 400);
  setInterval(install, 1500);
})();
