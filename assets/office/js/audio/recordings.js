// Helpers for the mp3 recordings in /audio (their volume follows the master volume).
// Exposes Cetak.office.recordings = { loop(file, level), crossfadeLoop(file, opts) }.
(function (C) {
  const { engine } = C.office;

  // A plain looping recording at `level` times the master volume. Returns null where Audio is unavailable.
  function loop(file, level = 1) {
    if (typeof Audio === 'undefined') return null;
    const el = new Audio(file);
    el.loop = true;
    el.volume = engine.volume * level;
    el.play().catch(() => {});
    engine.onVolume(v => { el.volume = v * level; });
    return el;
  }

  // Loops the section from..to of a recording without a seam: two copies of the file cross-fade over `fade` seconds.
  // opts: { start (seconds to begin at), from, to, fade, onLoop() }
  function crossfadeLoop(file, opts) {
    const a = new Audio(file), b = new Audio(file);
    let cur = a, next = null, fadeStart = 0, timer = null;

    function tick() {
      const now = performance.now() / 1000;
      if (!next) {
        if (cur.currentTime < opts.to - opts.fade) return;
        next = cur === a ? b : a;
        next.currentTime = opts.from;
        next.volume = 0;
        next.play().catch(() => {});
        fadeStart = now;
        if (opts.onLoop) opts.onLoop();
        return;
      }
      const t = Math.min(1, (now - fadeStart) / opts.fade);
      cur.volume = engine.volume * (1 - t);
      next.volume = engine.volume * t;
      if (t >= 1) {
        cur.pause();
        cur = next;
        next = null;
      }
    }

    engine.onVolume(v => { if (!next) cur.volume = v; });

    return {
      elements: [a, b],
      play() {
        cur.volume = engine.volume;
        if (opts.start) cur.currentTime = opts.start;
        timer = setInterval(tick, 30);
        cur.play().catch(() => {});
      },
      // Stop looping but leave the current copy playing; returns it.
      freeze() {
        clearInterval(timer);
        if (next) { next.pause(); next = null; }
        cur.volume = engine.volume;
        return cur;
      },
      stop() {
        clearInterval(timer);
        a.pause();
        b.pause();
      }
    };
  }

  C.office.recordings = { loop, crossfadeLoop };
})(window.Cetak);
