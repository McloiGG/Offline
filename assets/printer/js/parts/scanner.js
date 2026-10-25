// Scanner hood on top, with the CETAK logo and the document feeder (ADF) tray.
(function (C) {
  const { ZF, X, Y } = C.config;
  const { rect, slab, label, shadow } = C.helpers;
  const { stack } = C.scene;
  const { white, seam, black, paper, grey } = C.mat;

  slab(368, 40, 480, 100, ZF - 1, 62, white, [6, 0, 0, 0]);     // left (tall) hood
  slab(480, 62, 632, 100, ZF - 1, 62, white, [0, 3, 0, 0]);     // right (low) lid
  rect(368.3, 99, 631.7, 101, ZF + 0.1, 1, seam);               // seam under the hood
  label('CETAK', 425, 73, 12, 3, ZF - 0.85, '#1a1d22', '900');

  rect(484, 64, 628, 80, ZF - 4, 50, black);                    // ADF base

  const adf = new THREE.Group();
  adf.position.set(X(556), Y(60), 0);
  adf.rotation.z = 0.1;
  stack.add(adf);

  const tray = shadow(new THREE.Mesh(new THREE.BoxGeometry(37, 1.2, 46), black));
  tray.position.set(0, 0, 2);
  adf.add(tray);

  const stackOfPaper = shadow(new THREE.Mesh(new THREE.BoxGeometry(29, 0.5, 36), paper));
  stackOfPaper.position.set(-2, 1, 4);
  adf.add(stackOfPaper);

  C.parts.scanner = { adf, stackTop: 1 + 0.25 };                // the printing animation feeds sheets in from here

  [-15, 15].forEach(x => {
    const guide = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 30), grey));
    guide.position.set(x, 1.3, 4);
    adf.add(guide);
  });
})(window.Cetak);
