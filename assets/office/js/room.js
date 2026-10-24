// The room shell: carpet, three extra walls, ceiling with light panels, a wider shadow area for the sun,
// the Office camera preset, and a clamp that keeps the camera inside the room.
// (The back wall, skirting and socket already come from the printer's parts/power.js.)
(function (C) {
  const { ROOM, COLORS, OFFICE_VIEW, CAMERA_MARGIN } = C.office.config;
  const { scene, camera, controls } = C.scene;
  const { canvasTex } = C.helpers;
  const { std } = C.office.mat;

  const width = ROOM.xMax - ROOM.xMin;
  const depth = ROOM.zFront - ROOM.zBack;
  const midZ = (ROOM.zBack + ROOM.zFront) / 2;
  const TILE = 50;
  const hex = c => '#' + c.toString(16).padStart(6, '0');

  // ---- carpet tiles (a little below y=0 so it never fights the printer's shadow-catching floor) ----
  const carpetTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = hex(COLORS.carpetA);
    g.fillRect(0, 0, w, h);
    g.fillStyle = hex(COLORS.carpetB);
    g.fillRect(0, 0, w, 2);
    g.fillRect(0, 0, 2, h);
    for (let i = 0; i < 260; i++) g.fillRect((i * 53) % w, (i * 97) % h, 1, 1);
  });
  carpetTex.wrapS = carpetTex.wrapT = THREE.RepeatWrapping;
  carpetTex.repeat.set(width / TILE, depth / TILE);

  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 1 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, -0.4, midZ);
  carpet.receiveShadow = true;
  scene.add(carpet);

  // ---- walls: left, right and front (single-sided planes, visible from inside the room only) ----
  function wallWithSkirting(x, z, rotY, length) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, ROOM.wallH), std(COLORS.wall, 0.95));
    wall.position.set(x, ROOM.wallH / 2, z);
    wall.rotation.y = rotY;
    wall.receiveShadow = true;
    scene.add(wall);

    const skirting = new THREE.Mesh(new THREE.BoxGeometry(length, 7, 1.2), std(COLORS.skirting, 0.8));
    skirting.position.set(x, 3.5, z);
    skirting.rotation.y = rotY;
    // push the skirting 0.6 into the room along the wall's inward normal
    skirting.translateZ(0.6);
    scene.add(skirting);
  }
  wallWithSkirting(ROOM.xMin, midZ, Math.PI / 2, depth);          // left, faces +x
  wallWithSkirting(ROOM.xMax, midZ, -Math.PI / 2, depth);         // right, faces -x
  wallWithSkirting(0, ROOM.zFront, Math.PI, width);               // front, faces -z

  // ---- back wall: built by the printer's power.js in near-background grey; recolour it to match the room ----
  scene.traverse(o => {
    const p = o.geometry && o.geometry.parameters;
    if (o.isMesh && p && p.width === 2400 && p.height === 600) o.material.color.setHex(COLORS.wall);
  });

  // ---- ceiling (faces down) with a grid of fluorescent panels ----
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), std(COLORS.ceiling, 1));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.wallH, midZ);
  scene.add(ceiling);

  const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let x = ROOM.xMin + 140; x < ROOM.xMax; x += 280) {
    for (let z = ROOM.zBack + 100; z < ROOM.zFront; z += 220) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), panelMat);
      panel.rotation.x = Math.PI / 2;
      panel.position.set(x, ROOM.wallH - 0.5, z);
      scene.add(panel);
    }
  }

  // ---- sun: widen the shadow area from "just the printer" to most of the room ----
  // Must happen before the first render, because the shadow map is allocated lazily.
  scene.traverse(o => {
    if (!o.isDirectionalLight || !o.castShadow) return;
    o.shadow.mapSize.set(4096, 4096);
    Object.assign(o.shadow.camera, { left: -640, right: 640, top: 640, bottom: -640, near: 1, far: 1400 });
    o.shadow.camera.updateProjectionMatrix();
  });

  // ---- camera: far plane covers the whole room; register the Office preset ----
  camera.far = 2500;
  camera.updateProjectionMatrix();
  C.config.VIEWS.office = OFFICE_VIEW;

  // ---- keep the camera (and the point it orbits) inside the room ----
  // The orbit state is recomputed from camera.position every frame, so clamping here sticks:
  // the camera slides along a wall instead of passing through it.
  const m = CAMERA_MARGIN;
  const camMin = new THREE.Vector3(ROOM.xMin + m, m, ROOM.zBack + m);
  const camMax = new THREE.Vector3(ROOM.xMax - m, ROOM.wallH - m, ROOM.zFront - m);

  controls.addEventListener('change', () => {
    const before = camera.position.clone();
    controls.target.clamp(camMin, camMax);
    camera.position.clamp(camMin, camMax);
    if (!camera.position.equals(before)) camera.lookAt(controls.target);
  });
})(window.Cetak);
