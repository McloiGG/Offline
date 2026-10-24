/* OFFLINE - procedural audio (WebAudio). No asset files. */
(function (global) {
  'use strict';

  var ctx = null, master = null, hum = null, humGain = null, humFilter = null, ambient = null;
  var severity = 0, muted = false, noiseBuf = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    var len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ensure()) return;
    var t = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, freq, q, when, type) {
    if (!ensure()) return;
    var t = ctx.currentTime + (when || 0);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = type || 'bandpass';
    f.frequency.value = freq || 1000;
    f.Q.value = q || 1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  var A = {
    unlock: function () { ensure(); },

    setMuted: function (m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.8;
    },
    isMuted: function () { return muted; },

    startAmbient: function () {
      if (!ensure() || ambient) return;
      ambient = ctx.createGain();
      ambient.gain.value = 0.05;
      ambient.connect(master);
      [110, 164.8, 220.4].forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.5 / (i + 1);
        o.connect(g); g.connect(ambient); o.start();
      });
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; s.loop = true;
      f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0.25;
      s.connect(f); f.connect(g); g.connect(ambient); s.start();
    },

    startHum: function () {
      if (!ensure() || hum) return;
      hum = ctx.createOscillator();
      var hum2 = ctx.createOscillator();
      humGain = ctx.createGain();
      humFilter = ctx.createBiquadFilter();
      hum.type = 'sawtooth'; hum.frequency.value = 58;
      hum2.type = 'square'; hum2.frequency.value = 87;
      humFilter.type = 'lowpass'; humFilter.frequency.value = 220;
      humGain.gain.value = 0.0001;
      hum.connect(humFilter); hum2.connect(humFilter);
      humFilter.connect(humGain); humGain.connect(master);
      hum.start(); hum2.start();
      hum._second = hum2;
      A.updateHum();
    },

    setSeverity: function (n) { severity = n; A.updateHum(); },

    updateHum: function (off) {
      if (!hum) return;
      var t = ctx.currentTime;
      var vol = off ? 0.0001 : 0.025 + Math.min(severity, 6) * 0.012;
      var f = 58 + Math.min(severity, 6) * 5;
      humGain.gain.linearRampToValueAtTime(vol, t + 0.4);
      hum.frequency.linearRampToValueAtTime(f, t + 0.4);
      hum._second.frequency.linearRampToValueAtTime(f * 1.5, t + 0.4);
      humFilter.frequency.linearRampToValueAtTime(220 + severity * 90, t + 0.4);
    },

    hushHum: function (off) { A.updateHum(off); },

    click: function () { noise(0.04, 0.35, 2400, 3); tone(180, 0.05, 'square', 0.12); },
    chime: function () { tone(880, 0.18, 'sine', 0.18); tone(1318, 0.28, 'sine', 0.16, 0.09); },
    fail: function () { tone(220, 0.45, 'sawtooth', 0.2, 0, 90); noise(0.25, 0.12, 300, 1, 0, 'lowpass'); },
    tick: function () { tone(1500, 0.03, 'square', 0.08); },
    clockTick: function () { tone(900, 0.04, 'square', 0.13); },
    crunch: function () {
      for (var i = 0; i < 5; i++) noise(0.07, 0.3, 1800 + i * 300, 2, i * 0.06);
    },
    solved: function () { tone(523, 0.14, 'triangle', 0.2); tone(659, 0.14, 'triangle', 0.2, 0.12); tone(784, 0.3, 'triangle', 0.2, 0.24); },
    startup: function () {
      tone(200, 0.9, 'sawtooth', 0.12, 0, 600);
      tone(400, 0.9, 'sine', 0.1, 0.15, 1200);
      tone(1046, 0.3, 'sine', 0.14, 0.95);
    },
    shutdown: function () { tone(500, 1.2, 'sawtooth', 0.14, 0, 60); },
    print: function () {
      for (var i = 0; i < 10; i++) noise(0.09, 0.2, 700, 1.2, i * 0.11);
    },
    land: function () { noise(0.12, 0.25, 500, 0.8, 0, 'lowpass'); noise(0.3, 0.08, 3000, 1, 0.05, 'highpass'); },
    hm: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(130, t);
      o.frequency.linearRampToValueAtTime(112, t + 0.55);
      f.type = 'lowpass'; f.frequency.value = 520;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.65);
    },
    pen: function () { noise(0.18, 0.12, 4200, 4); noise(0.12, 0.1, 3600, 4, 0.22); },
    page: function () { noise(0.2, 0.08, 2200, 1, 0, 'highpass'); },
    heat: function () { noise(0.5, 0.1, 6000, 1, 0, 'highpass'); },
    vent: function () { noise(4, 0.12, 2500, 0.7, 0, 'highpass'); }
  };

  global.OFFLINE = global.OFFLINE || {};
  global.OFFLINE.Audio = A;
})(window);
