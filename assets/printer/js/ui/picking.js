// Click-to-zoom. Invisible boxes ("hit zones") sit over each compartment; clicking one flies the
// camera to that state. In state 5 the back zone is the plug itself and toggles it instead.
(function (C) {
  const { D, ZF } = C.config;
  const { camera, renderer, printer } = C.scene;
  const { goTo } = C.ui.views;
  const power = C.parts.power;

  const zones = [];

  // size (w,h,d) and position (x,y,z) are in world units.
  function addZone(view, w, h, d, x, y, z, extra) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    mesh.position.set(x, y, z);
    mesh.userData = Object.assign({ view }, extra);
    printer.add(mesh);
    zones.push(mesh);
  }

  addZone('s1', 70, 14, 6,  0,     30,   ZF + 1);              // paper cassette C1
  addZone('s2', 30, 12, 4, -19.5,  66.6, ZF + 2);              // ink display
  addZone('s3', 33, 18, 4,  19.3, 107,   ZF + 6);              // touchscreen
  addZone('s4', 6,  24, 36, 35.5,  64,  -6);                   // right vent
  addZone('s5', 16, 11, 3,  0,     13,  -D / 2 - 1.2, { isPlug: true });   // power plug

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let downAt = null;

  renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });

  renderer.domElement.addEventListener('pointerup', e => {
    // A drag (orbiting the camera) is not a click.
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;

    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(zones, false)[0];
    if (!hit) return;

    const zone = hit.object.userData;
    if (zone.isPlug && C.state.currentView === 's5') {
      const plugged = power.toggle();
      C.ui.toast(plugged
        ? 'Plugged back in. Printer rebooting...'
        : 'Unplugged. Click the port again to plug it back in.');
    } else {
      goTo(zone.view);
    }
  });
})(window.Cetak);
