// Output tray (the shelf inside the black cavity) with three sheets already resting on it.
// Exposes: Cetak.parts.outputTray = { x, y } -- where new printed sheets should land.
(function (C) {
  const { S, ZF, X, Y, COLORS } = C.config;
  const { shadow } = C.helpers;
  const { stack } = C.scene;
  const { dark, paper } = C.mat;

  const x = X(446);
  const y = Y(180);

  const tray = new THREE.Group();
  tray.position.set(x, y, ZF - 3);
  tray.rotation.x = -0.06;
  stack.add(tray);

  const shelf = shadow(new THREE.Mesh(new THREE.BoxGeometry(160 * S, 1.6, 14), dark));
  shelf.position.set(0, 0, 4);
  tray.add(shelf);

  [0, 1, 2].forEach(i => {
    const sheet = shadow(new THREE.Mesh(new THREE.BoxGeometry(28, 0.3, 16), paper));
    sheet.position.set(-2 + i * 0.6, 1.0 + i * 0.32, 2 + i * 0.3);
    sheet.rotation.y = (i - 1) * 0.05;
    tray.add(sheet);
  });

  // CMYK colour bars printed on the top sheet.
  [COLORS.cyan, COLORS.magenta, COLORS.yellow, COLORS.black].forEach((color, i) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.1, 2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    bar.position.set(-10 + i * 5, 2.05, 6);
    tray.add(bar);
  });

  C.parts.outputTray = { x, y };
})(window.Cetak);
