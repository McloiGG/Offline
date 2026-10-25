// Click-to-zoom. Invisible boxes ("hit zones") sit over each compartment; clicking one flies the
// camera to that state. In state 5 you can also hold the wall plug and drag it out of / back into the socket.
(function (C) {
  const { D, ZF } = C.config;
  const { camera, renderer, printer, controls } = C.scene;
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

  addZone('s1', 70, 14, 6,  0,     27.4, ZF + 1, { isTray: true });   // paper cassette A4
  addZone('s2', 30, 12, 4, -19.5,  66.6, ZF + 2);              // ink display
  addZone('s3', 33, 18, 4,  19.3, 107,   ZF + 6);              // touchscreen
  addZone('s4', 6,  24, 36, 35.5,  64,  -6);                   // right vent
  addZone('s5', 16, 11, 3,  0,     13,  -D / 2 - 1.2);             // power port on the back

  // The drawer slides away from its zone, so its own meshes must be clickable too (to close it again).
  C.parts.cassettes.drawer.traverse(m => {
    if (!m.isMesh) return;
    m.userData.view = 's1';
    m.userData.isTray = true;
    zones.push(m);
  });

  // The blue logo opens / closes the ink tray; the caps on the cartridges open once the tray is out.
  zones.push(C.parts.inkPanel.hit, ...C.parts.inkPanel.capHits);

  // The power button on the touchscreen bezel is tested before the zones, because the touchscreen zone covers it.
  const powerHit = C.parts.powerButton.hit;

  // The wall plug is also a zone: clicking it from another view flies to the socket.
  power.hit.userData.view = 's5';
  zones.push(power.hit);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let downAt = null;

  // ---- holding and dragging the wall plug (State 5) ----
  // The pointer ray is intersected with a horizontal plane through the plug, and the plug follows its z.
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -C.config.WALL.socketY);
  const planePoint = new THREE.Vector3();
  let drag = null;                       // { grabZ, grabPull } while the plug is held

  function aim(e) {
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
  }
  const overPower = () => raycaster.intersectObject(powerHit, false).length > 0;
  const overPlug = () => C.state.currentView === 's5' && raycaster.intersectObject(power.hit, false).length > 0;
  // Where the ray meets the touchscreen, in the 1000x560 canvas coordinates of its image (null if it misses).
  const screenPoint = () => {
    const h = raycaster.intersectObject(C.parts.display.face, false)[0];
    return h ? { x: h.uv.x * 1000, y: (1 - h.uv.y) * 560 } : null;
  };
  const planeZ = () => (raycaster.ray.intersectPlane(plane, planePoint) ? planePoint.z : null);

  function endDrag() {
    if (!drag) return;
    drag = null;
    controls.enabled = true;
    power.release();
    renderer.domElement.style.cursor = '';
  }

  renderer.domElement.addEventListener('pointerdown', e => {
    downAt = [e.clientX, e.clientY];
    aim(e);
    if (!overPlug()) return;
    const z = planeZ();
    if (z === null) return;
    drag = { grabZ: z, grabPull: power.getPull() };
    downAt = null;                       // holding the plug is not a click
    controls.enabled = false;            // and must not orbit the camera
    renderer.domElement.style.cursor = 'grabbing';
  });

  renderer.domElement.addEventListener('pointermove', e => {
    if (drag) return;
    aim(e);
    const onKey = overPower();
    C.parts.powerButton.setHover(onKey);
    const p = C.state.currentView === 's3' ? screenPoint() : null;
    const onScreen = !!p && C.parts.wifi.hit(p.x, p.y);
    renderer.domElement.style.cursor = overPlug() ? 'grab' : onKey || onScreen ? 'pointer' : '';
  });

  addEventListener('pointermove', e => {
    if (!drag) return;
    aim(e);
    const z = planeZ();
    if (z !== null) power.setPull(drag.grabPull + z - drag.grabZ);
  });
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  renderer.domElement.addEventListener('pointerup', e => {
    // A drag (orbiting the camera) is not a click.
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;

    aim(e);
    // Tapping a button on the touchscreen (only once zoomed in on it).
    const tapAt = C.state.currentView === 's3' && C.parts.wifi.isOffline() ? screenPoint() : null;
    if (tapAt && !raycaster.intersectObject(powerHit, false).length) { C.parts.wifi.tap(tapAt.x, tapAt.y); return; }
    const hit = raycaster.intersectObject(powerHit, false)[0] || raycaster.intersectObjects(zones, false)[0];
    if (!hit) return;

    const zone = hit.object.userData;
    if (hit.object === powerHit) {
      C.ui.powerSwitch.toggle();
    } else if (zone.capIndex !== undefined) {
      // Caps open once the tray is out and you are looking at the ink display; otherwise this just zooms in.
      if (C.state.currentView !== zone.view) goTo(zone.view);
      else if (C.parts.inkPanel.isOut()) C.ui.toast(C.parts.inkPanel.toggleCap(zone.capIndex) ? 'Cap opened.' : 'Cap closed.');
    } else if (zone.isInk) {
      // From another view the first click just zooms in; once zoomed, it opens / closes the container.
      if (C.state.currentView !== zone.view) goTo(zone.view);
      else C.ui.toast(C.parts.inkPanel.toggleOut() ? 'Ink container opened.' : 'Ink container closed.');
    } else if (zone.isTray) {
      // Open/close the drawer. Opening also flies the camera in for a look at the paper.
      if (C.parts.cassettes.toggleTray()) goTo(zone.view);
    } else {
      goTo(zone.view);
    }
  });
})(window.Cetak);
