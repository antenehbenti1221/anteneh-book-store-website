(() => {
  const details = document.getElementById('details');
  if (!details) return;
  const format = () => {
    const h2 = details.querySelector('h2');
    if (!h2) return;
    const candidate = h2.nextElementSibling;
    if (!candidate || candidate.tagName !== 'P' || candidate.querySelector('b')) return;
    if (candidate.dataset.bulleted === '1') return;
    const raw = candidate.textContent.trim();
    if (!raw) return;
    const items = raw.split(/\r?\n|\s*[•▪●◦]\s*/).map(x => x.trim()).filter(Boolean);
    if (items.length < 2) return;
    const ul = document.createElement('ul');
    ul.className = 'description-bullets';
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text.replace(/^[-–—]\s*/, '');
      ul.appendChild(li);
    });
    candidate.replaceWith(ul);
  };
  new MutationObserver(() => requestAnimationFrame(format)).observe(details, {childList:true,subtree:true});
  format();
})();
