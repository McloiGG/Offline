// Output tray: the shelf inside the black cavity that printed pages land on.
(function (C) {
  const { S, ZF, X, Y } = C.config;
  const { shadow } = C.helpers;
  const { stack } = C.scene;
  const { dark } = C.mat;

  const tray = new THREE.Group();
  tray.position.set(X(446), Y(180), ZF - 3);
  tray.rotation.x = -0.06;
  stack.add(tray);

  // Deep enough for a whole A4 page (28 long) to rest on it, front edge ~10 past the printer front.
  const SHELF_D = 32;
  const shelf = shadow(new THREE.Mesh(new THREE.BoxGeometry(160 * S, 1.6, SHELF_D), dark));
  shelf.position.set(0, 0, 7 - SHELF_D / 2);
  tray.add(shelf);
})(window.Cetak);
