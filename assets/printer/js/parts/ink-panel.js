// Ink display on door A: four tanks (BK, Y, M, C) with fill levels behind a glass cover.
// Z layering (front-most last) is deliberate -- keep the gaps or the tanks will flicker:
//   panel +1.6 < holder +1.75 < tank +1.95 < fill +2.25 < glass +2.7
(function (C) {
  const { S, ZF, X, Y, COLORS } = C.config;
  const { rect, slab, label, canvasTex, shadow } = C.helpers;
  const { stack } = C.scene;
  const { black, black2, dark, glass } = C.mat;

  slab(372, 268, 478, 312, ZF + 1.6, 1.6, black, [2.4, 2.4, 2.4, 2.4]);

  // Black ink uses a lighter grey so it stays visible against the dark panel.
  const INKS = [
    { cx: 392, name: 'BK', color: 0x55575c,       level: 0.85 },
    { cx: 408, name: 'Y',  color: COLORS.yellow,  level: 0.70 },
    { cx: 424, name: 'M',  color: COLORS.magenta, level: 0.55 },
    { cx: 440, name: 'C',  color: COLORS.cyan,    level: 0.90 }
  ];

  const tankTop = 279;
  const tankBottom = 303;
  const tankHeight = (tankBottom - tankTop) * S;

  const MIN_LEVEL = 0.04;              // an "empty" tank still shows a sliver of ink
  const fills = [];

  INKS.forEach(ink => {
    rect(ink.cx - 7, 274, ink.cx + 7, 308, ZF + 1.75, 0.3, black2);        // holder
    rect(ink.cx - 5, tankTop, ink.cx + 5, tankBottom, ZF + 1.95, 0.3, dark); // empty tank

    const fillMat = new THREE.MeshStandardMaterial({
      color: ink.color, roughness: 0.3,
      emissive: ink.color, emissiveIntensity: ink.name === 'BK' ? 0 : 0.25
    });
    const fill = shadow(new THREE.Mesh(new THREE.BoxGeometry(10 * S, tankHeight, 0.4), fillMat));
    fill.position.x = X(ink.cx);
    fill.position.z = ZF + 2.25;
    stack.add(fill);
    fills.push(fill);

    label(ink.name, ink.cx, 310.5, 2.2, 1.3, ZF + 2.0, '#cfd3d9', 'bold');
  });

  // Small diamond logo on the right of the panel. The texture is white and tinted by the material colour,
  // so it can turn red while there is a warning.
  const LOGO_OK = 0x7fd3ff, LOGO_WARN = 0xff3b30;
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
  logo.position.set(X(462), Y(290), ZF + 1.75);
  stack.add(logo);

  function setLevel(i, level) {
    const l = Math.max(MIN_LEVEL, Math.min(1, level));
    fills[i].scale.y = l;
    fills[i].position.y = Y(tankBottom) + tankHeight * l / 2;
  }
  INKS.forEach((ink, i) => setLevel(i, ink.level));

  // While a warning is active the logo blinks red; call update(time) every frame.
  let warning = false;
  C.parts.inkPanel = {
    names: INKS.map(ink => ink.name),
    setLevel,
    setWarning(on) { warning = on; if (!on) logo.material.color.setHex(LOGO_OK); },
    update(t) { if (warning) logo.material.color.setHex(Math.floor(t * 3) % 2 ? LOGO_WARN : 0x4a1410); }
  };

  rect(372, 268, 478, 312, ZF + 2.7, 0.1, glass);   // transparent cover
})(window.Cetak);
