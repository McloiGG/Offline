// Printer condition: keeps the 3D printer, the touchscreen and the alarm sounds in step with Offline.world.
(function (O) {
  const C = window.Cetak, W = O.world, S = O.screen;
  const { cassettes, inkPanel, display } = C.parts;
  const { airflow } = C.anim;
  const audio = C.office.audio;
  const { Y, ZF } = C.config;

  // The game owns tank levels and the paper count (DANN's debug toggles used to set them).
  audio.onInkWarningChange = audio.onPaperJamChange = () => {};

  // ---- a crumpled sheet stuck in the open drawer ----
  const floorY = Y(465) + 1.2, midZ = ZF - 2.5 - 56 + 0.8 + 21;
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xfff6dc, roughness: 0.9, side: THREE.DoubleSide });
  const jam = new THREE.Group();
  [[0, 5.6, 4, -0.55, 0, 0.12], [-3, 4.4, -2, 0.5, 0.3, -0.25], [4, 3.6, 8, -0.2, -0.4, 0.5]].forEach(([x, y, z, rx, ry, rz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(26, 0.3, 15), sheetMat);
    m.position.set(x, floorY + y, midZ + z); m.rotation.set(rx, ry, rz); jam.add(m);
  });
  jam.visible = false;
  cassettes.drawer.add(jam);
  const jamHit = new THREE.Mesh(new THREE.BoxGeometry(36, 14, 30), new THREE.MeshBasicMaterial({ visible: false }));
  jamHit.position.set(0, floorY + 5, midZ + 2); jamHit.visible = false;
  cassettes.drawer.add(jamHit);

  // ---- small tweens (ink refills, temperature) ----
  const tweens = [];
  const tween = (len, fn, done) => tweens.push({ t: 0, len, fn, done });
  C.office.updaters.push((t, dt) => {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i]; w.t += dt;
      const k = Math.min(1, w.t / w.len); w.fn(k * k * (3 - 2 * k));
      if (k >= 1) { tweens.splice(i, 1); if (w.done) w.done(); }
    }
    if (Math.abs(heatGoal - W.temp) > 0.004) {
      W.temp += (heatGoal - W.temp) * Math.min(1, dt * (heatGoal > W.temp ? 0.35 : 0.8));
      S.dirty = true;
    }
  });
  let heatGoal = 0.3;

  const F = O.fx = { jam, jamHit, tween, emptyTank: 2 };

  F.setInk = (i, v) => { W.ink[i] = v; inkPanel.setLevel(i, v); };
  F.refill = i => {
    const from = W.ink[i];
    tween(0.8, k => F.setInk(i, from + (1 - from) * k));
  };
  F.setPaper = n => { W.paper = n; cassettes.setPaperCount(n); };
  F.setNet = on => { W.net = on; S.net = on; S.redraw(); };
  F.setJam = on => { jam.visible = on; jamHit.visible = on; jam.scale.setScalar(1); jam.position.y = 0; };
  let trayOut = false;
  F.trayOpen = () => trayOut;
  F.openTray = () => { if (!trayOut) { trayOut = true; cassettes.toggleTray(); } };
  F.closeTray = () => { if (trayOut) { trayOut = false; cassettes.toggleTray(); } };
  F.quietUntil = 0;                                   // power changes before this time are the game resetting, not the player

  // The condition of each state. apply() starts it, clear() ends it.
  F.apply = key => {
    W.fault = key;
    S.setFault(key === 'cable' ? null : key);
    if (key === 'jam') { F.setPaper(12); F.setJam(true); audio.setPaperJam(true); W.job = 0; }
    if (key === 'ink') {
      F.emptyTank = 1 + Math.floor(Math.random() * 3);
      F.setInk(F.emptyTank, 0); audio.setInkWarning(true); W.job = 1;
    }
    if (key === 'offline') { F.setNet(false); W.job = 2; }
    if (key === 'heat') { heatGoal = 1; airflow.heat(); audio.startOverheat(); W.job = 4; }
    if (key === 'cable') { S.freeze(true); W.job = 3; }
  };
  F.clear = () => {
    const was = W.fault;
    W.fault = null; S.setFault(null); S.freeze(false);
    if (was === 'jam') { F.setJam(false); audio.setPaperJam(false); F.setPaper(20); }
    if (was === 'ink') { audio.setInkWarning(false); F.refill(F.emptyTank); }
    if (was === 'offline') F.setNet(true);
    if (was === 'heat') {
      heatGoal = 0.3;
      const len = audio.stopOverheat();
      airflow.cool(Math.min(4, len || 4));
    }
  };
  F.reset = () => {
    audio.setPaperJam(false); audio.setInkWarning(false); audio.stopOverheat();
    airflow.cool(0.01); heatGoal = 0.3; W.temp = 0.3;
    F.setJam(false); F.setPaper(20); F.setNet(true);
    [0.85, 0.7, 0.55, 0.9].forEach((v, i) => F.setInk(i, v));
    W.fault = null; W.queue = 47; W.progress = 0; W.job = 0; W.eco = false;
    S.setFault(null); S.freeze(false); S.go('home'); S.overlay = null; S.diag = null; S.booting = null;
    F.closeTray();
    const pw = C.parts.power;
    if (!pw.isPlugged() || pw.getPull() > 0) { F.quietUntil = performance.now() + 600; pw.setPull(0); pw.release(); }
    display.setPower(true); inkPanel.setPower(true);
  };

  // The printer goes dark when the plug is out, and comes back with a boot screen.
  C.parts.power.onChange(plugged => {
    display.setPower(plugged); inkPanel.setPower(plugged);
    if (plugged) S.boot(2700, () => { if (O.game.playing() && O.game.state().key !== 'cable') S.flash('Printer ready', 'ok', 1100); });
  });
})(window.Offline);
