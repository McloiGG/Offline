// Wires the debug panel's inputs and buttons to the printer and the sounds.
// (The printer's own scripts wire the camera and state buttons: ui/buttons.js, ui/views.js.)
(function (C) {
  const { audio } = C.office;
  const { cassettes, inkPanel } = C.parts;
  const { printing, airflow } = C.anim;
  const { setPaperCount, MAX_PAPER } = cassettes;

  const byId = id => document.getElementById(id);
  const inkInputs = document.querySelectorAll('.ink-level');

  // A button that shows "Label: on/off" and is highlighted while on.
  function setToggle(btn, label, on) {
    btn.textContent = label + ': ' + (on ? 'on' : 'off');
    btn.classList.toggle('on', on);
  }

  // Paper count: the tray removes sheets one by one down to the typed value (0 = empty tray).
  const paperInput = byId('paper-count');
  paperInput.max = MAX_PAPER;
  paperInput.oninput = () => { if (paperInput.value !== '') setPaperCount(Number(paperInput.value)); };

  // Ink levels: one percent input per tank (0 still leaves a sliver of ink).
  function setInkLevels(percent) {
    inkInputs.forEach((input, i) => { input.value = percent; inkPanel.setLevel(i, percent / 100); });
  }
  inkInputs.forEach((input, i) => {
    input.oninput = () => { if (input.value !== '') inkPanel.setLevel(i, Number(input.value) / 100); };
  });

  // One button per one-shot sound.
  document.querySelectorAll('[data-sound]').forEach(btn => { btn.onclick = () => audio.play(btn.dataset.sound); });

  // Print: starts / stops the print animation (the sound is attached to it by audio/index.js) and zooms to the tray.
  const printBtn = byId('sound-print');
  printBtn.onclick = () => {
    if (printing.isOn()) printing.stop(); else printing.start();
    if (printing.isOn()) C.ui.views.goTo('print');
    setToggle(printBtn, 'Print', printing.isOn());
  };

  // Ink warning: looping alarm, blinking logo, all tanks empty (off refills them).
  const inkBtn = byId('sound-ink');
  inkBtn.onclick = () => audio.setInkWarning(!audio.isInkWarning());
  audio.onInkWarningChange = on => {
    setToggle(inkBtn, 'Ink warning', on);
    setInkLevels(on ? 0 : 100);
  };

  // Paper jam: looping alarm with beeps, empty tray (off refills it).
  const jamBtn = byId('sound-jam');
  jamBtn.onclick = () => audio.setPaperJam(!audio.isPaperJam());
  audio.onPaperJamChange = on => {
    setToggle(jamBtn, 'Paper jam', on);
    paperInput.value = on ? 0 : MAX_PAPER;
    setPaperCount(on ? 0 : MAX_PAPER);
  };

  // Overheat: the fan sound plus red airflow from the vent; turning it off blows blue airflow for a few seconds.
  const overheatBtn = byId('sound-overheat');
  let overheating = false;
  overheatBtn.onclick = () => {
    overheating = !overheating;
    if (overheating) { audio.startOverheat(); airflow.heat(); }
    else airflow.cool(audio.stopOverheat());      // the blue airflow fades out over the length of the ending sound
    setToggle(overheatBtn, 'Overheat', overheating);
  };

  byId('sound-volume').oninput = e => audio.setVolume(Number(e.target.value));
})(window.Cetak);
