// Entry point: sets the starting camera and runs the render loop.
// Everything else is built by the files loaded before this one (see index.html).
(function (C) {
  const { scene, camera, renderer, controls } = C.scene;
  const { fans } = C.parts.vents;

  const FAN_SPEED = 9;            // radians per second
  const MAX_DT = 0.05;            // clamp so a background tab doesn't cause a huge jump

  C.ui.views.resetHome();

  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), MAX_DT);

    fans.forEach(blades => { blades.rotation.z -= dt * FAN_SPEED; });
    C.anim.printing.update(dt);
    C.anim.airflow.update(dt);
    C.parts.power.update();

    C.ui.views.update();
    controls.update();
    renderer.render(scene, camera);
  }
  frame();
})(window.Cetak);
