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

  // Ink levels: one percent input per tank (0 still leaves a sliver of ink).
  const inkPanel = window.Cetak.parts.inkPanel;
  document.querySelectorAll('.ink-level').forEach((input, i) => {
    input.oninput = () => { if (input.value !== '') inkPanel.setLevel(i, Number(input.value) / 100); };
  });

  // Sound effects: one button per sound, a toggle for the looping print sound, and a volume slider.
  const audio = window.Cetak.office.audio;
  document.querySelectorAll('[data-sound]').forEach(btn => { btn.onclick = () => audio.play(btn.dataset.sound); });

  const printSoundBtn = document.getElementById('sound-print');
  printSoundBtn.onclick = () => {
    if (audio.isPrinting()) audio.stopPrinting(); else audio.startPrinting();
  };
  // The sound can also be started/stopped by the real Print button, so keep the label in sync.
  audio.onPrintingChange = on => {
    printSoundBtn.textContent = 'Printing: ' + (on ? 'on' : 'off');
    printSoundBtn.classList.toggle('on', on);
  };

  const inkBtn = document.getElementById('sound-ink');
  inkBtn.onclick = () => audio.setInkWarning(!audio.isInkWarning());
  audio.onInkWarningChange = on => {
    inkBtn.textContent = 'Ink warning: ' + (on ? 'on' : 'off');
    inkBtn.classList.toggle('on', on);
    const level = on ? 0 : 100;
    document.querySelectorAll('.ink-level').forEach((input, i) => { input.value = level; inkPanel.setLevel(i, level / 100); });
  };

  const overheatBtn = document.getElementById('sound-overheat');
  overheatBtn.onclick = () => { if (audio.isOverheating()) audio.stopOverheat(); else audio.startOverheat(); };
  audio.onOverheatChange = on => {
    overheatBtn.textContent = 'Overheat fan: ' + (on ? 'on' : 'off');
    overheatBtn.classList.toggle('on', on);
  };

  document.getElementById('sound-volume').oninput = e => audio.setVolume(Number(e.target.value));

  tab.onclick = () => setOpen(!root.classList.contains('open'));

  addEventListener('mousemove', e => root.classList.toggle('near', e.clientX > innerWidth - EDGE_PX));
  addEventListener('mouseout', e => { if (!e.relatedTarget) root.classList.remove('near'); });   // mouse left the window
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();
