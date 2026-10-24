// Shared constants. Every other file reads from `Cetak.config`; nothing here touches THREE.
(function (C) {
  // The model is built in "photo pixels" (front-view reference photo, 1000px wide),
  // then converted to world units. X()/Y() do that conversion.
  const S = 0.2612;          // world units per photo pixel
  const D = 66;              // printer depth
  const ZF = D / 2;          // z of the front face

  C.config = {
    S, D, ZF,
    X: px => (px - 500) * S,
    Y: py => (545 - py) * S,

    COLORS: {
      background: 0xeef0f3,
      cyan: 0x00a0e9,
      magenta: 0xe4007f,
      yellow: 0xffd400,
      black: 0x222222
    },

    // Wall + socket the power cord runs to (State 5).
    WALL: { z: -95, socketX: 42, socketY: 18 },

    // Power port / plug on the back of the printer.
    PLUG: { y: 13, inZ: -D / 2 - 0.9, outZ: -D / 2 - 14 },

    // Printing animation timings (seconds).
    PRINT: { pool: 6, slide: 0.9, drop: 0.4, spawnEvery: 1.3 },

    // Camera presets: p = camera position, t = look-at target.
    // 's1'..'s5' are the five game states and share spots with some named views.
    VIEWS: {
      front:   { p: [0, 80, 280],    t: [0, 64, 0],       info: 'Front view' },
      three:   { p: [175, 125, 235], t: [0, 62, 0],       info: '3/4 view' },
      display: { p: [30, 118, 80],   t: [19.3, 107, 34],  info: '10.1-inch colour touchscreen display' },
      ink:     { p: [-20, 70, 72],   t: [-19.6, 66.6, 33], info: 'Ink display: pigment inks BK, Y, M, C behind a transparent window' },
      vent:    { p: [108, 70, -6],   t: [35, 64, -6],     info: 'Ventilation: louvred side and rear exhaust grilles with fans' },
      print:   { p: [-8, 124, 95],   t: [-14, 98, 34],    info: 'Printing: sheets come out under the "A working Printer" stripe' },
      s1:      { p: [0, 62, 105],    t: [0, 24, 38],      info: 'State 1: Paper jam. Click the paper tray (C1) to open it.' },
      s2:      { p: [-20, 70, 72],   t: [-19.6, 66.6, 33], info: 'State 2: Ink low. Check the ink cartridges.' },
      s3:      { p: [30, 118, 80],   t: [19.3, 107, 34],  info: 'State 3: Offline. Find the wifi icon on the display.' },
      s4:      { p: [108, 70, -6],   t: [35, 64, -6],     info: 'State 4: Overheating. Check the ventilation fans.' },
      s5:      { p: [18, 24, -78],   t: [10, 14, -45],    info: 'State 5: Plug in, plug out. Click the plug.' }
    }
  };

  // Mutable runtime state shared across modules.
  C.state = {
    shift: 0,             // y offset of the whole printer body (+2 cassettes => raised)
    currentView: 'three'  // name of the active camera preset
  };

  // Namespaces the part / anim / ui files attach themselves to.
  C.parts = {};
  C.anim = {};
  C.ui = {};
})(window.Cetak = window.Cetak || {});
