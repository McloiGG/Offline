// Sound effects, synthesised with the Web Audio API (no audio files).
// Exposes: Cetak.office.audio = { play(name), startPrinting(), stopPrinting(), isPrinting(), setVolume(v) }
//   names: 'warning', 'complete', 'trayOpen', 'trayClose'
// Browsers only allow sound after a user gesture, so the AudioContext is created on first use.
(function (C) {
  let ctx = null;
  let master = null;
  let volume = 0.6;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // A tone with a quick attack and exponential decay. `at` is seconds from now.
  function tone(freq, at, dur, type, gain, freqEnd) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  let noiseBuffer = null;
  function noise() {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    return src;
  }

  // Filtered noise burst; the filter frequency sweeps from `f0` to `f1`.
  function swish(at, dur, f0, f1, gain, q) {
    const t = ctx.currentTime + at;
    const src = noise();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    filter.type = 'bandpass';
    filter.Q.value = q || 1.5;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + dur * 0.25);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(amp).connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // The ink panel logo blinks red only while the ink warning is on.
  let inkWarn = false;
  function refreshWarning() { C.parts.inkPanel.setWarning(inkWarn); }

  const thunk = (at, gain) => tone(150, at, 0.14, 'sine', gain, 55);

  const SOUNDS = {
    // Two alternating square-wave beeps, three times.
    warning() {
      for (let i = 0; i < 3; i++) {
        tone(880, i * 0.34, 0.16, 'square', 0.16);
        tone(620, i * 0.34 + 0.17, 0.16, 'square', 0.16);
      }
    },
    // Rising four-note chime ending on a held note.
    complete() {
      [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.22));
      tone(1046.5, 0.33, 0.7, 'triangle', 0.24);
      tone(1568, 0.33, 0.7, 'sine', 0.06);
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

  // Played when an ink, paper jam or overheat warning is resolved (turned off).
  function playComplete() { if (ensure()) SOUNDS.complete(); }

  // Ink warning: the (loud) recording loops while on, so it is turned down.
  const INK_FILE = 'audio/ink.mp3', INK_LEVEL = 0.35;
  let inkEl = null;

  function setInkWarning(on) {
    if (on && !inkEl && typeof Audio !== 'undefined') {
      inkEl = new Audio(INK_FILE);
      inkEl.loop = true;
      inkEl.volume = volume * INK_LEVEL;
      inkEl.play().catch(() => {});
    } else if (!on && inkEl) {
      inkEl.pause();
      inkEl = null;
      playComplete();
    }
    inkWarn = on;
    refreshWarning();
    api.onInkWarningChange(on);
  }

  // Paper jam warning: the recording starts at JAM_FROM and loops JAM_FROM-JAM_TO (two copies cross-fade, so the
  // seam is smooth), and the warning sound plays after every JAM_LOOPS_PER_BEEP loops, until it is turned off.
  const JAM_FILE = 'audio/paperjam.mp3';
  const JAM_FROM = 7, JAM_TO = 10, JAM_FADE = 0.6, JAM_LOOPS_PER_BEEP = 3;
  let jam = null;                // { a, b, cur, next, fadeStart, loops, timer }

  function setPaperJam(on) {
    if (on && !jam && typeof Audio !== 'undefined') {
      const state = { a: new Audio(JAM_FILE), b: new Audio(JAM_FILE), next: null, fadeStart: 0, loops: 0 };
      state.cur = state.a;
      state.cur.volume = volume;
      state.cur.currentTime = JAM_FROM;
      jam = state;
      state.timer = setInterval(() => tickJam(state), 30);
      state.cur.play().catch(() => {});
    } else if (!on && jam) {
      clearInterval(jam.timer);
      jam.a.pause();
      jam.b.pause();
      jam = null;
      playComplete();
    }
    api.onPaperJamChange(!!jam);
  }

  function tickJam(state) {
    const now = performance.now() / 1000;
    if (!state.next) {
      if (state.cur.currentTime >= JAM_TO - JAM_FADE) {
        state.next = state.cur === state.a ? state.b : state.a;
        state.next.currentTime = JAM_FROM;
        state.next.volume = 0;
        state.next.play().catch(() => {});
        state.fadeStart = now;
        if (++state.loops % JAM_LOOPS_PER_BEEP === 0 && ensure()) SOUNDS.warning();
      }
      return;
    }
    const t = Math.min(1, (now - state.fadeStart) / JAM_FADE);
    state.cur.volume = volume * (1 - t);
    state.next.volume = volume * t;
    if (t >= 1) {
      state.cur.pause();
      state.cur = state.next;
      state.next = null;
    }
  }

  // ---- printing: a repeating carriage sweep with a steady motor hum underneath ----
  let printing = null;           // { hum, humGain, timer }

  function printPass(at) {
    swish(at, 0.5, 700, 2200, 0.28, 2.5);
    swish(at + 0.55, 0.5, 2200, 700, 0.28, 2.5);
    [0.1, 0.2, 0.3, 0.4, 0.65, 0.75, 0.85, 0.95].forEach(o => tone(2600, at + o, 0.025, 'square', 0.025));
  }

  // Prefer a real recording at PRINT_FILE (looped); if it can't be loaded, use the synthesised sound.
  const PRINT_FILE = 'audio/printing.mp3';

  function startPrinting() {
    if (printing) return;
    if (typeof Audio === 'undefined') return startSynthPrinting();
    const el = new Audio(PRINT_FILE);
    el.loop = true;
    el.volume = volume;
    const state = { el };
    printing = state;
    el.onerror = () => { if (printing === state) { printing = null; startSynthPrinting(); } };
    el.play().catch(() => { if (printing === state && el.error) el.onerror(); });
    api.onPrintingChange(true);
  }

  function startSynthPrinting() {
    if (!ensure() || printing) return;
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
    api.onPrintingChange(true);
  }

  function stopPrinting() {
    if (!printing) return;
    if (printing.el) {
      printing.el.pause();
      printing = null;
      api.onPrintingChange(false);
      return;
    }
    clearInterval(printing.timer);
    const t = ctx.currentTime;
    printing.humGain.gain.cancelScheduledValues(t);
    printing.humGain.gain.setValueAtTime(printing.humGain.gain.value, t);
    printing.humGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    printing.hum.stop(t + 0.3);
    printing = null;
    tone(1320, 0.05, 0.15, 'sine', 0.08);          // little "done" blip
    api.onPrintingChange(false);
  }

  // ---- overheat fan: plays from 0s, then loops LOOP_FROM-LOOP_TO smoothly (two copies cross-fade) while on;
  //      on stop it jumps to LOOP_TO and plays to the end of the file ----
  const OVERHEAT_FILE = 'audio/overheat.mp3';
  const LOOP_FROM = 14, LOOP_TO = 19, CROSSFADE = 1;
  let overheat = null;           // { a, b, cur, next, fadeStart, timer, stopping }

  function startOverheat() {
    if (overheat || typeof Audio === 'undefined') return;
    const state = { a: new Audio(OVERHEAT_FILE), b: new Audio(OVERHEAT_FILE), next: null, fadeStart: 0, timer: null, stopping: false };
    state.cur = state.a;
    state.cur.volume = volume;
    overheat = state;
    [state.a, state.b].forEach(el => {
      el.onended = () => { if (state.stopping) finishOverheat(state); };
      el.onerror = () => finishOverheat(state);
    });
    state.timer = setInterval(() => tickOverheat(state), 30);
    state.cur.play().catch(() => {});
    api.onOverheatChange(true);
  }

  function tickOverheat(state) {
    if (state.stopping) return;
    const now = performance.now() / 1000;
    if (!state.next) {
      if (state.cur.currentTime >= LOOP_TO - CROSSFADE) {
        state.next = state.cur === state.a ? state.b : state.a;
        state.next.currentTime = LOOP_FROM;
        state.next.volume = 0;
        state.next.play().catch(() => {});
        state.fadeStart = now;
      }
      return;
    }
    const t = Math.min(1, (now - state.fadeStart) / CROSSFADE);
    state.cur.volume = volume * (1 - t);
    state.next.volume = volume * t;
    if (t >= 1) {
      state.cur.pause();
      state.cur = state.next;
      state.next = null;
    }
  }

  function stopOverheat() {
    const state = overheat;
    if (!state || state.stopping) return;
    state.stopping = true;
    clearInterval(state.timer);
    if (state.next) { state.next.pause(); state.next = null; }
    state.cur.volume = volume;
    // The chime and the fan's ending (LOOP_TO to the end of the file) play together.
    if (state.cur.currentTime < LOOP_TO) state.cur.currentTime = LOOP_TO;
    state.cur.play().catch(() => {});
    playComplete();
    api.onOverheatChange(false);
  }

  function finishOverheat(state) {
    clearInterval(state.timer);
    if (overheat === state) overheat = null;
    api.onOverheatChange(false);
  }

  const api = C.office.audio = {
    onPrintingChange() {},                          // replaced by the debug panel to update its button
    onOverheatChange() {},
    onInkWarningChange() {},
    onPaperJamChange() {},
    setPaperJam,
    isPaperJam: () => !!jam,
    setInkWarning,
    isInkWarning: () => inkWarn,
    startOverheat,
    stopOverheat,
    isOverheating: () => !!overheat && !overheat.stopping,
    play(name) {
      if (SOUNDS[name] && ensure()) { SOUNDS[name]() }
    },
    startPrinting,
    stopPrinting,
    isPrinting: () => !!printing,
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume;
      if (printing && printing.el) printing.el.volume = volume;
      if (jam && !jam.next) jam.cur.volume = volume;
      if (inkEl) inkEl.volume = volume * INK_LEVEL;
      if (overheat && !overheat.next) overheat.cur.volume = volume;
    }
  };

  // ---- play the tray and print sounds when the real printer is used (clicks, or the Print button) ----
  const cassettes = C.parts.cassettes;
  const toggleTray = cassettes.toggleTray;
  cassettes.toggleTray = function () {
    const open = toggleTray();
    C.office.audio.play(open ? 'trayOpen' : 'trayClose');
    return open;
  };

  C.office.updaters.push(t => C.parts.inkPanel.update(t));

  // Turning the airflow (ventilation) on is the overheating state, so it drives the fan sound.
  const airflow = C.anim.airflow;
  const toggleAirflow = airflow.toggle;
  airflow.toggle = function () {
    const on = toggleAirflow();
    if (on) startOverheat(); else stopOverheat();
    return on;
  };

  const { printing: printAnim } = C.anim;
  const start = printAnim.start;
  const stop = printAnim.stop;
  printAnim.start = function () { start(); startPrinting(); };
  printAnim.stop = function () { stop(); stopPrinting(); };
})(window.Cetak);
