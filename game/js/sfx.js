// Small procedural sound effects on the shared Web Audio engine (no files): UI taps, chimes, buzzers, the clock tick.
(function (O) {
  const E = window.Cetak.office.engine;
  const ready = () => E.ensure();
  const arp = (notes, step, dur, type, gain) => notes.forEach((f, i) => E.tone(f, i * step, dur, type, gain));
  O.sfx = {
    click() { if (ready()) E.tone(880, 0, 0.05, 'square', 0.05); },
    tap() { if (ready()) { E.tone(1500, 0, 0.03, 'triangle', 0.08); E.tone(700, 0.02, 0.05, 'sine', 0.06); } },
    chime() { if (ready()) arp([660, 880, 1320], 0.12, 0.34, 'sine', 0.2); },
    fakeOk() { if (ready()) arp([740, 988], 0.1, 0.2, 'sine', 0.14); },
    wrong() { if (ready()) E.tone(320, 0, 0.14, 'square', 0.1, 190); },
    fail() { if (ready()) { E.tone(190, 0, 0.4, 'sawtooth', 0.18, 90); E.tone(150, 0.2, 0.45, 'sawtooth', 0.18, 70); } },
    tick(odd) { if (ready()) E.tone(odd ? 1100 : 1500, 0, 0.03, 'square', 0.07); },
    boot() { if (ready()) { arp([330, 440, 554, 740], 0.16, 0.3, 'triangle', 0.16); E.swish(0, 0.6, 400, 1800, 0.08, 1); } },
    hint() { if (ready()) arp([523, 659], 0.09, 0.18, 'triangle', 0.12); },
    swap() { if (ready()) { E.swish(0, 0.28, 900, 220, 0.2, 1.2); E.tone(260, 0.22, 0.1, 'square', 0.09, 200); } },
    pull() { if (ready()) { E.swish(0, 0.32, 500, 2400, 0.16, 1.4); E.tone(180, 0.26, 0.08, 'square', 0.08, 120); } },
    page() { if (ready()) { E.swish(0, 0.45, 3200, 900, 0.14, 1); E.tone(520, 0.4, 0.12, 'sine', 0.08); } },
    blip() { if (ready()) E.tone(1200, 0, 0.04, 'sine', 0.06); }
  };
})(window.Offline);
