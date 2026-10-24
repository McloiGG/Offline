// Paper cassettes. C1 and C2 are always visible; C3 and C4 ("extras") sit under them and
// are toggled by the Cassettes button, which lifts the whole `stack` by SHIFT to make room.
// C1 is a sliding drawer holding A4 paper; clicking it toggles it open (see ui/picking.js).
// setPaperCount(n) shows n sheets (0..MAX_PAPER), removing them one by one when lowered.
// Exposes: Cetak.parts.cassettes = { extras, SHIFT, drawer, toggleTray, setPaperCount, MAX_PAPER, update }
(function (C) {
  const { S, D, ZF, Y } = C.config;
  const { rect, slab, label, shadow } = C.helpers;
  const { stack } = C.scene;
  const { door, seam, handle, handleIn } = C.mat;

  const LABEL_COLOR = '#7b8088';

  // Fixed cassette front, drawn straight onto the body.
  // `parent` lets C1 build the same front inside its sliding drawer.
  function cassette(y0, y1, name, solid, parent) {
    if (solid) rect(366.4, y0, 633.6, y1, ZF, D - 0.4, door);
    rect(366.3, y0 - 1, 633.7, y0 + 1, ZF + 0.15, 1, seam, parent);
    const cy = (y0 + y1) / 2;
    slab(473, cy - 9, 527, cy + 9, ZF + 0.5, 0.5, handle, [2.2, 2.2, 2.2, 2.2], parent);
    slab(476, cy - 6, 524, cy + 6, ZF + 0.7, 0.3, handleIn, [1.6, 1.6, 1.6, 1.6], parent);
    label(name, 395, cy, 2.4, 1.6, ZF + 0.2, LABEL_COLOR, 'normal', parent);
  }
  cassette(465, 525, 'C2', true);

  // ---- C1: a drawer that slides out toward the viewer, with a tray of A4 paper inside ----
  const TRAY_OPEN_DISTANCE = 46;
  const TRAY_SLIDE_SPEED = 8;                          // higher = snappier

  const drawer = new THREE.Group();
  C.scene.stack.add(drawer);

  // The body at C1 height stays door-coloured (it is also the printer's side wall); only the front gets a
  // dark, slightly inset cavity, so the gap reads as an opening once the drawer slides out.
  rect(366.4, 415, 633.6, 465, ZF, D - 0.4, door);
  // Hidden while the drawer is closed: it sits almost flush behind the drawer front and would z-fight through it.
  const cavity = rect(372, 418, 628, 463, ZF + 0.03, 0.03, C.mat.black2);
  cavity.visible = false;
  cassette(415, 465, 'C1', false, drawer);
  // Narrower than the body so its side faces never share a plane with the body's (that caused z-fighting).
  rect(367.4, 415.5, 632.6, 464.5, ZF + 0.1, 2.5, door, drawer);

  const trayW = 62, trayD = 56, wallH = 8.5;
  const trayFloorY = Y(465) + 1.2;                                   // just above the bottom of the C1 opening
  const trayBackZ = ZF - 2.5 - trayD;
  const trayCenterZ = ZF - 2.5 - trayD / 2;

  // Everything inside the drawer is black plastic like the real tray; only the paper, label and levers are bright.
  const green = new THREE.MeshStandardMaterial({ color: 0x2fb24a, roughness: 0.5 });
  const labelMat = new THREE.MeshStandardMaterial({ color: 0xdfe2e6, roughness: 0.8 });

  function trayPiece(w, h, d, x, y, z, mat) {
    const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || C.mat.black));
    m.position.set(x, y, z);
    drawer.add(m);
    return m;
  }
  trayPiece(trayW, 0.6, trayD, 0, trayFloorY, trayCenterZ);                              // floor
  trayPiece(trayW, wallH, 0.6, 0, trayFloorY + wallH / 2, trayBackZ);                    // back wall
  [-1, 1].forEach(s => trayPiece(0.6, wallH, trayD, s * trayW / 2, trayFloorY + wallH / 2, trayCenterZ));   // side walls

  // A4 (210 x 297 mm) is fed long edge across, so it fills the tray's width (x = 297 mm) and is 210 mm deep.
  // The stack is pushed into the back corner of the tray and held by guides on the back, sides and front.
  const PAPER_W = 58, PAPER_D = PAPER_W * 210 / 297, SHEET_H = 0.2, SHEET_PITCH = 0.22, SHEETS = 20;
  const SHEET_REMOVE_EVERY = 0.12;                       // seconds between sheets disappearing / reappearing
  const sheets = [];
  const GUIDE_H = 4.6, GUIDE_T = 1.2;
  const paperBackZ = trayBackZ + 0.3 + 0.2;
  const paperCenterZ = paperBackZ + PAPER_D / 2;
  const paperFrontZ = paperBackZ + PAPER_D;

  for (let i = 0; i < SHEETS; i++) {
    const sheet = shadow(new THREE.Mesh(new THREE.BoxGeometry(PAPER_W - ((i * 37) % 5) * 0.08, SHEET_H, PAPER_D - ((i * 53) % 4) * 0.1), C.mat.paper));
    sheet.position.set(0, trayFloorY + 0.3 + SHEET_H / 2 + i * SHEET_PITCH, paperCenterZ);
    sheet.rotation.y = ((i * 29) % 9 - 4) * 0.0025;
    drawer.add(sheet);
    sheets.push(sheet);
  }

  // Side guides hugging the paper, and the front guide sliding up against its front edge.
  [-1, 1].forEach(s => trayPiece(GUIDE_T, GUIDE_H, PAPER_D, s * (PAPER_W / 2 + GUIDE_T / 2 + 0.2), trayFloorY + GUIDE_H / 2, paperCenterZ));
  trayPiece(trayW - 1.2, GUIDE_H, GUIDE_T, 0, trayFloorY + GUIDE_H / 2, paperFrontZ + GUIDE_T / 2 + 0.2);
  [-1, 1].forEach(s => trayPiece(3, 0.9, 2.4, s * 20, trayFloorY + GUIDE_H + 0.45, paperFrontZ + 0.8, green));   // front guide levers
  trayPiece(2.4, 0.9, 3, -(PAPER_W / 2 + 0.8), trayFloorY + GUIDE_H + 0.45, paperBackZ + 6, green);             // side guide lever

  // Label strip on the tray floor in front of the paper, like the instruction plate in the real tray.
  const frontSpace = (ZF - 2.5) - (paperFrontZ + GUIDE_T + 0.4);
  trayPiece(40, 0.3, Math.min(6.5, frontSpace - 1), -4, trayFloorY + 0.45, ZF - 2.5 - frontSpace / 2, labelMat);
  [-14, -7, 0, 7].forEach(x =>
    trayPiece(4.6, 0.1, 3.4, x - 4, trayFloorY + 0.65, ZF - 2.5 - frontSpace / 2, x === -14 ? green : C.mat.seam));

  let trayTarget = 0;
  function toggleTray() {
    trayTarget = trayTarget ? 0 : TRAY_OPEN_DISTANCE;
    return trayTarget > 0;
  }

  // Paper count: sheets are removed from the top of the stack one at a time until `paperTarget` is reached.
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
      sheets.forEach((s, i) => { s.visible = i < shown; });
    }
  }

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

  C.parts.cassettes = { extras, SHIFT: 2 * drawerH, drawer, toggleTray, setPaperCount, MAX_PAPER: SHEETS, update };
})(window.Cetak);
