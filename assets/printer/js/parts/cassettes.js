// Paper cassettes. A4 and A3 are always visible; A2 and A1 ("extras") sit under them and
// are toggled by the Cassettes button, which lifts the whole `stack` by SHIFT to make room.
// A4 is a sliding drawer holding A4 paper; clicking it toggles it open (see ui/picking.js).
// setPaperCount(n) shows n sheets (0..MAX_PAPER), removing them one by one when lowered.
// Exposes: Cetak.parts.cassettes = { extras, SHIFT, drawer, toggleTray, setPaperCount, MAX_PAPER, update }
(function (C) {
  const { S, D, ZF, Y } = C.config;
  const { rect, slab, label, shadow } = C.helpers;
  const { stack, printer } = C.scene;
  const { door, seam, handle, handleIn, black, black2, grey, paper } = C.mat;

  const LABEL_COLOR = '#7b8088';

  // Fixed cassette front, drawn straight onto the body.
  // `parent` lets A4 build the same front inside its sliding drawer.
  function cassette(y0, y1, name, solid, parent) {
    if (solid) rect(366.4, y0, 633.6, y1, ZF, D - 0.4, door);
    rect(366.3, y0 - 1, 633.7, y0 + 1, ZF + 0.15, 1, seam, parent);
    const cy = (y0 + y1) / 2;
    slab(473, cy - 9, 527, cy + 9, ZF + 0.5, 0.5, handle, [2.2, 2.2, 2.2, 2.2], parent);
    slab(476, cy - 6, 524, cy + 6, ZF + 0.7, 0.3, handleIn, [1.6, 1.6, 1.6, 1.6], parent);
    label(name, 395, cy, 2.4, 1.6, ZF + 0.2, LABEL_COLOR, 'normal', parent);
  }
  cassette(465, 525, 'A3', true);

  // ---- A4: a drawer that slides out toward the viewer, with a tray of A4 paper inside ----
  const TRAY_OPEN_DISTANCE = 46;                       // how far the drawer slides out (world units)
  const TRAY_SLIDE_SPEED = 8;                          // higher = snappier
  const SHEETS = 20;                                   // sheets in a full stack
  const SHEET_REMOVE_EVERY = 0.12;                     // seconds between sheets disappearing / reappearing

  // Tray geometry, all in world units. The drawer front is 2.5 thick; the tray sits behind it.
  const FRONT_T = 2.5;
  const TRAY = { w: 62, d: 56, wallH: 8.5, wallT: 0.6 };
  const trayFloorY = Y(465) + 1.2;                     // just above the bottom of the A4 opening
  const trayBackZ = ZF - FRONT_T - TRAY.d;
  const trayCenterZ = ZF - FRONT_T - TRAY.d / 2;

  // A4 (210 x 297 mm) is fed long edge across, so it fills the tray's width and is 210 mm deep.
  const PAPER_W = 58, PAPER_D = PAPER_W * 210 / 297, SHEET_H = 0.2, SHEET_PITCH = 0.22;
  const GUIDE_H = 4.6, GUIDE_T = 1.2;
  const paperBackZ = trayBackZ + TRAY.wallT + 0.2;     // stack sits in the back corner of the tray
  const paperCenterZ = paperBackZ + PAPER_D / 2;
  const paperFrontZ = paperBackZ + PAPER_D;

  const green = new THREE.MeshStandardMaterial({ color: 0x2fb24a, roughness: 0.5 });
  const labelMat = new THREE.MeshStandardMaterial({ color: 0xdfe2e6, roughness: 0.8 });

  const drawer = new THREE.Group();
  stack.add(drawer);

  // The body at A4 height stays door-coloured (it is also the printer's side wall). The dark cavity is a thin
  // panel on the front, shown only while the drawer is out: closed, it sits almost flush behind the drawer front
  // and would z-fight through it.
  rect(366.4, 415, 633.6, 465, ZF, D - 0.4, door);
  const cavity = rect(372, 418, 628, 463, ZF + 0.03, 0.03, black2);
  cavity.visible = false;
  cassette(415, 465, 'A4', false, drawer);
  // Narrower than the body so their side faces never share a plane (that caused z-fighting).
  rect(367.4, 415.5, 632.6, 464.5, ZF + 0.1, FRONT_T, door, drawer);

  // Box inside the drawer (black plastic by default; only paper, label and levers are bright).
  function trayPiece(w, h, d, x, y, z, mat) {
    const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || black));
    m.position.set(x, y, z);
    drawer.add(m);
    return m;
  }

  // Tray: floor, back wall, two side walls.
  const wallY = trayFloorY + TRAY.wallH / 2;
  trayPiece(TRAY.w, TRAY.wallT, TRAY.d, 0, trayFloorY, trayCenterZ);
  trayPiece(TRAY.w, TRAY.wallH, TRAY.wallT, 0, wallY, trayBackZ);
  [-1, 1].forEach(s => trayPiece(TRAY.wallT, TRAY.wallH, TRAY.d, s * TRAY.w / 2, wallY, trayCenterZ));

  // The stack. Each sheet is its own mesh so the debug paper count can hide them one by one; a tiny size and
  // rotation jitter keeps the stack edge from looking machine-perfect. Thin sheets don't need to cast shadows.
  const sheets = [];
  for (let i = 0; i < SHEETS; i++) {
    const w = PAPER_W - ((i * 37) % 5) * 0.08;
    const d = PAPER_D - ((i * 53) % 4) * 0.1;
    const sheet = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, SHEET_H, d), paper));
    sheet.castShadow = false;
    sheet.position.set(0, trayFloorY + 0.3 + SHEET_H / 2 + i * SHEET_PITCH, paperCenterZ);
    sheet.rotation.y = ((i * 29) % 9 - 4) * 0.0025;
    drawer.add(sheet);
    sheets.push(sheet);
  }

  // Paper guides: two at the sides of the stack, one against its front edge, with green levers on top.
  const guideY = trayFloorY + GUIDE_H / 2;
  const leverY = trayFloorY + GUIDE_H + 0.45;
  [-1, 1].forEach(s => trayPiece(GUIDE_T, GUIDE_H, PAPER_D, s * (PAPER_W / 2 + GUIDE_T / 2 + 0.2), guideY, paperCenterZ));
  trayPiece(TRAY.w - 1.2, GUIDE_H, GUIDE_T, 0, guideY, paperFrontZ + GUIDE_T / 2 + 0.2);
  [-1, 1].forEach(s => trayPiece(3, 0.9, 2.4, s * 20, leverY, paperFrontZ + 0.8, green));
  trayPiece(2.4, 0.9, 3, -(PAPER_W / 2 + 0.8), leverY, paperBackZ + 6, green);

  // Instruction plate on the tray floor in front of the paper, with a few little symbols.
  const frontSpace = (ZF - FRONT_T) - (paperFrontZ + GUIDE_T + 0.4);
  const plateZ = ZF - FRONT_T - frontSpace / 2;
  trayPiece(40, 0.3, Math.min(6.5, frontSpace - 1), -4, trayFloorY + 0.45, plateZ, labelMat);
  [-18, -11, -4, 3].forEach((x, i) => trayPiece(4.6, 0.1, 3.4, x, trayFloorY + 0.65, plateZ, i === 0 ? green : seam));

  let trayTarget = 0;
  function toggleTray() {
    trayTarget = trayTarget ? 0 : TRAY_OPEN_DISTANCE;
    return trayTarget > 0;
  }

  // Paper count: sheets are shown/hidden one at a time (from the top of the stack) until `shown` reaches the target.
  let paperTarget = SHEETS;
  let shown = SHEETS;
  let paperTimer = 0;
  function setPaperCount(n) {
    paperTarget = Math.max(0, Math.min(SHEETS, Math.round(n) || 0));
  }

  function update(dt) {
    drawer.position.z += (trayTarget - drawer.position.z) * Math.min(1, dt * TRAY_SLIDE_SPEED);
    cavity.visible = drawer.position.z > 1;

    if (shown === paperTarget) { paperTimer = 0; return; }
    paperTimer += dt;
    while (paperTimer >= SHEET_REMOVE_EVERY && shown !== paperTarget) {
      paperTimer -= SHEET_REMOVE_EVERY;
      shown += shown < paperTarget ? 1 : -1;
    }
    sheets.forEach((s, i) => { s.visible = i < shown; });
  }

  // Extra cassettes live on `printer` (not `stack`) so they stay put when the stack lifts.
  const extras = new THREE.Group();
  extras.visible = false;
  printer.add(extras);

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
  extraCassette(baseY, 'A1');
  extraCassette(baseY + drawerH, 'A2');

  C.parts.cassettes = { extras, SHIFT: 2 * drawerH, drawer, toggleTray, setPaperCount, MAX_PAPER: SHEETS, update };
})(window.Cetak);
