/* Isolated fixes: paid book browser + approved paid ebook reader only. */
(() => {
  const C = window.STORE_CONFIG || {};

  // Paid catalogue "View" must open the normal book/checkout view,
  // not the description-only accordion behavior used by the catalogue UI.
  document.addEventListener('click', event => {
    const button = event.target.closest('#grid [data-card-view]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const id = button.dataset.id;
    if (id && typeof window.openBook === 'function') window.openBook(id);
  }, true);

  const isPaidOrderCard = button => {
    const card = button.closest('.order-card');
    if (!card) return false;
    const text = card.textContent || '';
    return !/\b0(?:\.0+)?\s*ETB\b/i.test(text);
  };

  // Approved paid ebooks open as an inline PDF in the browser. This avoids
  // popup-blocker failures caused by opening a new tab after an async fetch.
  document.addEventListener('click', async event => {
    const button = event.target.closest('#orderStatus [data-open-token][data-open-kind="ebook"]');
    if (!button || !isPaidOrderCard(button)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const card = button.closest('.order-card');
    const token = button.dataset.openToken;
    if (!token || !C.SUPABASE_URL || !C.SUPABASE_PUBLISHABLE_KEY) return;

    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = '📖 Preparing ebook…';

    try {
      const response = await fetch(`${C.SUPABASE_URL}/functions/v1/deliver-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: C.SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({ access_token: token, kind: 'ebook', mode: 'pdf' })
      });
      if (!response.ok) {
        let message = 'Could not open the ebook.';
        try { message = (await response.json()).error || message; } catch (_) {}
        throw new Error(message);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      button.disabled = false;
      button.textContent = oldText;
      const msg = document.createElement('span');
      msg.className = 'small-note';
      msg.textContent = `Could not open the ebook: ${error.message || error}`;
      card?.appendChild(msg);
    }
  }, true);
})();
