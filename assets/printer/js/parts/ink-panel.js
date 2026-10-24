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

  INKS.forEach(ink => {
    rect(ink.cx - 7, 274, ink.cx + 7, 308, ZF + 1.75, 0.3, black2);        // holder
    rect(ink.cx - 5, tankTop, ink.cx + 5, tankBottom, ZF + 1.95, 0.3, dark); // empty tank

    const fillMat = new THREE.MeshStandardMaterial({
      color: ink.color, roughness: 0.3,
      emissive: ink.color, emissiveIntensity: ink.name === 'BK' ? 0 : 0.25
    });
    const fill = shadow(new THREE.Mesh(new THREE.BoxGeometry(10 * S, tankHeight * ink.level, 0.4), fillMat));
    fill.position.set(X(ink.cx), Y(tankBottom) + tankHeight * ink.level / 2, ZF + 2.25);
    stack.add(fill);

    label(ink.name, ink.cx, 310.5, 2.2, 1.3, ZF + 2.0, '#cfd3d9', 'bold');
  });

  // Small diamond logo on the right of the panel.
  const logoTex = canvasTex(256, 256, (g, w, h) => {
    g.strokeStyle = '#7fd3ff';
    g.lineWidth = 12;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(w / 2, 30);
    g.lineTo(w - 40, h / 2);
    g.lineTo(w / 2, h - 30);
    g.lineTo(40, h / 2);
    g.closePath();
    g.stroke();
    g.fillStyle = '#7fd3ff';
    g.beginPath();
    g.arc(w / 2, h / 2, 26, 0, 7);
    g.fill();
  });
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({ map: logoTex, transparent: true })
  );
  logo.position.set(X(462), Y(290), ZF + 1.75);
  stack.add(logo);

  rect(372, 268, 478, 312, ZF + 2.7, 0.1, glass);   // transparent cover
})(window.Cetak);
