// Where every prop goes. Edit the numbers here to rearrange the room.
// Desk columns sit between the walkers' loops (see config.js), so nobody walks through furniture.
// Seated officemates are created here too, because each one belongs to a specific chair.
(function (C) {
  const { ROOM } = C.office.config;
  const { desk, chair } = C.office.furniture;   // the room's furniture builders (see props/furniture.js)
  const decor = C.office.decor;
  const figure = C.office.figure;
  const { place } = C.office.util;

  // Back-to-back desk pairs. `flip` turns the desk (and its sitter) to face the other way.
  // The four desks at x = +-225 are the inner columns; x = +-470 are background only.
  const DESKS = [
    { x: -225, z: 130, flip: false, hue: 210, mug: 0xd9453b, shirt: 0x4a78c2, skin: 0xe7b894, hair: 0x2b211b },
    { x: -225, z: 290, flip: true,  hue: 150, mug: 0x3f8f5a, shirt: 0xc2517a, skin: 0x8d5a3b, hair: 0x120f0d },
    { x:  225, z: 130, flip: false, hue: 30,  mug: 0x3f6fb5, shirt: 0x5ba88a, skin: 0xf2d0b0, hair: 0x6b3d1b },
    { x:  225, z: 290, flip: true,  hue: 280, mug: 0xe3b23c, shirt: 0xd88b3a, skin: 0xb57b52, hair: 0x1c1613 },
    { x: -470, z: 130, flip: false, hue: 190, mug: 0x7b57c9, shirt: 0x8a6bd0, skin: 0xd9a577, hair: 0x3b2a20 },
    { x: -470, z: 290, flip: true,  hue: 340, mug: 0xd9453b, shirt: 0x3f8f9a, skin: 0xf1c9a5, hair: 0x15110f },
    { x:  470, z: 130, flip: false, hue: 100, mug: 0x3f8f5a, shirt: 0xcf6a4a, skin: 0x7a4b2e, hair: 0x0e0c0b },
    { x:  470, z: 290, flip: true,  hue: 250, mug: 0xe3b23c, shirt: 0x5a6fb5, skin: 0xe2b48f, hair: 0x7a4b1e }
  ];

  DESKS.forEach((d, i) => {
    const turn = d.flip ? Math.PI : 0;
    place(desk({ hue: d.hue, mug: d.mug }), d.x, d.z, turn);

    // Chair + sitter are offset 56 from the desk centre, on the sitter's side.
    const seatZ = d.z + (d.flip ? -56 : 56);
    const seat = place(chair({ color: i % 2 ? 0x3a4a63 : 0x4a3a3a }), d.x, seatZ, turn);

    const person = figure.create({ shirt: d.shirt, pants: 0x30343c, skin: d.skin, hair: d.hair });
    place(person.group, d.x, seatZ, turn + Math.PI);

    const swivel = seat.userData.swivel;
    C.office.updaters.push(t => {
      figure.sitPose(person, t + i * 1.9);
      swivel.rotation.y = Math.sin(t * 0.9 + i) * 0.18;
      person.group.rotation.y = turn + Math.PI + swivel.rotation.y;
    });
  });

  // ---- back wall: everything lines up against z = ROOM.zBack ----
  const wallZ = ROOM.zBack;
  place(decor.coffeeStation(), -300, wallZ + 25, 0);          // the two chatters stand just in front of it
  place(decor.bookshelf(), -520, wallZ + 16, 0);
  place(decor.bookshelf(), 520, wallZ + 16, 0);
  place(decor.cabinet(), -165, wallZ + 31, 0);
  place(decor.cabinet(), 165, wallZ + 31, 0);
  place(decor.waterCooler(), -105, wallZ + 18, 0);
  place(decor.plant(80), 105, wallZ + 18, 0);
  place(decor.plant(95), 300, wallZ + 22, 0);
  place(decor.plant(70), -640, wallZ + 24, 0);
  place(decor.plant(88), 640, wallZ + 24, 0);

  // Wall items: place() puts things on the floor, so lift them to hanging height afterwards.
  // place(group, x, z, rotY): z is the wall plane. Centre at 195 puts the bottom edge at 150, above the printer top (132).
  place(decor.whiteboard(), 0, wallZ, 0).position.y = 195;
  place(decor.clock(), 130, wallZ, 0).position.y = 250;

  // Side and front corners (background only).
  place(decor.plant(75), ROOM.xMin + 28, ROOM.zFront - 28, 0);
  place(decor.plant(90), ROOM.xMax - 28, ROOM.zFront - 28, 0);
  place(decor.bookshelf(), ROOM.xMin + 16, 330, Math.PI / 2);
  place(decor.bookshelf(), ROOM.xMax - 16, 330, -Math.PI / 2);

  // ---- trash cans: one overflowing by the printer, one beside each inner desk column ----
  place(decor.trashCan(true), 62, 12, 0);
  place(decor.trashCan(true), -160, 215, 0);
  place(decor.trashCan(false), 160, 215, 0);
  place(decor.trashCan(false), -415, 215, 0);
  place(decor.trashCan(true), 415, 215, 0);
})(window.Cetak);
