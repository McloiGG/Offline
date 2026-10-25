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

  let message = null;   // shown over the home screen as a red alert, e.g. 'Please insert paper'

  function drawAlert(g, w) {
    const bw = 620, bh = 190, bx = (w - bw) / 2, by = 190;
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.45)';
    g.shadowBlur = 24;
    g.fillStyle = '#ffffff';
    roundRectPath(g, bx, by, bw, bh, 22);
    g.fill();
    g.restore();
    g.fillStyle = '#d93025';
    roundRectPath(g, bx, by, bw, 62, 22);
    g.fill();
    g.fillRect(bx, by + 30, bw, 32);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.font = 'bold 30px Arial';
    g.fillText('! ERROR', w / 2, by + 32);
    g.fillStyle = '#2b3440';
    let size = 40;                                   // shrink long messages until they fit inside the box
    do g.font = 'bold ' + size-- + 'px Arial'; while (g.measureText(message).width > bw - 60 && size > 14);
    g.fillText(message, w / 2, by + 125);
  }

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

    // page dots
    g.fillStyle = '#c9ced6';
    [w / 2 - 70, w / 2, w / 2 + 70].forEach(x => { g.beginPath(); g.arc(x, 518, 11, 0, 7); g.fill(); });

    if (message) drawAlert(g, w);
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

  const screenTex = canvasTex(1000, 560, drawHomeScreen);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: screenTex })
  );
  face.position.z = 0.92;
  group.add(face);

  // The texture is multiplied by the material colour, so a near-black colour switches the screen off.
  group.setPower = on => face.material.color.setHex(on ? 0xffffff : 0x050506);

  // Shows `text` as an alert over the home screen; null goes back to the plain home screen.
  group.setMessage = text => {
    if (text === message) return;
    message = text;
    drawHomeScreen(screenTex.image.getContext('2d'), 1000);
    screenTex.needsUpdate = true;
  };

  group.size = { width, height };
  C.parts.display = group;
})(window.Cetak);
