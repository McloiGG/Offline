// The synthesised one-shot sound effects. Adds play(name) and playComplete() to Cetak.office.audio.
//   names: warning, complete, unplug, plugIn, plugDrop, spark, switchOn, switchOff, trayOpen, trayClose
(function (C) {
  const { engine, audio } = C.office;
  const { tone, swish } = engine;

  const thunk = (at, gain) => tone(150, at, 0.14, 'sine', gain, 55);

  const SOUNDS = {
    // Two alternating square-wave beeps, three times.
    warning() {
      for (let i = 0; i < 3; i++) {
        tone(880, i * 0.34, 0.16, 'square', 0.16);
        tone(620, i * 0.34 + 0.17, 0.16, 'square', 0.16);
      }
    },
    // Rising chime ending on a held note.
    complete() {
      [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.22));
      tone(1046.5, 0.33, 0.7, 'triangle', 0.24);
      tone(1568, 0.33, 0.7, 'sine', 0.06);
    },
    // Plug pulled out of the socket: a sharp pop, then the printer powering down.
    unplug() {
      tone(2200, 0, 0.03, 'square', 0.12);
      swish(0, 0.12, 3500, 900, 0.4, 1.2);
      thunk(0.02, 0.3);
      tone(420, 0.1, 0.6, 'sawtooth', 0.07, 55);
    },
    // Plug pushed back in: a solid clunk, then the printer powering up.
    plugIn() {
      thunk(0, 0.55);
      tone(1500, 0, 0.04, 'square', 0.1);
      tone(180, 0.15, 0.5, 'sawtooth', 0.06, 520);
      tone(880, 0.55, 0.12, 'triangle', 0.14);
      tone(1320, 0.67, 0.2, 'triangle', 0.14);
    },
    // Plug dropped: a hard plastic knock.
    plugDrop() {
      thunk(0, 0.5);
      tone(1100, 0, 0.05, 'square', 0.1, 600);
      tone(2400, 0.01, 0.03, 'square', 0.05);
    },
    // Socket shorting out: electric crackle, a sharp zap, then everything dropping dead.
    spark() {
      for (let i = 0; i < 12; i++) swish(i * 0.16, 0.08, 4000 + Math.random() * 3000, 1500, 0.5, 1.5);
      tone(3000, 0, 0.12, 'sawtooth', 0.12, 200);
      tone(110, 2.1, 0.9, 'sawtooth', 0.12, 30);
      thunk(2.1, 0.6);
    },
    // Power key pressed: a crisp click, then a rising blip (on) or a falling one (off).
    switchOn() {
      tone(2600, 0, 0.015, 'square', 0.09);
      thunk(0.005, 0.3);
      tone(660, 0.07, 0.09, 'triangle', 0.13);
      tone(990, 0.14, 0.14, 'triangle', 0.13);
    },
    switchOff() {
      tone(2600, 0, 0.015, 'square', 0.09);
      thunk(0.005, 0.3);
      tone(990, 0.07, 0.09, 'triangle', 0.13);
      tone(520, 0.14, 0.22, 'triangle', 0.13, 260);
    },
    // Drawer rolling out, then a soft thunk as it reaches the end.
    trayOpen() {
      swish(0, 0.45, 500, 1400, 0.5, 0.9);
      tone(95, 0, 0.45, 'sawtooth', 0.04, 70);
      thunk(0.42, 0.45);
    },
    // Drawer rolling back in, then it closes with a click.
    trayClose() {
      swish(0, 0.4, 1400, 500, 0.5, 0.9);
      tone(95, 0, 0.4, 'sawtooth', 0.04, 70);
      thunk(0.38, 0.55);
      tone(1800, 0.4, 0.03, 'square', 0.05);
    }
  };

  audio.play = name => { if (SOUNDS[name] && engine.ensure()) SOUNDS[name](); };
  // Played when an ink, paper jam or overheat warning is resolved (turned off).
  audio.playComplete = () => audio.play('complete');
})(window.Cetak);
