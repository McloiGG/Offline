// Tilted 10.1" touchscreen. The screen image is a canvas texture (home screen with app icons).
(function (C) {
  const { S, ZF, X, Y } = C.config;
  const { shadow, canvasTex, roundRectPath } = C.helpers;
  const { stack } = C.scene;
  const { black } = C.mat;

  const ICONS = [
    ['Copy', '#2f80ed'], ['Scan', '#27ae60'], ['Fax', '#ffffff'], ['Print Job', '#8e44ad'], ['Box', '#f2994a'],
    ['Settings', '#7b8794'], ['Status', '#16a5a5'], ['Ink Level', '#00a0e9'], ['Eco', '#6cbf3c'], ['Help', '#9aa3ad']
  ];

  function drawHomeScreen(g, w) {
    g.fillStyle = '#0a0a0c';
    roundRectPath(g, 0, 0, w, 560, 34);
    g.fill();

    const sx = 26, sy = 24, sw = w - 52, sh = 448;
    const bg = g.createLinearGradient(0, sy, 0, sy + sh);
    bg.addColorStop(0, '#f3f7fc');
    bg.addColorStop(1, '#d9e4f1');
    g.fillStyle = bg;
    g.fillRect(sx, sy, sw, sh);

    // status bar
    g.fillStyle = '#ffffff';
    g.fillRect(sx, sy, sw, 46);
    g.fillStyle = '#44505f';
    g.font = 'bold 22px Arial';
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText('Home', sx + 18, sy + 24);
    g.textAlign = 'right';
    g.fillText('12:30   Ready', sx + sw - 18, sy + 24);

    // 5 x 2 icon grid
    ICONS.forEach(([name, color], i) => {
      const cx = sx + 100 + (i % 5) * 180;
      const cy = sy + 130 + Math.floor(i / 5) * 190;

      g.save();
      g.shadowColor = 'rgba(0,0,0,0.18)';
      g.shadowBlur = 10;
      g.shadowOffsetY = 4;
      g.fillStyle = color;
      roundRectPath(g, cx - 56, cy - 56, 112, 112, 22);
      g.fill();
      g.restore();

      const isWhite = color === '#ffffff';
      if (isWhite) {
        g.strokeStyle = '#c3cbd6';
        g.lineWidth = 3;
        roundRectPath(g, cx - 56, cy - 56, 112, 112, 22);
        g.stroke();
      }
      g.fillStyle = isWhite ? '#44505f' : '#ffffff';
      g.font = 'bold 54px Arial';
      g.textAlign = 'center';
      g.fillText(name[0], cx, cy + 3);
      g.fillStyle = '#2b3440';
      g.font = '22px Arial';
      g.fillText(name, cx, cy + 82);
    });

    // page dots + ready LED
    g.fillStyle = '#c9ced6';
    [w / 2 - 70, w / 2, w / 2 + 70].forEach(x => { g.beginPath(); g.arc(x, 518, 11, 0, 7); g.fill(); });
    g.fillStyle = '#3ddc84';
    g.beginPath();
    g.arc(w - 60, 518, 7, 0, 7);
    g.fill();
  }

  const width = 125 * S;
  const height = 70 * S;

  const group = new THREE.Group();
  group.position.set(X(574.5), Y(135), ZF + 3);
  group.rotation.set(-0.18, -0.1, 0);
  stack.add(group);

  const arm = shadow(new THREE.Mesh(new THREE.BoxGeometry(7, 9, 5), black));
  arm.position.set(0, -height / 2 + 2, -3.2);
  group.add(arm);

  const bezel = shadow(new THREE.Mesh(new THREE.BoxGeometry(width, height, 1.8), black));
  group.add(bezel);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: canvasTex(1000, 560, drawHomeScreen) })
  );
  face.position.z = 0.92;
  group.add(face);

  C.parts.display = group;
})(window.Cetak);
