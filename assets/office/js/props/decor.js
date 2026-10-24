// Everything else in the room: trash can, coffee station, plant, water cooler, shelf, filing cabinet,
// whiteboard, clock. Each builder returns a Group with its origin on the floor (wall items: origin on
// the wall surface).
// Exposes: Cetak.office.decor = { trashCan, coffeeStation, plant, waterCooler, bookshelf, cabinet, whiteboard, clock }
(function (C) {
  const { std } = C.office.mat;
  const { box, cyl, sphere } = C.office.util;
  const { canvasTex } = C.helpers;

  // Metal bin (open at the top) lined with a light blue plastic bag. The bag sits INSIDE the bin and is
  // folded over the rim, so the metal still shows below it. `overflowing` fills the bag higher with paper.
  function trashCan(overflowing) {
    const g = new THREE.Group();
    g.scale.setScalar(0.8);
    const metal = new THREE.MeshStandardMaterial({ color: 0x6d747f, roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide });
    const bag = new THREE.MeshStandardMaterial({ color: 0x9fd3f0, roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide });
    const bagFold = new THREE.MeshStandardMaterial({ color: 0x86c0e0, roughness: 0.3, side: THREE.DoubleSide });
    const paper = std(0xf2f2f2, 1);

    const openTube = (rTop, rBottom, h, mat, y) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, 24, 1, true), mat);
      m.position.set(0, y, 0);
      m.receiveShadow = true;
      g.add(m);
      return m;
    };

    const bin = openTube(12, 10, 30, metal, 15);
    bin.castShadow = true;
    cyl(10, 10, 1, metal, 0, 0.5, 0, g, 24);                                 // bin floor

    openTube(11.6, 9.6, 27, bag, 16.5);                                      // liner, inside the bin, ends at the rim
    openTube(12.8, 12.8, 5, bagFold, 28);                                    // cuff folded over the rim
    cyl(9.6, 9.6, 0.4, bag, 0, 3, 0, g, 24);                                 // bag bottom

    // Crumpled paper only, kept well inside the bag: each ball stays at least ~1 unit from the bag wall
    // and below the bag's top edge, so nothing pokes through the sides or sticks out above.
    // [x, y, z, radius]
    const paperBalls = overflowing
      ? [[-3, 12, 1, 5], [4, 13, -2, 5], [0, 18, 3, 5], [-4, 20, -3, 5], [3, 23, 0, 4.8], [-1, 24, 2, 4.5]]
      : [[-3, 11, 1, 5], [3, 12, -2, 4.6]];
    paperBalls.forEach(p => sphere(p[3], paper, p[0], p[1], p[2], g).scale.set(1, 0.9, 1.05));
    return g;
  }

  // Counter against the wall with a coffee machine, cups, a mini fridge and a small sign.
  // Local +z is the front; the back of the counter is at z = -25.
  function coffeeStation() {
    const g = new THREE.Group();
    const wood = std(0xb98b5a, 0.6);
    const steel = std(0xb9bec6, 0.3, 0.7);
    const dark = std(0x24262b, 0.5, 0.3);

    box(96, 3, 50, std(0xd8dbe0, 0.4), 0, 88.5, 0, g);                 // countertop
    box(92, 86, 46, wood, 0, 43, 0, g);                                // cabinet
    box(40, 78, 0.8, std(0x9d754a, 0.6), -22, 43, 23.2, g);            // cabinet doors
    box(40, 78, 0.8, std(0x9d754a, 0.6), 22, 43, 23.2, g);
    box(3, 8, 1.6, steel, -4, 60, 23.9, g);
    box(3, 8, 1.6, steel, 4, 60, 23.9, g);

    // coffee machine
    box(32, 40, 28, dark, -22, 111, -8, g);
    box(32, 6, 28, steel, -22, 134, -8, g);
    box(22, 4, 22, steel, -22, 94, 2, g);                              // drip tray
    cyl(2.5, 2.5, 8, steel, -22, 120, 8, g, 10);                       // spout
    box(6, 6, 1, std(0x3fa86a, 0.4), -22, 127, 6.6, g);                // power light
    cyl(5, 4, 11, std(0xf6f6f6, 0.9), -22, 101, 3, g, 14);             // cup being filled
    cyl(4.4, 4.4, 5, std(0x6b3a1e, 0.3), -22, 105, 3, g, 14);

    // glass jug + cup stack + sugar jar
    cyl(6.6, 6.6, 15, new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.15, transparent: true, opacity: 0.8 }), 6, 98, -6, g, 18);
    for (let i = 0; i < 4; i++) cyl(4.6, 3.4, 10, std(0xf6f6f6, 0.9), 26, 95 + i * 3.6, -8, g, 14);
    cyl(6, 6, 10, new THREE.MeshStandardMaterial({ color: 0xe9f1f7, roughness: 0.1, transparent: true, opacity: 0.6 }), 38, 95, 4, g, 14);
    cyl(5.4, 5.4, 6, std(0xfdfdfd, 0.9), 38, 92, 4, g, 14);

    // sign above the station
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 15),
      new THREE.MeshBasicMaterial({
        map: canvasTex(400, 120, (c, w, h) => {
          c.fillStyle = '#2f2118';
          c.fillRect(0, 0, w, h);
          c.fillStyle = '#f3e5d0';
          c.font = 'bold 56px Arial';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('COFFEE', w / 2, h / 2 + 4);
        })
      })
    );
    sign.position.set(0, 165, -24.4);
    g.add(sign);

    // mini fridge to the right
    const fridge = box(46, 84, 46, std(0xe6e8ec, 0.4, 0.1), 74, 42, 0, g);
    fridge.castShadow = true;
    box(2, 18, 3, steel, 55, 55, 24.5, g);
    box(44, 1, 1, std(0xa9aeb7, 0.8), 74, 62, 23.4, g);                // door split
    return g;
  }

  function plant(height) {
    const g = new THREE.Group();
    const h = height || 70;
    cyl(14, 11, 26, std(0xc9c2b4, 0.7), 0, 13, 0, g, 20);
    cyl(12.5, 12.5, 1.5, std(0x4a3a2c, 1), 0, 26, 0, g, 20);
    const leaf = std(0x3f8a4d, 0.8);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const lh = h * (0.55 + (i % 3) * 0.2);
      const l = sphere(1, leaf, Math.cos(a) * 9, 26 + lh / 2, Math.sin(a) * 9, g);
      l.scale.set(6.5, lh / 2, 3);
      l.rotation.set(Math.sin(a) * 0.35, a, -Math.cos(a) * 0.35);
    }
    return g;
  }

  function waterCooler() {
    const g = new THREE.Group();
    const white = std(0xeceff2, 0.45);
    const grey = std(0xc9ced5, 0.5);
    const steel = std(0xb9bec6, 0.3, 0.7);
    const dark = std(0x1d2025, 0.5);
    const glassy = (color, opacity) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.08, metalness: 0.1, transparent: true, opacity, depthWrite: false });

    // body: dark plinth, white cabinet, light-grey dispensing section, steel top plate
    box(34, 5, 34, dark, 0, 2.5, 0, g);
    box(32, 52, 32, white, 0, 31, 0, g);
    box(30, 0.6, 0.8, std(0xb4bac2, 0.8), 0, 31, 16.2, g);                       // seam where the cabinet door would be
    box(32, 30, 32, grey, 0, 72, 0, g);
    box(34, 2.4, 34, steel, 0, 88.2, 0, g);

    // recessed dispensing panel with two taps
    box(26, 18, 3, dark, 0, 74, 15.2, g);
    [[-6.5, 0x2d6cdf], [6.5, 0xd9453b]].forEach(([x, color]) => {
      const mat = std(color, 0.4);
      cyl(2.6, 2.6, 5, mat, x, 78, 17.2, g, 14).rotation.x = Math.PI / 2;        // tap body, sticking out of the panel
      cyl(1.6, 1.6, 5, steel, x, 74.6, 19, g, 10);                               // nozzle pointing down
      box(4.4, 1.2, 0.6, mat, x, 82.5, 16.9, g);                                 // colour strip above the tap
    });

    // drip tray with grill slots, and a cup standing on it
    box(26, 2, 11, steel, 0, 65, 21.5, g);
    for (let i = 0; i < 4; i++) box(22, 0.5, 1, dark, 0, 66.2, 18.2 + i * 2.8, g);
    cyl(3.8, 2.9, 8, std(0xf8f8f8, 0.9), 0, 70.4, 21.5, g, 14);

    // indicator lights on the front of the steel top plate
    sphere(0.9, std(0x3fd06a, 0.3), -6, 88.2, 17.1, g);
    sphere(0.9, std(0xff5a3c, 0.3), 6, 88.2, 17.1, g);

    // side cup holder: clear tube with a stack of paper cups
    const holder = cyl(5, 5, 24, glassy(0xdfe9f2, 0.35), 21.5, 70, -2, g, 18);
    holder.castShadow = false;
    for (let i = 0; i < 6; i++) cyl(4.2, 3.4, 4, std(0xf8f8f8, 0.9), 21.5, 61 + i * 3.4, -2, g, 14);
    box(3, 26, 1, steel, 17.2, 70, -2, g);                                       // bracket to the body

    // bottle, built upward from the steel top plate (surface at y = 89.4). CylinderGeometry args are
    // (rTop, rBottom, ...), so the shoulder is wide at the TOP and narrows down into the neck.
    const glass = glassy(0xcfe6f6, 0.22);
    const water = glassy(0x4aa8e6, 0.6);
    cyl(7.5, 12, 8, std(0x8f969f, 0.4, 0.5), 0, 93.4, 0, g, 24);                 // cradle the bottle sits in (89.4 - 97.4)
    cyl(5, 5, 8, glass, 0, 93.4, 0, g, 18);                                      // neck, down inside the cradle
    cyl(14.5, 5, 9, glass, 0, 101.9, 0, g, 28);                                  // shoulder cone (97.4 - 106.4)
    cyl(14.5, 14.5, 32, glass, 0, 122.4, 0, g, 28);                              // body (106.4 - 138.4)
    cyl(8, 14.5, 4, glass, 0, 140.4, 0, g, 24);                                  // top dome (138.4 - 142.4)
    cyl(13.6, 4.4, 8.4, water, 0, 101.9, 0, g, 28);                              // water in the cone
    cyl(13.6, 13.6, 20, water, 0, 116.4, 0, g, 28);                              // water in the body (surface at 126.4)
    cyl(13.6, 13.6, 0.3, std(0xa8dcf8, 0.1), 0, 126.5, 0, g, 28);                // lighter water surface
    const handle = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.9, 8, 16), steel);
    handle.position.set(0, 143.4, 0);
    handle.rotation.x = Math.PI / 2;
    g.add(handle);
    [[-5, 109, 5], [4, 115, -6], [6, 111, 3], [-3, 120, -2]].forEach(p =>        // a few bubbles
      sphere(0.8, std(0xffffff, 0.2), p[0], p[1], p[2], g));
    return g;
  }

  function bookshelf() {
    const g = new THREE.Group();
    const wood = std(0x8a6a4a, 0.7);
    box(100, 190, 2, wood, 0, 95, -14, g);
    [-1, 1].forEach(s => box(3, 190, 30, wood, s * 48.5, 95, 0, g));
    const colors = [0xd9453b, 0x3f6fb5, 0x3f8f5a, 0xe3b23c, 0x7b57c9, 0xe8e8e8];
    for (let i = 0; i < 6; i++) {
      const y = 2 + i * 36;
      box(94, 2, 30, wood, 0, y, 0, g);
      let x = -42;
      for (let b = 0; x < 42; b++) {
        const w = 5 + ((b * 7 + i * 3) % 5);
        const h = 20 + ((b * 11 + i * 5) % 12);
        box(w, h, 20, std(colors[(b + i) % colors.length], 0.8), x + w / 2, y + 1 + h / 2, 0, g);
        x += w + 0.8;
      }
    }
    return g;
  }

  function cabinet() {
    const g = new THREE.Group();
    const metal = std(0xa6acb5, 0.4, 0.5);
    box(46, 130, 60, metal, 0, 65, 0, g);
    for (let i = 0; i < 4; i++) {
      box(40, 28, 1.5, std(0x949aa3, 0.4, 0.5), 0, 18 + i * 31, 30.5, g);
      box(16, 3, 2, std(0x2a2c30, 0.5), 0, 28 + i * 31, 31.5, g);
    }
    return g;
  }

  function whiteboard() {
    const g = new THREE.Group();
    const frame = std(0x9aa0a8, 0.4, 0.5);
    box(150, 90, 3, frame, 0, 0, 3, g);                       // frame, standing 1.5 off the wall on its brackets
    [-62, 62].forEach(x => [-34, 34].forEach(y => box(5, 5, 1.5, std(0x6d747f, 0.4, 0.6), x, y, 0.75, g)));
    box(70, 2.5, 7, frame, 0, -46, 5, g);                     // marker ledge along the bottom edge
    [-18, 0, 18].forEach((x, i) =>
      cyl(0.9, 0.9, 11, std([0xd9453b, 0x3f6fb5, 0x222222][i], 0.5), x, -43.4, 6, g, 8).rotation.z = Math.PI / 2);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(144, 84),
      new THREE.MeshBasicMaterial({
        map: canvasTex(512, 300, (c, w, h) => {
          c.fillStyle = '#f6f7f8';
          c.fillRect(0, 0, w, h);
          c.font = 'bold 34px Arial';
          c.fillStyle = '#d9453b';
          c.fillText('PRINTER STATUS:', 24, 52);
          c.fillStyle = '#222';
          c.fillText('BROKEN (again)', 24, 98);
          c.font = '26px Arial';
          c.fillStyle = '#3f6fb5';
          c.fillText('- tried turning it off & on', 24, 160);
          c.fillText('- tried yelling at it', 24, 200);
          c.fillText('- tried crying', 24, 240);
        })
      })
    );
    face.position.z = 4.6;
    g.add(face);
    return g;
  }

  function clock() {
    const g = new THREE.Group();
    cyl(18, 18, 3, std(0x2a2c30, 0.5), 0, 0, 1.5, g, 32).rotation.x = Math.PI / 2;
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(16, 32),
      new THREE.MeshBasicMaterial({
        map: canvasTex(256, 256, (c, w, h) => {
          c.fillStyle = '#fafafa';
          c.fillRect(0, 0, w, h);
          c.strokeStyle = '#222';
          c.lineWidth = 8;
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            c.beginPath();
            c.moveTo(w / 2 + Math.cos(a) * 104, h / 2 + Math.sin(a) * 104);
            c.lineTo(w / 2 + Math.cos(a) * 118, h / 2 + Math.sin(a) * 118);
            c.stroke();
          }
          c.lineWidth = 10;
          c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + 40, h / 2 - 66); c.stroke();    // hour
          c.lineWidth = 6;
          c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 - 14, h / 2 - 96); c.stroke();    // minute
        })
      })
    );
    face.position.z = 3.1;
    g.add(face);
    return g;
  }

  C.office.decor = { trashCan, coffeeStation, plant, waterCooler, bookshelf, cabinet, whiteboard, clock };
})(window.Cetak);
