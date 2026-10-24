// Ink display on door A: four ink cartridges (BK, Y, M, C), each in its own transparent container with a cap, behind a glass cover.
// Clicking the blue logo (State 2) pulls a black tray holding the cartridges out toward the viewer (the front stays open
// so they are visible); the glass cover slides out of the way and refill bottles appear above the caps. Each cap can then
// be clicked to flip open and show the filling hole.
// Exposes: Cetak.parts.inkPanel = { names, hit, capHits, setLevel, setPower, setWarning, toggleOut(), isOut(), toggleCap(i), slide(dt), update(t) }
// Z layering (front-most last) is deliberate -- keep the gaps or the tanks will flicker:
//   panel +1.6 < holder +1.75 < cartridge shell +2.4 (fill front +2.25 inside it) < blackout +2.55 < glass +2.7
(function (C) {
  const { S, ZF, X, Y, COLORS } = C.config;
  const { rect, slab, label, canvasTex, shadow } = C.helpers;
  const { stack } = C.scene;
  const { black, black2, glass } = C.mat;

  // ---- layout (photo pixels) ----
  const PANEL = [372, 268, 478, 312];
  const TANK_TOP = 279, TANK_BOTTOM = 303;
  const TRAY_X0 = 378, TRAY_X1 = 455;
  const LOGO_PX = { x: 467, y: 294 };   // logo and "Push" are centred as a group in the space right of the tray

  // ---- sizes and motion (world units) ----
  const FRONT_Z = ZF + 2.4;                  // front face of the cartridges
  const DEPTH = 7;                           // how deep each cartridge is
  const TRAY_WALL = 0.7, TRAY_OVERHANG = 0.6, TRAY_DROP = 0.2;
  const PULL_OUT = 9, SLIDE_SPEED = 6;       // how far the tray comes out and how fast it eases there
  const CAP_RADIUS = 0.8, CAP_SPEED = 9;
  const CAP_OPEN_ANGLE = Math.PI / 2;        // any further and the open cap dips into the cartridge
  const BOTTLE_R = 1.2, BOTTLE_LIFT = 9.1;   // bottle width, and how far above the cartridge top its pivot sits
  const MIN_LEVEL = 0.04;                    // an "empty" tank still shows a sliver of ink
  const LOGO_OK = 0x7fd3ff, LOGO_WARN = 0xff3b30, LOGO_DIM = 0x4a1410;

  // Black ink uses a lighter grey so it stays visible against the dark panel. w is the cartridge width in photo pixels.
  const INKS = [
    { cx: 392, name: 'BK', color: 0x55575c,       level: 0.85, w: 26, capColor: 0x2a2b2e },
    { cx: 413, name: 'Y',  color: COLORS.yellow,  level: 0.70, w: 14 },
    { cx: 429, name: 'M',  color: COLORS.magenta, level: 0.55, w: 14 },
    { cx: 445, name: 'C',  color: COLORS.cyan,    level: 0.90, w: 14 }
  ];

  const bottomY = Y(TANK_BOTTOM);
  const tankH = (TANK_BOTTOM - TANK_TOP) * S;
  const topY = bottomY + tankH + 0.8;        // top face of every cartridge
  const capZ = FRONT_Z - CAP_RADIUS - 0.8;   // caps sit centred across the cartridge, towards its front
  const centreZ = FRONT_Z - DEPTH / 2;

  // ---- shared geometry and materials ----
  const cyl = (rTop, rBottom, height) => new THREE.CylinderGeometry(rTop, rBottom, height, 20);
  const geo = {
    hole: new THREE.CircleGeometry(CAP_RADIUS * 0.8, 24),
    cap: new THREE.CylinderGeometry(CAP_RADIUS, CAP_RADIUS, 1.1, 24),
    nozzle: cyl(0.3, 0.07, 1.2),
    neck: cyl(0.55, 0.55, 0.7),
    shoulder: cyl(BOTTLE_R, 0.55, 1.0),
    body: cyl(BOTTLE_R, BOTTLE_R, 3.2),
    label: cyl(BOTTLE_R + 0.03, BOTTLE_R + 0.03, 1.3)
  };
  const mats = {
    hole: new THREE.MeshBasicMaterial({ color: 0x050506 }),
    neck: new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.6 }),
    label: new THREE.MeshStandardMaterial({ color: 0xf1f2f4, roughness: 0.7 }),
    shell: new THREE.MeshStandardMaterial({ color: 0xdfe8f0, roughness: 0.1, transparent: true, opacity: 0.28, depthWrite: false })
  };

  slab(...PANEL, ZF + 1.6, 1.6, black, [2.4, 2.4, 2.4, 2.4]);

  // Everything that slides out (tray, cartridges, caps, bottles).
  const cartridges = new THREE.Group();
  stack.add(cartridges);

  // The black tray the cartridges sit in: bottom, sides and back, open at the front and top.
  (function buildTray() {
    const d = DEPTH + TRAY_OVERHANG;
    const h = tankH + 1.6;
    const y0 = bottomY - TRAY_DROP;
    const z = FRONT_Z + 0.1 - d / 2;
    const w = (TRAY_X1 - TRAY_X0) * S;
    const midX = X((TRAY_X0 + TRAY_X1) / 2);
    [
      [w, TRAY_WALL, d, midX, y0, z],                                                   // bottom
      [TRAY_WALL, h, d, X(TRAY_X0) + TRAY_WALL / 2, y0 + h / 2, z],                     // left
      [TRAY_WALL, h, d, X(TRAY_X1) - TRAY_WALL / 2, y0 + h / 2, z],                     // right
      [w, h, TRAY_WALL, midX, y0 + h / 2, FRONT_Z + 0.1 - d + TRAY_WALL / 2]            // back
    ].forEach(([bw, bh, bd, x, y, zz]) => {
      const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), black));
      m.position.set(x, y, zz);
      cartridges.add(m);
    });
  })();

  const fills = [];
  const caps = [];       // { lid, open, target } per cartridge
  const bottles = [];    // refill bottles, visible only while the tray is out
  const capHits = [];    // clickable meshes: each cap and the hole under it

  // Round cap hinged at its back edge (opening flips it up and back), over a black hole.
  function buildCap(ink, index) {
    const zone = { view: 's2', capIndex: index };

    const hole = new THREE.Mesh(geo.hole, mats.hole);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(X(ink.cx), topY + 0.02, capZ);
    hole.userData = zone;
    cartridges.add(hole);

    const lid = new THREE.Group();
    lid.position.set(X(ink.cx), topY + 0.05, capZ - CAP_RADIUS);   // a hair above the cartridge so the open cap clears it
    cartridges.add(lid);

    const cap = shadow(new THREE.Mesh(geo.cap, new THREE.MeshStandardMaterial({ color: ink.capColor || ink.color, roughness: 0.45 })));
    cap.position.set(0, 0.55, CAP_RADIUS);
    cap.userData = zone;
    lid.add(cap);

    caps.push({ lid, open: 0, target: 0 });
    capHits.push(cap, hole);
  }

  // Refill bottle, built upright then flipped upside down so the nozzle points at the cap.
  function buildBottle(ink) {
    const bottle = new THREE.Group();
    bottle.position.set(X(ink.cx), topY + BOTTLE_LIFT, centreZ);
    bottle.rotation.x = Math.PI;
    bottle.visible = false;
    cartridges.add(bottle);

    const bodyMat = new THREE.MeshStandardMaterial({ color: ink.capColor || ink.color, roughness: 0.3, metalness: 0.1 });
    [
      [geo.nozzle, black2, 0.6],
      [geo.neck, mats.neck, 1.55],
      [geo.shoulder, bodyMat, 2.4],
      [geo.body, bodyMat, 4.5],
      [geo.label, mats.label, 4.9]
    ].forEach(([g, m, y]) => {
      const part = shadow(new THREE.Mesh(g, m));
      part.position.y = y;
      bottle.add(part);
    });
    bottles.push(bottle);
  }

  INKS.forEach((ink, i) => {
    const h = tankH;

    rect(ink.cx - ink.w / 2 - 2, TANK_TOP - 5, ink.cx + ink.w / 2 + 2, 308, ZF + 1.75, 0.3, black2);   // bay holder (stays behind)

    const shell = new THREE.Mesh(new THREE.BoxGeometry(ink.w * S, h + 1.2, DEPTH), mats.shell);
    shell.position.set(X(ink.cx), bottomY + h / 2 + 0.2, centreZ);
    cartridges.add(shell);

    const fill = shadow(new THREE.Mesh(
      new THREE.BoxGeometry((ink.w - 2) * S, h, DEPTH - 1.2),
      new THREE.MeshStandardMaterial({
        color: ink.color, roughness: 0.3,
        emissive: ink.color, emissiveIntensity: ink.name === 'BK' ? 0 : 0.25
      })
    ));
    fill.position.set(X(ink.cx), 0, ZF + 2.25 - (DEPTH - 1.2) / 2);
    fill.userData.height = h;
    cartridges.add(fill);
    fills.push(fill);

    buildCap(ink, i);
    buildBottle(ink);
    label(ink.name, ink.cx, TANK_BOTTOM - 4, 2.2, 1.3, ZF + 2.5, '#ffffff', 'bold', cartridges);   // near the bottom of the cartridge front
  });

  // Small diamond logo on the right of the panel. The texture is white and tinted by the material colour,
  // so it can turn red while there is a warning.
  const logoTex = canvasTex(256, 256, (g, w, h) => {
    g.strokeStyle = '#ffffff';
    g.lineWidth = 12;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(w / 2, 30);
    g.lineTo(w - 40, h / 2);
    g.lineTo(w / 2, h - 30);
    g.lineTo(40, h / 2);
    g.closePath();
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(w / 2, h / 2, 26, 0, 7);
    g.fill();
  });
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, color: LOGO_OK })
  );
  logo.position.set(X(LOGO_PX.x), Y(LOGO_PX.y), ZF + 1.75);
  stack.add(logo);

  // "Push" hint above the logo, tinted together with it.
  const pushLabel = label('Push', LOGO_PX.x, LOGO_PX.y - 10, 3.2, 1.0, ZF + 1.75, '#ffffff', 'bold');
  const setLogoColor = hex => { logo.material.color.setHex(hex); pushLabel.material.color.setHex(hex); };
  setLogoColor(LOGO_OK);

  // Invisible box over the logo: the button that pulls the cartridges out / pushes them back in.
  const hit = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(X(LOGO_PX.x), Y(LOGO_PX.y), ZF + 2.2);
  hit.userData = { view: 's2', isInk: true };
  stack.add(hit);

  // Switched off (printer unplugged): a black sheet hides the tanks and logo behind the glass.
  const blackout = rect(...PANEL, ZF + 2.55, 0.05, new THREE.MeshBasicMaterial({ color: 0x050506 }));
  blackout.visible = false;

  const cover = rect(...PANEL, ZF + 2.7, 0.1, glass);   // transparent cover (hidden while the tray is out)

  function setLevel(i, level) {
    const l = Math.max(MIN_LEVEL, Math.min(1, level));
    const fill = fills[i];
    fill.scale.y = l;
    fill.position.y = bottomY + fill.userData.height * l / 2;
  }
  INKS.forEach((ink, i) => setLevel(i, ink.level));

  let out = 0, outTarget = 0;   // 0 = in, 1 = fully out
  let capsMoving = false;
  let warning = false;

  function slideTray(dt) {
    out += (outTarget - out) * Math.min(1, dt * SLIDE_SPEED);
    if (Math.abs(outTarget - out) < 0.002) out = outTarget;
    cartridges.position.z = out * PULL_OUT;
    cover.visible = out < 0.05;
    const showBottles = out > 0.05;
    const scale = Math.max(0.01, out);   // the bottles grow in as the tray comes out
    bottles.forEach(b => {
      b.visible = showBottles;
      b.scale.setScalar(scale);
    });
  }

  function slideCaps(dt) {
    capsMoving = false;
    caps.forEach(c => {
      if (c.open === c.target) return;
      c.open += (c.target - c.open) * Math.min(1, dt * CAP_SPEED);
      if (Math.abs(c.target - c.open) < 0.005) c.open = c.target;
      else capsMoving = true;
      c.lid.rotation.x = -c.open * CAP_OPEN_ANGLE;
    });
  }

  C.parts.inkPanel = {
    names: INKS.map(ink => ink.name),
    hit,
    capHits,
    toggleOut() {
      outTarget = outTarget ? 0 : 1;
      if (!outTarget) {                // pushing the tray in closes every cap
        caps.forEach(c => { c.target = 0; });
        capsMoving = true;
      }
      return !!outTarget;
    },
    isOut: () => outTarget === 1,
    // Open / close the cap of cartridge i (only while the tray is out); returns whether it is now open.
    toggleCap(i) {
      if (outTarget !== 1) return false;
      caps[i].target = caps[i].target ? 0 : 1;
      capsMoving = true;
      return !!caps[i].target;
    },
    slide(dt) {
      if (out !== outTarget) slideTray(dt);
      if (capsMoving) slideCaps(dt);
    },
    setLevel,
    setPower(on) { blackout.visible = !on; },
    // While a warning is active the logo blinks red; call update(time) every frame.
    setWarning(on) { warning = on; if (!on) setLogoColor(LOGO_OK); },
    update(t) { if (warning) setLogoColor(Math.floor(t * 3) % 2 ? LOGO_WARN : LOGO_DIM); }
  };
})(window.Cetak);
