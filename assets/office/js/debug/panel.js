// Debug controller panel behaviour: the arrow tab appears when the mouse is near the right edge;
// click it (or press Esc) to slide the panel open / closed. The `open` / `near` classes drive it (see css/debug.css).
(function () {
  const EDGE_PX = 70;               // how close to the right edge the mouse must be to reveal the arrow

  const root = document.getElementById('debug');
  const tab = document.getElementById('debug-tab');

  function setOpen(open) {
    root.classList.toggle('open', open);
    tab.textContent = open ? '›' : '‹';     // > closes, < opens
    tab.setAttribute('aria-expanded', String(open));
    tab.setAttribute('aria-label', open ? 'Close debug controller' : 'Open debug controller');
  }

  tab.onclick = () => setOpen(!root.classList.contains('open'));

  addEventListener('mousemove', e => root.classList.toggle('near', e.clientX > innerWidth - EDGE_PX));
  addEventListener('mouseout', e => { if (!e.relatedTarget) root.classList.remove('near'); });   // mouse left the window
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();
