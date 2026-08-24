/* Isolated fix: make only the Admin History Hide/Show button reliable. */
(() => {
  const KEY = 'anteneh_admin_hidden_paid_orders_v3';
  const bind = () => {
    document.querySelectorAll('#ordersAdmin [data-a="hide"]').forEach(button => {
      if (button.dataset.hideFixBound === '1') return;
      const card = button.closest('[data-id]');
      if (!card) return;
      button.dataset.hideFixBound = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const id = String(card.dataset.id);
        let hidden = new Set();
        try { hidden = new Set(JSON.parse(localStorage.getItem(KEY) || '[]').map(String)); } catch (_) {}
        if (hidden.has(id)) {
          hidden.delete(id);
          localStorage.setItem(KEY, JSON.stringify([...hidden]));
          window.orderView?.('history');
        } else {
          hidden.add(id);
          localStorage.setItem(KEY, JSON.stringify([...hidden]));
          window.orderView?.('hidden');
        }
      }, true);
    });
  };
  new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });
  bind();
})();
