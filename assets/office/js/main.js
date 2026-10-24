// Office update loop. Runs the per-frame callbacks registered in Cetak.office.updaters.
// Load this BEFORE printer/js/main.js: its requestAnimationFrame callback then runs first each frame,
// and the printer's loop (loaded after) renders the result.
(function (C) {
  const MAX_DT = 0.05;
  const clock = new THREE.Clock();
  let t = 0;

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), MAX_DT);
    t += dt;
    C.office.updaters.forEach(fn => fn(t, dt));
  }
  frame();
})(window.Cetak);
