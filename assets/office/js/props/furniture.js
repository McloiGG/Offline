// Desk, office chair and the desktop clutter. Every builder returns a Group with its origin on the
// floor. Local axes: the person sits on the +z side of the desk and faces -z.
// Exposes: Cetak.office.furniture = { desk(opts), chair(opts) }
(function (C) {
  const { COLORS } = C.office.config;
  const { std } = C.office.mat;
  const { box, cyl } = C.office.util;
  const { canvasTex } = C.helpers;

  const DESK = { w: 130, d: 70, h: 74 };

  // Fake spreadsheet / chat window drawn on a canvas.
  function screenTexture(hue) {
    return canvasTex(256, 160, (g, w, h) => {
      g.fillStyle = '#10151f';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1c2a44';
      g.fillRect(0, 0, w, 14);
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 4; col++) {
          g.fillStyle = 'hsl(' + (hue + col * 12) + ',45%,' + (35 + ((row * 7 + col * 13) % 30)) + '%)';
          g.fillRect(10 + col * 60, 24 + row * 14, 40 + ((row * col * 11) % 14), 6);
        }
      }
    });
  }

  function monitor(parent, x, z, hue) {
    box(22, 3, 16, std(0x25272c, 0.5), x, DESK.h + 1.5, z, parent);
    box(5, 12, 4, std(0x25272c, 0.5), x, DESK.h + 8, z, parent);
    box(52, 32, 3, std(0x1d1f23, 0.4), x, DESK.h + 28, z, parent);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 28),
      new THREE.MeshBasicMaterial({ map: screenTexture(hue) })
    );
    screen.position.set(x, DESK.h + 28, z + 1.6);   // faces +z, towards whoever sits there
    parent.add(screen);
  }

  function desk(opts) {
    const o = opts || {};
    const g = new THREE.Group();
    const wood = std(o.wood || COLORS.wood, 0.6);
    const metal = std(COLORS.metal, 0.5, 0.3);

    box(DESK.w, 4, DESK.d, wood, 0, DESK.h - 2, 0, g);
    [-1, 1].forEach(sx => {
      box(3, DESK.h - 4, DESK.d - 6, metal, sx * (DESK.w / 2 - 5), (DESK.h - 4) / 2, 0, g);   // side panels
    });
    box(DESK.w - 12, 38, 2, metal, 0, 50, -DESK.d / 2 + 6, g);                                // modesty panel

    monitor(g, 0, -12, o.hue || 210);
    box(38, 1.6, 12, std(0x2c2e33, 0.5), 0, DESK.h + 0.8, 14, g);                              // keyboard
    box(5, 2, 8, std(0x2c2e33, 0.5), 30, DESK.h + 1, 14, g);                                   // mouse
    cyl(4, 3.4, 9, std(o.mug || 0xd9453b, 0.5), -44, DESK.h + 4.5, 6, g);                      // mug
    box(21, 1, 30, std(0xf4f4f4, 0.9), -44, DESK.h + 0.5, -14, g).rotation.y = 0.15;           // paper stack
    box(21, 1, 29, std(0xf0f0f0, 0.9), -43, DESK.h + 1.5, -14, g).rotation.y = -0.1;

    return g;
  }

  function chair(opts) {
    const o = opts || {};
    const g = new THREE.Group();
    const fabric = std(o.color || 0x3a3f4a, 0.8);
    const metal = std(0x1f2126, 0.4, 0.5);

    const swivel = new THREE.Group();       // the whole chair turns on its pole
    g.add(swivel);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = box(22, 2.4, 3, metal, Math.cos(a) * 11, 6, Math.sin(a) * 11, swivel);
      leg.rotation.y = -a;
      cyl(2.2, 2.2, 3.4, std(0x0e0f11, 0.6), Math.cos(a) * 22, 2.4, Math.sin(a) * 22, swivel, 10);
    }
    cyl(2, 2, 36, metal, 0, 24, 0, swivel, 10);
    box(44, 7, 42, fabric, 0, 46.5, 0, swivel);
    box(40, 44, 6, fabric, 0, 72, 20, swivel);
    [-1, 1].forEach(s => box(3, 3, 24, metal, s * 22, 60, 4, swivel));                          // armrests

    g.userData.swivel = swivel;
    return g;
  }

  C.office.furniture = { desk, chair };
})(window.Cetak);
