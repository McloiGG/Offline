// Audio engine: the Web Audio context, master volume, and the tone / swish helpers the effects are built from.
// Browsers only allow sound after a user gesture, so the AudioContext is created on first use (ensure()).
// Creates Cetak.office.engine and Cetak.office.audio (the other files in this folder add the methods).
(function (C) {
  const volumeListeners = [];

  const engine = C.office.engine = {
    ctx: null,
    master: null,
    volume: 0.6,

    ensure() {
      if (!engine.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        engine.ctx = new AC();
        engine.master = engine.ctx.createGain();
        engine.master.gain.value = engine.volume;
        engine.master.connect(engine.ctx.destination);
      }
      if (engine.ctx.state === 'suspended') engine.ctx.resume();
      return true;
    },

    // Register fn(volume) to be called whenever the master volume changes.
    onVolume: fn => volumeListeners.push(fn),

    setVolume(v) {
      engine.volume = Math.max(0, Math.min(1, v));
      if (engine.master) engine.master.gain.value = engine.volume;
      volumeListeners.forEach(fn => fn(engine.volume));
    },

    // A tone with a quick attack and exponential decay. `at` is seconds from now.
    tone(freq, at, dur, type, gain, freqEnd) {
      const { ctx, master } = engine;
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
    },

    // Filtered noise burst; the filter frequency sweeps from `f0` to `f1`.
    swish(at, dur, f0, f1, gain, q) {
      const { ctx, master } = engine;
      const t = ctx.currentTime + at;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer();
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
  };

  let noise = null;
  function noiseBuffer() {
    if (!noise) {
      const { ctx } = engine;
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noise;
  }

  // The public API. The debug panel replaces the on...Change hooks to update its buttons.
  C.office.audio = {
    onPrintingChange() {},
    onOverheatChange() {},
    onInkWarningChange() {},
    onPaperJamChange() {}
  };
})(window.Cetak);
