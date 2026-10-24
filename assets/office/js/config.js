// Office-wide constants. Everything office-related hangs off `Cetak.office`.
// Units match the printer scene: roughly 1 unit = 1 cm (a desk is 130 wide, a person ~165 tall).
// The printer sits at the origin facing +z; the back wall is at z = -95 (built by the printer's power.js).
(function (C) {
  // `updaters` holds per-frame callbacks (t = seconds since start, dt = seconds since last frame).
  const office = (C.office = { updaters: [] });

  // Closed loops the walking officemates follow, as [x, z] floor waypoints. They keep well away from the
  // printer and the open floor in front of it (x between -160 and 160, z below 400):
  //   left / right = the aisles between the inner and outer desk columns
  //   front        = a long loop along the front of the room, behind the camera's usual spot
  const LEFT = [[-378, 60], [-318, 60], [-318, 400], [-378, 400]];
  const RIGHT = [[318, 60], [378, 60], [378, 400], [318, 400]];
  const FRONT = [[-590, 450], [590, 450], [590, 570], [-590, 570]];

  office.config = {
    // Much larger than the camera can ever reach (the camera orbits the printer, max 420 away).
    ROOM: { xMin: -700, xMax: 700, zBack: -95, zFront: 620, wallH: 320 },

    // The camera is kept this far inside the room's walls, floor and ceiling.
    CAMERA_MARGIN: 10,

    COLORS: {
      carpetA: 0x8c96a6,
      carpetB: 0x848e9f,
      wall: 0xaebfd0,
      skirting: 0xc3c8d1,
      ceiling: 0xeceef2,
      wood: 0xb98b5a,
      metal: 0x4b4f57
    },

    // Walking officemates. prop: 'stack' = both arms hugging a pile of files, 'folder' = one folder in
    // the right hand, 'cup' = coffee cup. `start` is how far round the loop (0..1) they begin.
    WALKERS: [
      { path: LEFT,  speed: 60, start: 0.00, prop: 'stack',  shirt: 0x4a78c2, pants: 0x2f3a4f, skin: 0xf1c9a5, hair: 0x3b2a20 },
      { path: RIGHT, speed: 66, start: 0.40, prop: 'folder', shirt: 0x3f8f5a, pants: 0x33333b, skin: 0xa8714a, hair: 0x15110f },
      { path: FRONT, speed: 74, start: 0.00, prop: 'folder', shirt: 0xe3b23c, pants: 0x3b4a66, skin: 0xd9a577, hair: 0x7a4b1e },
      { path: FRONT, speed: 78, start: 0.55, prop: 'cup',    shirt: 0x7b57c9, pants: 0x2a2d35, skin: 0x7a4b2e, hair: 0x0e0c0b }
    ],

    // The two coworkers chatting over coffee, and what they say (alternating speakers).
    CHATTERS: [
      { x: -342, z: -5, faceX: 1,  shirt: 0xc2517a, pants: 0x30343c, skin: 0xe7b894, hair: 0x2b211b },
      { x: -258, z: -5, faceX: -1, shirt: 0x5ba88a, pants: 0x2c3140, skin: 0x8d5a3b, hair: 0x120f0d }
    ],
    CHAT_PHRASES: ['Lunch at noon?', 'Nice weather', 'Q3 looks good', 'Great coffee', 'Is it Friday?', 'New hire Monday', 'Meeting at 3', 'Who took my mug?'],
    CHAT_TURN_SECONDS: 3.6,

    // Camera preset added to the printer's VIEWS table (same format: p = position, t = look-at).
    OFFICE_VIEW: { p: [210, 150, 330], t: [0, 55, 40], info: 'The office: a busy day, and the printer is about to ruin it' }
  };
})(window.Cetak);
