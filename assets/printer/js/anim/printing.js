// Printing animation. A small pool of sheets is recycled: each one slides out of the slot under
// the blue stripe, drops onto the output tray, and stays there until its pool slot is reused.
// Exposes: Cetak.anim.printing = { start(), stop(), isOn(), update(dt) }
(function (C) {
  const { ZF, X, Y, PRINT } = C.config;
  const { shadow, canvasTex } = C.helpers;
  const { stack } = C.scene;
  const { paper } = C.mat;

  const SLOT_Y = Y(146);                         // slot height (just under the stripe)
  const TRAY_Y = Y(180) + 2.4;                   // resting height on the tray
  const SHEET_X = X(446);
  const START_Z = ZF - 10;                       // hidden inside the machine
  const OUT_Z = ZF + 1;                          // fully out
  const STACK_STEP = 0.32;                       // vertical gap between stacked sheets

  const easeOut = t => 1 - (1 - t) * (1 - t);
  const easeIn = t => t * t;

  // One of the six sheets shows a printed page (text lines + CMYK bars); the rest are blank.
  const printedTex = canvasTex(256, 160, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#c9ced6';
    for (let i = 0; i < 7; i++) g.fillRect(16, 18 + i * 12, i % 3 === 2 ? 130 : 224, 5);
    [['#00a0e9', 16], ['#e4007f', 72], ['#ffd400', 128], ['#222', 184]].forEach(([color, x]) => {
      g.fillStyle = color;
      g.fillRect(x, 112, 52, 30);
    });
  });
  const printedMat = new THREE.MeshStandardMaterial({ map: printedTex, roughness: 0.9 });
  // BoxGeometry has 6 faces; index 2 is the top, so only the top shows the print.
  const sheetMaterials = [paper, paper, printedMat, paper, paper, paper];

  const sheets = [];
  for (let i = 0; i < PRINT.pool; i++) {
    const sheet = shadow(new THREE.Mesh(new THREE.BoxGeometry(28, 0.3, 16), sheetMaterials));
    sheet.visible = false;
    sheet.userData = { t: -1, rot: 0, slot: i };   // t < 0 means idle
    stack.add(sheet);
    sheets.push(sheet);
  }

  let on = false;
  let spawned = 0;
  let untilNext = 0;

  function spawn() {
    const slot = spawned % PRINT.pool;
    const sheet = sheets[slot];
    sheet.userData = { t: 0, rot: (Math.random() - 0.5) * 0.12, slot };
    sheet.rotation.y = 0;
    sheet.visible = true;
    spawned++;
  }

  function advance(sheet, dt) {
    const u = sheet.userData;
    u.t += dt;
    const restY = TRAY_Y + u.slot * STACK_STEP;

    if (u.t < PRINT.slide) {                       // 1. slide out of the slot
      const k = easeOut(u.t / PRINT.slide);
      sheet.position.set(SHEET_X, SLOT_Y, START_Z + (OUT_Z - START_Z) * k);
    } else if (u.t < PRINT.slide + PRINT.drop) {   // 2. drop onto the tray
      const k = easeIn((u.t - PRINT.slide) / PRINT.drop);
      sheet.position.set(SHEET_X, SLOT_Y + (restY - SLOT_Y) * k, OUT_Z);
      sheet.rotation.y = u.rot * k;
    } else {                                       // 3. rest (idle until reused)
      sheet.position.set(SHEET_X, restY, OUT_Z);
      sheet.rotation.y = u.rot;
      u.t = -1;
    }
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
      sheets.forEach(sheet => { if (sheet.userData.t >= 0) advance(sheet, dt); });
    }
  };
})(window.Cetak);
