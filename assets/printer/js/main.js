// Entry point: sets the starting camera and runs the render loop.
// Everything else is built by the files loaded before this one (see index.html).
(function (C) {
  const { scene, camera, renderer, controls } = C.scene;
  const { fans } = C.parts.vents;

  const FAN_SPEED = 9;            // radians per second
  const MAX_DT = 0.05;            // clamp so a background tab doesn't cause a huge jump

  C.ui.views.resetHome();

  let fanPower = 1;               // 1 = full speed, 0 = stopped

  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), MAX_DT);

    // The fans spin down when the printer is unplugged and spin back up when it has power again.
    fanPower += ((C.parts.power.isPlugged() ? 1 : 0) - fanPower) * (1 - Math.exp(-(C.parts.power.isPlugged() ? 3 : 1.2) * dt));
    if (fanPower < 0.002) fanPower = 0;
    fans.forEach(blades => { blades.rotation.z -= dt * FAN_SPEED * fanPower; });
    C.parts.cassettes.update(dt);
    C.anim.printing.update(dt);
    C.anim.airflow.update(dt);
    C.parts.power.update(dt);

    C.ui.views.update();
    controls.update();
    renderer.render(scene, camera);
  }
  frame();
})(window.Cetak);
