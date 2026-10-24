// Runs last: opens on the Office camera preset with auto-rotate off, so the camera doesn't orbit behind the walls.
(function (C) {
  const { camera, controls } = C.scene;
  const { p, t } = C.office.config.OFFICE_VIEW;

  C.ui.views.setSpin(false);
  camera.position.set(...p);
  controls.target.set(...t);
  controls.update();
  C.state.currentView = 'office';
  document.getElementById('info').textContent = C.office.config.OFFICE_VIEW.info;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === 'office'));
})(window.Cetak);
