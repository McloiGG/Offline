// Printing animation. The top sheet of the document feeder is slowly sucked into the machine, then a printed A4 page
// slides out of the slot under the blue stripe and drops onto the output tray. A small pool of pages is recycled:
// each stays on the tray until its pool slot is reused.
// Exposes: Cetak.anim.printing = { start(), stop(), isOn(), update(dt) }
(function (C) {
  const { ZF, X, Y, PRINT } = C.config;
  const { shadow, canvasTex } = C.helpers;
  const { stack } = C.scene;
  const { paper } = C.mat;

  const SLOT_Y = Y(146);                         // slot height (just under the stripe)
  const TRAY_Y = Y(180) + 2.4;                   // resting height on the tray
  const SHEET_X = X(446);
  const STACK_STEP = 0.32;                       // vertical gap between stacked sheets
  const A4_W = 20, A4_L = A4_W * 297 / 210;      // printed page: A4 proportions (width across x, length along z)
  const START_Z = ZF - A4_L / 2 - 1;             // page centre when hidden inside the machine
  const OUT_Z = ZF + 10 - A4_L / 2;              // page centre when fully out (front edge ~10 past the front)
  const FEED_FROM_X = -2, FEED_FROM_Z = 4;       // the feeder sheet starts where the top of the ADF stack is

  const easeOut = t => 1 - (1 - t) * (1 - t);
  const easeIn = t => t * t;
  const easeInOut = t => t * t * (3 - 2 * t);

  // A printed A4 page: heading, paragraphs and a photo block with CMYK swatches. Portrait, so the top of the
  // page faces the back of the printer and reads upright from the front.
  const printedTex = canvasTex(420, 594, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2b2f36';
    g.fillRect(36, 40, 190, 22);
    g.fillStyle = '#c9ced6';
    for (let block = 0; block < 2; block++) {
      for (let i = 0; i < 6; i++) {
        const y = 92 + block * 250 + i * 18;
        g.fillRect(36, y, i === 5 ? 150 : w - 72, 7);
      }
    }
    g.fillStyle = '#e9edf2';
    g.fillRect(36, 205, w - 72, 110);
    [['#00a0e9', 36], ['#e4007f', 126], ['#ffd400', 216], ['#222', 306]].forEach(([color, x]) => {
      g.fillStyle = color;
      g.fillRect(x + 6, 225, 72, 70);
    });
  });
  const printedMat = new THREE.MeshStandardMaterial({ map: printedTex, roughness: 0.9 });
  // BoxGeometry has 6 faces; index 2 is the top, so only the top shows the print.
  const pageMaterials = [paper, paper, printedMat, paper, paper, paper];
  const pageGeometry = new THREE.BoxGeometry(A4_W, 0.3, A4_L);

  const pages = [];
  for (let i = 0; i < PRINT.pool; i++) {
    const page = shadow(new THREE.Mesh(pageGeometry, pageMaterials));
    page.visible = false;
    page.userData = { active: false, t: 0, rot: 0, slot: i };
    stack.add(page);
    pages.push(page);
  }

  // The sheet that gets pulled off the top of the feeder stack (same size and spot as the stack in scanner.js).
  const { adf, stackTop } = C.parts.scanner;
  const feeder = shadow(new THREE.Mesh(new THREE.BoxGeometry(29, 0.15, 36), paper));
  feeder.visible = false;
  adf.add(feeder);

  let on = false;
  let spawned = 0;
  let untilNext = 0;

  function spawn() {
    const page = pages[spawned++ % PRINT.pool];
    const u = page.userData;
    u.active = true;
    u.t = 0;
    u.rot = (Math.random() - 0.5) * 0.12;
    page.rotation.y = 0;
    page.visible = false;                          // appears once the feeder sheet is inside
  }

  // Phase 0: the top feeder sheet is drawn slowly sideways (towards the slot, -x) into the machine and shrinks out of sight.
  function feed(t) {
    const k = easeInOut(t / PRINT.feed);
    feeder.position.set(FEED_FROM_X - PRINT.feedDist * k, stackTop + 0.08, FEED_FROM_Z);
    feeder.scale.x = 1 - 0.7 * k;
  }

  // Returns true while the page is in the feeding phase (the feeder sheet is shown).
  function advance(page, dt) {
    const u = page.userData;
    u.t += dt;

    if (u.t < PRINT.feed) {                        // 0. feeder sheet sucked in
      feed(u.t);
      return true;
    }
    page.visible = true;
    const t = u.t - PRINT.feed;
    const restY = TRAY_Y + u.slot * STACK_STEP;

    if (t < PRINT.slide) {                         // 1. slide out of the slot
      const k = easeOut(t / PRINT.slide);
      page.position.set(SHEET_X, SLOT_Y, START_Z + (OUT_Z - START_Z) * k);
    } else if (t < PRINT.slide + PRINT.drop) {     // 2. drop onto the tray
      const k = easeIn((t - PRINT.slide) / PRINT.drop);
      page.position.set(SHEET_X, SLOT_Y + (restY - SLOT_Y) * k, OUT_Z);
      page.rotation.y = u.rot * k;
    } else {                                       // 3. rest (idle until reused)
      page.position.set(SHEET_X, restY, OUT_Z);
      page.rotation.y = u.rot;
      u.active = false;
    }
    return false;
  }

  C.anim.printing = {
    isOn: () => on,
    start() { on = true; untilNext = 0; },
    stop() { on = false; },
    update(dt) {
      if (on) {
        untilNext -= dt;
        if (untilNext <= 0) {
          untilNext = PRINT.spawnEvery;
          spawn();
        }
      }
      let feeding = false;
      pages.forEach(page => { if (page.userData.active && advance(page, dt)) feeding = true; });
      feeder.visible = feeding;
    }
  };
})(window.Cetak);
