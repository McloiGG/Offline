// Click-to-zoom and interaction picking for the 3D scene (replaces the demo's ui/picking.js).
// First click on a part flies the camera to that part; once there, clicks interact with it.
// The pointer is mapped through the canvas's own bounding box, so it is right at any window size.
(function (O) {
  const C = window.Cetak;
  const { D, ZF } = C.config;
  const { camera, renderer, printer, controls } = C.scene;
  const { goTo } = C.ui.views;
  const power = C.parts.power;
  const dom = renderer.domElement;

  // Higher and further back than the demo preset: a dropped plug falls to the floor and must stay on screen.
  C.config.VIEWS.s5 = { p: [78, 90, -14], t: [42, -4, -80], info: C.config.VIEWS.s5.info };

  controls.minDistance = 20;                           // the ink view sits ~39 units from its target

  const zones = [], defs = {};
  const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const FREE_VIEWS = { three: 1, front: 1, office: 1 };
  let down = null, drag = null, hoverName = null;

  const mk = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(x, y, z); printer.add(m); return m;
  };
  // handlers: enter(hit) on the zoom-in click, click(hit, raycaster) once zoomed in.
  function register(name, view, meshes, handlers) {
    defs[name] = Object.assign({ name, view }, handlers);
    meshes.forEach(m => { m.userData.zone = name; zones.push(m); });
  }

  const drawerMeshes = [];
  C.parts.cassettes.drawer.traverse(m => { if (m.isMesh) drawerMeshes.push(m); });
  register('tray', 's1', [mk(70, 14, 6, 0, 27.4, ZF + 1)].concat(drawerMeshes));
  register('ink', 's2', [mk(30, 12, 4, -19.5, 66.6, ZF + 2)]);
  register('screen', 's3', [C.parts.display.children[1], C.parts.display.children[2]]);
  register('vent', 's4', [mk(6, 24, 36, 35.5, 64, -6)]);
  register('port', 's5', [mk(16, 11, 3, 0, 13, -D / 2 - 1.2)]);
  register('plug', 's5', [power.hit]);

  function aim(e) {
    const r = dom.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
  }
  function pick() {
    // sheets that were removed stay in the scene graph with visible = false, so skip them
    return raycaster.intersectObjects(zones, false).find(h => h.object.visible) || null;
  }
  const zoneOf = hit => hit && defs[hit.object.userData.zone];
  const zoomed = () => !FREE_VIEWS[C.state.currentView];
  const overPlug = () => raycaster.intersectObject(power.hit, false).length > 0;

  // ---- holding the wall plug: the pointer ray meets a horizontal plane through the socket, and the plug follows its z ----
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -C.config.WALL.socketY);
  const planePoint = new THREE.Vector3();
  const planeZ = () => (raycaster.ray.intersectPlane(plane, planePoint) ? planePoint.z : null);

  function endDrag() {
    if (!drag) return;
    drag = null; power.release(); dom.style.cursor = '';
    if (O.pick.onDrag) O.pick.onDrag(false);
  }

  dom.addEventListener('pointerdown', e => {
    if (!O.pick.enabled) return;
    down = [e.clientX, e.clientY];
    aim(e);
    if (!overPlug() || C.state.currentView !== 's5') return;   // from any other view a click on the plug flies the camera to it
    const z = planeZ();
    if (z === null) return;
    drag = { grabZ: z, grabPull: power.getPull() };
    down = null; controls.enabled = false; dom.style.cursor = 'grabbing';
    if (O.pick.onDrag) O.pick.onDrag(true);
  });

  addEventListener('pointermove', e => {
    if (!drag) return;
    aim(e);
    const z = planeZ();
    if (z !== null) power.setPull(drag.grabPull + z - drag.grabZ);
  });
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  dom.addEventListener('pointermove', e => {
    if (!O.pick.enabled || drag) return;
    aim(e);
    const hit = pick();
    const name = overPlug() ? 'plug' : (hit ? hit.object.userData.zone : null);
    dom.style.cursor = name === 'plug' && C.state.currentView === 's5' ? 'grab' : (name ? 'pointer' : '');
    if (name !== hoverName) { hoverName = name; if (O.pick.onHover) O.pick.onHover(name); }
  });

  dom.addEventListener('pointerup', e => {
    if (!O.pick.enabled || !down) return;
    const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
    down = null;
    if (moved > 5) return;                             // a drag (orbiting the camera) is not a click
    aim(e);
    const hit = pick(), zone = zoneOf(hit);
    if (!zone) return;                                 // stepping back out is the Back button / Esc, so a misclick can't eject you
    if (O.pick.onClick) O.pick.onClick(zone.name);
    if (C.state.currentView !== zone.view) { goTo(zone.view); if (zone.enter) zone.enter(hit); return; }
    if (zone.click) zone.click(hit, raycaster);
  });

  // Orbiting is only for the free views; a zoomed-in part is looked at, not orbited (and a click can't cancel the fly-in).
  C.office.updaters.push(() => { controls.enabled = !drag && O.pick.enabled && !zoomed(); });

  O.pick = {
    enabled: false, zones, defs, raycaster, register, mk,
    zoomed, view: () => C.state.currentView,
    out() { goTo('three'); },
    zoomTo(name) { goTo(defs[name] ? defs[name].view : name); }
  };
})(window.Offline);
