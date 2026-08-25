(() => {
  const root = document.getElementById('adGrid');
  if (!root) return;
  const AUTO_MS = 5000;
  const pause = new WeakMap();
  const timers = new WeakMap();

  function wire(track) {
    if (!track || track.dataset.scrollFinal === '1') return;
    track.dataset.scrollFinal = '1';
    pause.set(track, 0);

    const manual = () => pause.set(track, Date.now() + AUTO_MS);
    ['wheel','touchstart','pointerdown','pointermove','scroll'].forEach(type => {
      track.addEventListener(type, manual, {passive:true});
    });

    const run = () => {
      const cards = track.querySelectorAll('.promo-card');
      if (cards.length < 2) return;
      if (Date.now() < (pause.get(track) || 0)) return;
      const first = cards[0];
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
      const step = first.getBoundingClientRect().width + gap;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 2) return;
      const next = track.scrollLeft + step;
      track.scrollTo({left: next >= max - 2 ? 0 : next, behavior:'smooth'});
    };
    timers.set(track, setInterval(run, AUTO_MS));
  }

  function scan() {
    root.querySelectorAll('.promo-section-grid').forEach(wire);
  }

  new MutationObserver(() => requestAnimationFrame(scan)).observe(root, {childList:true, subtree:true});
  scan();
  setTimeout(scan, 500);
  setTimeout(scan, 1500);
})();
