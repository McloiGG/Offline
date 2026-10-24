// Ventilation grilles: right side (2 fans), left side (louvres only), back (2 fans).
// Exposes: Cetak.parts.vents = { fans, ventY } -- `fans` are blade groups the main loop spins.
(function (C) {
  const { Y } = C.config;
  const { shadow } = C.helpers;
  const { stack } = C.scene;
  const { seam, black2, dark, grey, white } = C.mat;

  const fans = [];

  // x/y/z = centre of the grille; ry = which way it faces; fanCount = 0, 1 or 2.
  function makeVent(x, y, z, ry, fanCount) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    stack.add(g);

    const W = 30, H = 22;

    const rim = shadow(new THREE.Mesh(new THREE.BoxGeometry(W + 2.4, H + 2.4, 0.5), seam));
    rim.position.z = 0.1;
    g.add(rim);

    const recess = shadow(new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.5), black2));
    recess.position.z = 0.4;
    g.add(recess);

    for (let i = 0; i < fanCount; i++) {
      const fanX = fanCount === 1 ? 0 : (i === 0 ? -7.6 : 7.6);
      const fan = new THREE.Group();
      fan.position.set(fanX, 0, 0.75);
      g.add(fan);

      fan.add(new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.35, 8, 40), dark));

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 20), grey);
      hub.rotation.x = Math.PI / 2;
      fan.add(hub);

      const blades = new THREE.Group();
      for (let b = 0; b < 7; b++) {
        const pivot = new THREE.Group();
        pivot.rotation.z = b * Math.PI * 2 / 7;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.6, 0.15), grey);
        blade.position.y = 4.2;
        blade.rotation.y = 0.5;
        pivot.add(blade);
        blades.add(pivot);
      }
      fan.add(blades);
      fans.push(blades);
    }

    // angled louvre slats in front of the fans
    const slats = 9;
    const span = H - 2.6;
    for (let i = 0; i < slats; i++) {
      const slat = shadow(new THREE.Mesh(new THREE.BoxGeometry(W - 1.4, 0.55, 1.7), white));
      slat.position.set(0, -span / 2 + i * span / (slats - 1), 1.35);
      slat.rotation.x = -0.55;
      g.add(slat);
    }
  }

  const ventY = Y(300);
  makeVent(35.05, ventY, -6, Math.PI / 2, 2);     // right
  makeVent(-35.05, ventY, -6, -Math.PI / 2, 0);   // left
  makeVent(0, ventY, -33.05, Math.PI, 2);         // back

  C.parts.vents = { fans, ventY };
})(window.Cetak);
