// Printing sound: the recording in /audio loops while printing; if it can't load, a synthesised carriage sweep
// with a motor hum is used instead.
// Adds to Cetak.office.audio: startPrinting(), stopPrinting(), isPrinting()
(function (C) {
  const { engine, audio, recordings } = C.office;
  const { tone, swish } = engine;
  const PRINT_FILE = '../../audio/printing.mp3';

  let printing = null;           // { el } for the recording, or { hum, humGain, timer } for the synth

  function printPass(at) {
    swish(at, 0.5, 700, 2200, 0.28, 2.5);
    swish(at + 0.55, 0.5, 2200, 700, 0.28, 2.5);
    [0.1, 0.2, 0.3, 0.4, 0.65, 0.75, 0.85, 0.95].forEach(o => tone(2600, at + o, 0.025, 'square', 0.025));
  }

  function startSynth() {
    if (!engine.ensure() || printing) return;
    const { ctx, master } = engine;
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.value = 62;
    humGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    humGain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.3);
    hum.connect(humGain).connect(master);
    hum.start();

    printPass(0);
    printing = { hum, humGain, timer: setInterval(() => printPass(0.05), 1200) };
  }

  audio.startPrinting = () => {
    if (printing) return;
    const el = recordings.loop(PRINT_FILE);
    if (el) {
      const state = printing = { el };
      el.onerror = () => { if (printing === state) { printing = null; startSynth(); } };
    } else {
      startSynth();
    }
    audio.onPrintingChange(true);
  };

  audio.stopPrinting = () => {
    if (!printing) return;
    if (printing.el) {
      printing.el.pause();
    } else {
      const t = engine.ctx.currentTime;
      clearInterval(printing.timer);
      printing.humGain.gain.cancelScheduledValues(t);
      printing.humGain.gain.setValueAtTime(printing.humGain.gain.value, t);
      printing.humGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      printing.hum.stop(t + 0.3);
      tone(1320, 0.05, 0.15, 'sine', 0.08);          // little "done" blip
    }
    printing = null;
    audio.onPrintingChange(false);
  };

  audio.isPrinting = () => !!printing;
})(window.Cetak);
