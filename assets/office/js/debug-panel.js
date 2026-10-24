// Debug controller behaviour: show the arrow tab when the mouse is near the right edge,
// click it (or press Esc) to slide the panel open / closed. The buttons inside are wired by the
// printer's scripts (ui/buttons.js, ui/views.js); this file only handles showing and hiding.
(function () {
  const EDGE_PX = 70;               // how close to the right edge the mouse must be to reveal the arrow

  const root = document.getElementById('debug');
  const tab = document.getElementById('debug-tab');

  // The `open` / `near` classes on #debug drive everything (see css/debug.css).
  function setOpen(open) {
    root.classList.toggle('open', open);
    tab.textContent = open ? '›' : '‹';     // > closes, < opens
    tab.setAttribute('aria-expanded', String(open));
    tab.setAttribute('aria-label', open ? 'Close debug controller' : 'Open debug controller');
  }

  // Paper count: the tray removes sheets one by one down to the typed value (0 = empty tray).
  const paperInput = document.getElementById('paper-count');
  const { setPaperCount, MAX_PAPER } = window.Cetak.parts.cassettes;
  paperInput.max = MAX_PAPER;
  paperInput.oninput = () => { if (paperInput.value !== '') setPaperCount(Number(paperInput.value)); };

  tab.onclick = () => setOpen(!root.classList.contains('open'));

  addEventListener('mousemove', e => root.classList.toggle('near', e.clientX > innerWidth - EDGE_PX));
  addEventListener('mouseout', e => { if (!e.relatedTarget) root.classList.remove('near'); });   // mouse left the window
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();
