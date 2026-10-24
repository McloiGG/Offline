// Power: port on the back with its plug, the wall + socket, a wall plug you can pull out, and a cord that
// is rebuilt each time the wall plug moves. A released plug that is pulled out drops to the floor.
// Exposes: Cetak.parts.power = { plug, wallPlug, hit, isPlugged(), getPull(), onChange(fn), onLand(fn), setPull(v), release(), update(dt) }
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

  // ---- the printer-side plug: stays seated in the port ----
  const plug = new THREE.Group();
  plug.position.set(0, PLUG.y, PLUG.inZ);
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

  // ---- the wall plug: the one you hold and pull out of the socket (State 5) ----
  const PULL_MAX = 16;        // how far it can be pulled out of the socket
  const UNPLUG_AT = 1;        // pulled out further than this = the printer has no power
  const SNAP_BACK = 4;        // released closer than this = it snaps back into the socket
  const IN_Z = WALL.z + 4;    // plugged in

  const wallPlug = new THREE.Group();
  wallPlug.position.set(WALL.socketX, WALL.socketY, IN_Z);
  scene.add(wallPlug);

  wallPlug.add(shadow(new THREE.Mesh(new THREE.BoxGeometry(7.4, 4.2, 5), black)));
  [-1.7, 1.7].forEach(x => {
    const prong = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 2.4), grey));
    prong.position.set(x, 0, -3.7);
    wallPlug.add(prong);
  });

  // Invisible, slightly larger box for clicking / grabbing the plug.
  const hit = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 9), new THREE.MeshBasicMaterial({ visible: false }));
  wallPlug.add(hit);

  // ---- cord: curve from the printer plug to the wall plug (rebuilt whenever the wall plug moves) ----
  const toWorld = new THREE.Vector3();
  let cord = null;

  // A point on the wall plug's local z axis (+z is the back of the plug, where the cord leaves).
  function plugPoint(z) {
    return wallPlug.localToWorld(toWorld.set(0, 0, z)).clone();
  }

  function rebuildCord() {
    wallPlug.updateMatrixWorld(true);
    const a = plug.position.clone().add(new THREE.Vector3(0, 0, -5));
    const e = plugPoint(2.6);
    const lead = plugPoint(6.6);
    const mid = a.clone().lerp(e, 0.5);
    const sag = Math.max(1.2, Math.min(a.y, e.y) * 0.08);
    lead.y = (lead.y + sag) / 2 - Math.max(0, e.y - sag) * 0.3;
    const points = [
      a,
      a.clone().add(new THREE.Vector3(0, -1.5, -5)),
      new THREE.Vector3(mid.x * 0.8 + a.x * 0.2, sag, a.z * 0.65 + e.z * 0.35),
      new THREE.Vector3(mid.x, sag, mid.z),
      new THREE.Vector3(mid.x * 0.4 + e.x * 0.6, sag, a.z * 0.3 + e.z * 0.7),
      lead,
      e
    ];
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 60, 0.7, 8, false);
    if (cord) {
      cord.geometry.dispose();
      cord.geometry = geometry;
    } else {
      cord = shadow(new THREE.Mesh(geometry, black));
      scene.add(cord);
    }
  }

  // ---- state ----
  // 'socket' = seated (or snapping back), 'held' = in the player's hand, 'fallen' = dropped and simulated.
  const SOCKET = new THREE.Vector3(WALL.socketX, WALL.socketY, IN_Z);
  const GRAVITY = 600;
  let mode = 'socket';
  let pull = 0;               // distance of the plug out of the socket along z (while seated / held)
  let plugged = true;
  const vel = new THREE.Vector3();
  const spin = { x: 0, z: 0 };
  let lastSig = NaN;
  const changeListeners = [];
  const landListeners = [];

  function setPlugged(v) {
    if (v === plugged) return;
    plugged = v;
    changeListeners.forEach(fn => fn(plugged));
  }

  // Half the plug's height when tilted, so it rests on the floor instead of sinking in.
  function halfHeight() {
    const rx = wallPlug.rotation.x, rz = wallPlug.rotation.z;
    return 2.1 * Math.cos(rx) * Math.cos(rz) + 2.5 * Math.abs(Math.sin(rx)) + 3.7 * Math.abs(Math.sin(rz));
  }

  function simulateFall(dt) {
    const p = wallPlug.position, r = wallPlug.rotation;
    vel.y -= GRAVITY * dt;
    p.addScaledVector(vel, dt);
    r.x += spin.x * dt;
    r.z += spin.z * dt;
    p.z = Math.max(p.z, WALL.z + 3);                // never through the wall

    const floor = halfHeight();
    if (p.y > floor) return;
    p.y = floor;
    const impact = -vel.y;
    if (impact > 14) {                              // bounce, losing energy
      vel.y = impact * 0.32;
      vel.x *= 0.6;
      vel.z *= 0.6;
      spin.x *= 0.45;
      spin.z *= 0.45;
      landListeners.forEach(fn => fn(impact));
    } else {                                        // resting: slide to a stop and lie flat
      vel.y = 0;
      const k = Math.exp(-9 * dt);
      vel.x *= k;
      vel.z *= k;
      spin.x = spin.z = 0;
      const ease = 1 - Math.exp(-10 * dt);
      r.x -= r.x * ease;
      r.z -= r.z * ease;
    }
  }

  function followHand(dt) {
    const p = wallPlug.position, r = wallPlug.rotation;
    const k = 1 - Math.exp(-28 * dt);
    p.x += (SOCKET.x - p.x) * k;
    p.y += (SOCKET.y - p.y) * k;
    p.z += (SOCKET.z + pull - p.z) * k;
    r.x -= r.x * k;
    r.z -= r.z * k;
  }

  function apply(dt) {
    if (mode === 'fallen') {
      simulateFall(dt);
    } else if (mode === 'held') {
      followHand(dt);
    } else {                                        // seated: ease back into the socket if it was let go close by
      if (pull !== 0) {
        pull *= Math.exp(-20 * dt);
        if (pull < 0.02) pull = 0;
      }
      wallPlug.position.set(SOCKET.x, SOCKET.y, SOCKET.z + pull);
      wallPlug.rotation.set(0, 0, 0);
    }
    setPlugged(mode !== 'fallen' && pull < UNPLUG_AT);

    const p = wallPlug.position, r = wallPlug.rotation;
    const sig = p.x + p.y * 3 + p.z * 7 + r.x * 11 + r.z * 13;
    if (Math.abs(sig - lastSig) > 0.001 || lastSig !== lastSig) {
      lastSig = sig;
      rebuildCord();
    }
  }
  apply(0);

  // ---- public API ----
  C.parts.power = {
    plug,
    wallPlug,
    hit,
    isPlugged: () => plugged,
    getPull: () => pull,
    // Register fn(plugged) to be called whenever the printer loses or regains power.
    onChange: fn => changeListeners.push(fn),
    // Register fn(impactSpeed) to be called whenever the dropped plug hits the floor.
    onLand: fn => landListeners.push(fn),
    // While held, the plug follows the pointer (0 = in the socket). Grabbing a dropped plug picks it back up.
    setPull(v) {
      mode = 'held';
      pull = Math.max(0, Math.min(PULL_MAX, v));
    },
    // Let go: close to the socket it snaps back in; further out it drops to the floor.
    release() {
      if (mode !== 'held') return;
      if (pull < SNAP_BACK) {
        mode = 'socket';
        return;
      }
      mode = 'fallen';
      pull = PULL_MAX * 0.6;                        // where a re-grab will start from
      vel.set((Math.random() - 0.5) * 16, 0, 14);
      spin.x = (Math.random() - 0.5) * 9;
      spin.z = (Math.random() - 0.5) * 7;
    },
    // Call every frame with the elapsed seconds.
    update: apply
  };
})(window.Cetak);
