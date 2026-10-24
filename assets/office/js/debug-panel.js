// Debug controller behaviour: show the arrow tab when the mouse is near the right edge,
// click it (or press Esc) to slide the panel open / closed. The buttons inside are wired by the
// printer's scripts (ui/buttons.js, ui/views.js); this file only handles showing and hiding.
(function () {
  const EDGE_PX = 70;               // how close to the right edge the mouse must be to reveal the arrow

  const root = document.getElementById('debug');
  const tab = document.getElementById('debug-tab');

  function setOpen(open) {
    root.classList.toggle('open', open);
    tab.textContent = open ? '›' : '‹';     // > when open (click to hide), < when closed
    tab.setAttribute('aria-expanded', String(open));
    tab.setAttribute('aria-label', open ? 'Close debug controller' : 'Open debug controller');
  }

  let isOpen = false;
  tab.onclick = () => { isOpen = !isOpen; setOpen(isOpen); };

  addEventListener('mousemove', e => {
    root.classList.toggle('near', e.clientX > innerWidth - EDGE_PX);
  });
  // Mouse left the window entirely.
  addEventListener('mouseout', e => {
    if (!e.relatedTarget) root.classList.toggle('near', false);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) { isOpen = false; setOpen(false); }
  });
})();
