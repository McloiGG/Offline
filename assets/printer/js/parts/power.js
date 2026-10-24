// Power: port on the back, a plug that slides in and out, the wall + socket, and a cord that
// is rebuilt each time the plug moves.
// Exposes: Cetak.parts.power = { plug, toggle(), isPlugged(), update() }
(function (C) {
  const { D, WALL, PLUG } = C.config;
  const { shadow, label } = C.helpers;
  const { scene, printer } = C.scene;
  const { dark, black, black2, grey } = C.mat;

  const PRONGS = [-1.6, 1.6];

  // ---- port on the printer's back ----
  const port = new THREE.Group();
  port.position.set(0, PLUG.y, -D / 2);
  printer.add(port);

  const plate = shadow(new THREE.Mesh(new THREE.BoxGeometry(14, 9, 0.8), dark));
  plate.position.z = -0.2;
  port.add(plate);

  const hole = new THREE.Mesh(new THREE.BoxGeometry(8, 4.6, 0.9), black2);
  hole.position.z = -0.35;
  port.add(hole);

  PRONGS.forEach(x => {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.4), grey);
    pin.position.set(x, 0, -0.55);
    port.add(pin);
  });

  const portLabel = label('POWER', 0, 0, 7, 1.6, 0, '#9aa0a8', 'bold', port);
  portLabel.position.set(0, -5.6, -0.7);
  portLabel.rotation.y = Math.PI;

  // ---- the plug (slides between PLUG_IN and PLUG_OUT) ----
  const PLUG_IN = new THREE.Vector3(0, PLUG.y, PLUG.inZ);
  const PLUG_OUT = new THREE.Vector3(0, PLUG.y, PLUG.outZ);

  const plug = new THREE.Group();
  plug.position.copy(PLUG_IN);
  printer.add(plug);

  const plugHead = shadow(new THREE.Mesh(new THREE.BoxGeometry(7.4, 4.2, 5), black));
  plugHead.position.z = -2.5;
  plug.add(plugHead);

  PRONGS.forEach(x => {
    const prong = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 3), grey));
    prong.position.set(x, 0, 1.2);
    plug.add(prong);
  });

  // ---- wall + socket ----
  const plain = (color, roughness) => new THREE.MeshStandardMaterial({ color, roughness });

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(2400, 600), plain(0xdfe3ea, 0.95));
  wall.position.set(0, 300, WALL.z);
  wall.receiveShadow = true;
  scene.add(wall);

  const skirting = new THREE.Mesh(new THREE.BoxGeometry(2400, 7, 1.2), plain(0xc3c8d1, 0.8));
  skirting.position.set(0, 3.5, WALL.z + 0.6);
  scene.add(skirting);

  const socketPlate = shadow(new THREE.Mesh(new THREE.BoxGeometry(14, 14, 1), plain(0xf4f5f7, 0.4)));
  socketPlate.position.set(WALL.socketX, WALL.socketY, WALL.z + 0.5);
  scene.add(socketPlate);

  [-1.7, 1.7].forEach(x => {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.3), black2);
    slot.position.set(WALL.socketX + x, WALL.socketY, WALL.z + 1.05);
    scene.add(slot);
  });

  const wallPlug = shadow(new THREE.Mesh(new THREE.BoxGeometry(7.4, 4.2, 5), black));
  wallPlug.position.set(WALL.socketX, WALL.socketY, WALL.z + 4);
  scene.add(wallPlug);

  // ---- cord: curve from the moving plug to the fixed wall plug ----
  const cordEnd = new THREE.Vector3(WALL.socketX, WALL.socketY, WALL.z + 6.6);
  const lastPlugPos = new THREE.Vector3(1e9, 0, 0);
  let cord = null;

  function rebuildCord() {
    const a = plug.position.clone().add(new THREE.Vector3(0, 0, -5));
    const mid = a.clone().lerp(cordEnd, 0.5);
    const sag = Math.max(1.2, Math.min(a.y, cordEnd.y) * 0.08);
    const points = [
      a,
      a.clone().add(new THREE.Vector3(0, -1.5, -5)),
      new THREE.Vector3(mid.x * 0.8 + a.x * 0.2, sag, a.z * 0.65 + cordEnd.z * 0.35),
      new THREE.Vector3(mid.x, sag, mid.z),
      new THREE.Vector3(mid.x * 0.4 + cordEnd.x * 0.6, sag, a.z * 0.3 + cordEnd.z * 0.7),
      new THREE.Vector3(cordEnd.x, WALL.socketY - 8, cordEnd.z + 4),
      cordEnd.clone().add(new THREE.Vector3(0, 0, 0.6))
    ];
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 60, 0.7, 8, false);
    if (cord) {
      cord.geometry.dispose();
      cord.geometry = geometry;
    } else {
      cord = shadow(new THREE.Mesh(geometry, black));
      scene.add(cord);
    }
    lastPlugPos.copy(plug.position);
  }
  rebuildCord();

  // ---- public API ----
  let plugged = true;
  let target = PLUG_IN;

  C.parts.power = {
    plug,
    isPlugged: () => plugged,
    toggle() {
      plugged = !plugged;
      target = plugged ? PLUG_IN : PLUG_OUT;
      return plugged;
    },
    // Call every frame: eases the plug toward its target and rebuilds the cord if it moved.
    update() {
      plug.position.lerp(target, 0.12);
      if (plug.position.distanceToSquared(lastPlugPos) > 0.0004) rebuildCord();
    }
  };
})(window.Cetak);
