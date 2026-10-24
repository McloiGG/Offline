// Camera presets and smooth fly-to. Preset data lives in config.js (Cetak.config.VIEWS).
// Exposes: Cetak.ui.views = { goTo(name), setSpin(on), toggleSpin(), cancel(), update(), resetHome() }
(function (C) {
  const { VIEWS } = C.config;
  const { camera, controls } = C.scene;

  const infoEl = document.getElementById('info');
  const spinBtn = document.getElementById('spin');
  const viewBtns = document.querySelectorAll('[data-view]');

  let goal = null;   // { p, t } while the camera is flying to a preset

  const vec = (a, lift) => new THREE.Vector3(a[0], a[1] + lift, a[2]);

  function setSpin(on) {
    controls.autoRotate = on;
    spinBtn.textContent = 'Auto-rotate: ' + (on ? 'on' : 'off');
  }

  function goTo(name) {
    const view = VIEWS[name];
    const lift = C.state.shift;       // presets are authored for 2 cassettes; add the lift for 4
    goal = { p: vec(view.p, lift), t: vec(view.t, lift) };
    C.state.currentView = name;
    setSpin(false);
    infoEl.textContent = view.info;
    viewBtns.forEach(b => b.classList.toggle('on', b.dataset.view === name));
  }

  // Put the camera on the default 3/4 view instantly (no animation).
  function resetHome() {
    camera.position.set(...VIEWS.three.p);
    controls.target.set(...VIEWS.three.t);
    controls.update();
  }

  // Dragging with the mouse cancels any fly-to in progress.
  controls.addEventListener('start', () => { goal = null; });

  C.ui.views = {
    goTo,
    setSpin,
    toggleSpin: () => setSpin(!controls.autoRotate),
    resetHome,
    // Call every frame, before controls.update().
    update() {
      if (!goal) return;
      camera.position.lerp(goal.p, 0.08);
      controls.target.lerp(goal.t, 0.08);
      if (camera.position.distanceTo(goal.p) < 0.15 && controls.target.distanceTo(goal.t) < 0.15) {
        goal = null;
      }
    }
  };
})(window.Cetak);
