// Power key and status LED on the touchscreen's bottom bezel, so they stay visible (and clickable) when the screen is off.
// The click is tested before the other zones (ui/picking.js) because the touchscreen zone covers the key.
// Exposes: Cetak.parts.powerButton = { hit, setLed(hex), setHover(on), press() }
(function (C) {
  const { canvasTex } = C.helpers;
  const display = C.parts.display;
  const { width, height } = display.size;

  const Z = 0.97;                 // in front of the screen face
  const PRESS_MS = 220;
  const toLocal = (px, py) => [(px - 500) / 1000 * width, (280 - py) / 560 * height];
  const [keyX, barY] = toLocal(850, 518);

  // Raised round key: light rim, darker dished face, power symbol.
  function drawKey(g) {
    const rim = g.createLinearGradient(0, 0, 0, 128);
    rim.addColorStop(0, '#f2f4f7');
    rim.addColorStop(1, '#7d838c');
    const dish = g.createLinearGradient(0, 14, 0, 114);
    dish.addColorStop(0, '#5a5f68');
    dish.addColorStop(1, '#2a2d33');
    [[rim, 62], [dish, 50]].forEach(([fill, r]) => {
      g.fillStyle = fill;
      g.beginPath();
      g.arc(64, 64, r, 0, 7);
      g.fill();
    });
    g.strokeStyle = '#ffffff';
    g.lineWidth = 9;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(64, 66, 24, -Math.PI * 0.32, Math.PI * 1.32);
    g.moveTo(64, 30);
    g.lineTo(64, 60);
    g.stroke();
  }

  const flat = (geometry, material, x, z) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, barY, z);
    display.add(m);
    return m;
  };

  const key = flat(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, drawKey) }), keyX, Z);
  const led = flat(new THREE.CircleGeometry(0.4, 16), new THREE.MeshBasicMaterial({ color: 0x3ddc84 }), toLocal(950, 518)[0], Z);

  // Glowing ring while the pointer is over the key.
  const halo = flat(new THREE.RingGeometry(0.7, 0.88, 28),
    new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.95 }), keyX, Z + 0.01);
  halo.visible = false;

  // A larger invisible target so the small key is easy to click.
  const hit = flat(new THREE.CircleGeometry(1.1, 12), new THREE.MeshBasicMaterial({ visible: false }), keyX, Z + 0.03);

  // Press animation: the key sinks in and springs back.
  let pressStart = 0;
  function animatePress(now) {
    const t = Math.min(1, (now - pressStart) / PRESS_MS);
    const dip = Math.sin(t * Math.PI);
    key.scale.setScalar(1 - 0.22 * dip);
    halo.scale.copy(key.scale);
    key.position.z = Z - 0.12 * dip;
    if (t < 1) requestAnimationFrame(animatePress);
  }

  C.parts.powerButton = {
    hit,
    setLed: hex => led.material.color.setHex(hex),
    setHover: on => { halo.visible = on; },
    press() {
      pressStart = performance.now();
      requestAnimationFrame(animatePress);
    }
  };
})(window.Cetak);
