// Fits everything to the browser window: the menu stage is scaled to cover/contain and centered,
// the 3D renderer follows the window size and pixel ratio. Also the ?debug switch.
(function (O) {
  const C = window.Cetak;
  const stage = document.getElementById('stage');
  const menu = document.getElementById('menu');
  const W = 1920, H = 1104;
  let zoom = 1, focus = [W / 2, H / 2];

  function layout() {
    // contain: the whole desk is always visible, and the blurred copy of the art fills the bars.
    const k = Math.min(innerWidth / W, innerHeight / H), s = k * zoom;
    // push-in: scale about the stage centre, then slide the focus point (the printer in the art) to the middle
    const tx = -s * (focus[0] - W / 2), ty = -s * (focus[1] - H / 2);
    stage.style.transform = 'translate(-50%, -50%) translate(' + tx + 'px, ' + ty + 'px) scale(' + s + ')';
    const r = C.scene.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setSize(innerWidth, innerHeight);
    C.scene.camera.aspect = innerWidth / innerHeight;
    C.scene.camera.updateProjectionMatrix();
    O.stageScale = k;
  }

  O.fit = {
    layout,
    // z = 1 is the whole desk; larger zooms in on `at` = [x, y] in the 1920x1104 art.
    setZoom(z, at) {
      zoom = z;
      if (at) focus = at;
      layout();
    }
  };

  if (/[?&]debug\b/.test(location.search)) document.body.classList.add('debug');
  addEventListener('resize', layout);
  layout();
  menu.classList.remove('leaving');
})(window.Offline);
