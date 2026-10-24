// Paper cassettes. C1 and C2 are always visible; C3 and C4 ("extras") sit under them and
// are toggled by the Cassettes button, which lifts the whole `stack` by SHIFT to make room.
// Exposes: Cetak.parts.cassettes = { extras, SHIFT }
(function (C) {
  const { S, D, ZF, Y } = C.config;
  const { rect, slab, label, shadow } = C.helpers;
  const { stack } = C.scene;
  const { door, seam, handle, handleIn } = C.mat;

  const LABEL_COLOR = '#7b8088';

  function cassette(y0, y1, name) {
    rect(366.4, y0, 633.6, y1, ZF, D - 0.4, door);
    rect(366.3, y0 - 1, 633.7, y0 + 1, ZF + 0.15, 1, seam);
    const cy = (y0 + y1) / 2;
    slab(473, cy - 9, 527, cy + 9, ZF + 0.5, 0.5, handle, [2.2, 2.2, 2.2, 2.2]);
    slab(476, cy - 6, 524, cy + 6, ZF + 0.7, 0.3, handleIn, [1.6, 1.6, 1.6, 1.6]);
    label(name, 395, cy, 2.4, 1.6, ZF + 0.2, LABEL_COLOR, 'normal');
  }
  cassette(415, 465, 'C1');
  cassette(465, 525, 'C2');

  // Extra cassettes live on `printer` (not `stack`) so they stay put when the stack lifts.
  const extras = new THREE.Group();
  extras.visible = false;
  C.scene.printer.add(extras);

  const drawerH = 50 * S;

  function extraCassette(yBottom, name) {
    const y = yBottom + drawerH / 2;

    const face = shadow(new THREE.Mesh(new THREE.BoxGeometry(268 * S - 0.2, drawerH, D - 0.4), door));
    face.position.set(0, y, 0);
    extras.add(face);

    const seamLine = shadow(new THREE.Mesh(new THREE.BoxGeometry(268 * S - 0.3, 0.5, D + 0.3), seam));
    seamLine.position.set(0, yBottom + drawerH, 0);
    extras.add(seamLine);

    const grip = shadow(new THREE.Mesh(new THREE.BoxGeometry(14.1, 4.6, 0.5), handle));
    grip.position.set(0, y, ZF + 0.25);
    extras.add(grip);

    const gripInner = shadow(new THREE.Mesh(new THREE.BoxGeometry(12.5, 3.2, 0.3), handleIn));
    gripInner.position.set(0, y, ZF + 0.5);
    extras.add(gripInner);

    label(name, 395, 0, 2.4, 1.6, ZF + 0.2, LABEL_COLOR, 'normal', extras).position.y = y;
  }

  const baseY = Y(525);
  extraCassette(baseY, 'C4');
  extraCassette(baseY + drawerH, 'C3');

  C.parts.cassettes = { extras, SHIFT: 2 * drawerH };
})(window.Cetak);
