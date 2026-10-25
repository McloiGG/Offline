// The touchscreen. A canvas texture on the display, drawn immediate-mode: every button a page draws is also
// registered as a hit target, and a click's UV on the glass is matched against those targets.
(function (O) {
  const C = window.Cetak, THREEr = window.THREE;
  const disp = C.parts.display;
  const face = disp.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry');
  const W = 1000, H = 560, SX = 26, SY = 24, SW = 948, SH = 448;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const tex = new THREEr.CanvasTexture(cv); tex.anisotropy = 8;
  face.material.map = tex; face.material.needsUpdate = true;
  const rr = C.helpers.roundRectPath;

  const FAULTS = { jam: 'E-01  Paper', ink: 'E-02  Ink', offline: 'E-03  Offline', heat: 'E-04  Heat' };
  const S = O.screen = {
    W, H, SX, SY, SW, SH, g, page: 'home', fault: null, frozen: false, net: true, powered: true,
    hot: [], hover: -1, t: 0, dirty: true, overlay: null, booting: null, diag: null, pages: {},
    info: () => ({}), onAction: () => {}, onPress: () => {}, shake: 0
  };
  S.face = face;
  S.locked = () => !!(S.overlay || S.booting || S.diag || S.frozen || !S.powered);
  S.go = p => { S.page = p; S.hover = -1; S.dirty = true; };
  S.redraw = () => { S.dirty = true; };
  S.setFault = f => { S.fault = f; S.dirty = true; };
  S.flash = (text, kind, ms) => { S.overlay = { text, kind, left: ms / 1000 }; S.dirty = true; };
  S.boot = (ms, then) => { S.booting = { t: 0, len: ms / 1000, then }; S.page = 'home'; S.dirty = true; };
  S.startDiag = ms => { S.diag = { t: 0, len: ms / 1000 }; S.page = 'diag'; S.dirty = true; };
  S.freeze = on => { S.frozen = on; S.dirty = true; };
  const sp = disp.setPower;
  disp.setPower = on => { S.powered = on; sp(on); S.dirty = true; };
  // DANN's offline / Wi-Fi screens paint on a canvas of the same size: take his painter and draw it on ours instead.
  // The Network page draws it (see pages.js), so the Home button and the status bar stay reachable while it is up.
  S.custom = null;
  disp.setScreen = painter => { S.custom = painter; S.dirty = true; };
  const wifiUp = () => !!S.custom && S.page === 'net';

  function text(s, x, y, size, color, align, weight) {
    g.fillStyle = color; g.font = (weight || 'bold') + ' ' + size + 'px Arial'; g.textAlign = align || 'left'; g.textBaseline = 'middle';
    g.fillText(s, x, y);
  }
  function box(x, y, w, h, r, fill, stroke) {
    rr(g, x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 3; g.stroke(); }
  }
  function button(x, y, w, h, label, fn, o) {
    o = o || {};
    const idx = o.off ? -1 : S.hot.length;
    if (!o.off) S.hot.push({ x, y, w, h, fn });
    const hov = idx >= 0 && S.hover === idx;
    g.save(); g.shadowColor = 'rgba(0,0,0,.22)'; g.shadowBlur = hov ? 14 : 8; g.shadowOffsetY = 3;
    box(x, y, w, h, o.r || 14, o.off ? '#c4cad2' : (o.color || '#2f80ed'));
    g.restore();
    if (hov) box(x, y, w, h, o.r || 14, 'rgba(255,255,255,.22)');
    text(label, x + w / 2, y + h / 2 + 1, o.size || 26, o.off ? '#8a929c' : (o.fg || '#fff'), 'center');
  }
  function hotspot(x, y, w, h, fn) {
    const idx = S.hot.length; S.hot.push({ x, y, w, h, fn });
    if (S.hover === idx) box(x, y, w, h, 10, 'rgba(47,128,237,.14)');
  }
  function card(title) {
    box(50, 86, 900, 312, 18, '#fff', '#d5dde8');
    text(title, 76, 120, 32, '#2b3440');
  }
  function homeBtn() { button(50, 412, 170, 48, '< Home', () => S.go('home'), { color: '#7b8794', size: 24 }); }
  function bar(x, y, w, h, v, color) {
    box(x, y, w, h, h / 2, '#e3e8ee'); if (v > 0.001) box(x, y, Math.max(h, w * v), h, h / 2, color);
  }
  function wifi(cx, cy, ok) {
    g.strokeStyle = ok ? '#2f80ed' : '#a7afb9'; g.fillStyle = g.strokeStyle; g.lineWidth = 4; g.lineCap = 'round';
    [10, 18, 26].forEach(r => { g.beginPath(); g.arc(cx, cy + 12, r, -2.35, -0.8); g.stroke(); });
    g.beginPath(); g.arc(cx, cy + 12, 3.2, 0, 7); g.fill();
    if (!ok) { g.strokeStyle = '#d9473a'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 20, cy - 12); g.lineTo(cx + 20, cy + 18); g.stroke(); }
  }
  function spinner(cx, cy, r, color) {
    g.strokeStyle = color; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy, r, S.t * 6, S.t * 6 + 4.4); g.stroke();
  }
  S.draw = { text, box, button, hotspot, card, homeBtn, bar, wifi, spinner };

  function statusBar() {
    g.fillStyle = '#fff'; g.fillRect(SX, SY, SW, 46);
    const pg = S.pages[S.page];
    text(S.page === 'home' ? 'Home' : ((pg && pg.title) || ''), SX + 18, SY + 24, 22, '#44505f');
    hotspot(SX + SW - 300, SY, 64, 46, () => S.go('net'));
    wifi(SX + SW - 268, SY + 22, S.net);
    const f = S.frozen ? 'Not responding' : (S.fault ? FAULTS[S.fault] : '12:30   Ready');
    text(f, SX + SW - 18, SY + 24, 22, S.fault || S.frozen ? '#d9473a' : '#44505f', 'right');
    // temperature light: red while overheating, then amber, then green as it winds down
    const hot = O.world ? O.world.temp : 0.3;
    g.fillStyle = hot > 0.8 ? '#d9473a' : hot > 0.5 ? '#e0a030' : '#3ddc84';
    g.beginPath(); g.arc(SX + SW - 226, SY + 24, 8, 0, 7); g.fill();
  }

  function overlay() {
    const o = S.overlay, cx = W / 2, cy = 240;
    g.fillStyle = 'rgba(244,247,252,.82)'; g.fillRect(SX, SY + 46, SW, SH - 46);
    const col = { ok: '#2fb24a', bad: '#d9473a', warn: '#e0a030' }[o.kind] || '#2f80ed';
    g.fillStyle = col; g.beginPath(); g.arc(cx, cy - 20, 62, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    if (o.kind === 'ok') { g.moveTo(cx - 28, cy - 18); g.lineTo(cx - 6, cy + 4); g.lineTo(cx + 32, cy - 44); }
    else if (o.kind === 'bad') { g.moveTo(cx - 26, cy - 46); g.lineTo(cx + 26, cy + 6); g.moveTo(cx + 26, cy - 46); g.lineTo(cx - 26, cy + 6); }
    else { g.moveTo(cx, cy - 56); g.lineTo(cx, cy - 18); g.moveTo(cx, cy + 2); g.lineTo(cx, cy + 4); }
    g.stroke();
    text(o.text, cx, cy + 90, 34, '#2b3440', 'center');
  }
  function bootScreen() {
    const b = S.booting, p = Math.min(1, b.t / b.len);
    g.fillStyle = '#0a0a0c'; rr(g, 0, 0, W, H, 34); g.fill();
    g.fillStyle = '#12161c'; g.fillRect(SX, SY, SW, SH);
    text('OFFLINE', W / 2, 220, 74, '#e8edf3', 'center'); text('A working printer', W / 2, 282, 22, '#6d7886', 'center', 'normal');
    box(300, 340, 400, 12, 6, '#2a313b'); box(300, 340, Math.max(12, 400 * p), 12, 6, '#5ad07a');
    text(p < 0.6 ? 'Starting up...' : 'Checking network...', W / 2, 384, 20, '#6d7886', 'center', 'normal');
  }
  function frozenScreen() {
    g.fillStyle = 'rgba(40,46,56,.78)'; g.fillRect(SX, SY + 46, SW, SH - 46);
    spinner(W / 2, 214, 36, '#f4f0e5');
    text('Printer not responding', W / 2, 292, 34, '#f4f0e5', 'center'); text('Connecting...', W / 2, 336, 22, '#b9c1cc', 'center', 'normal');
  }

  function render() {
    S.hot.length = 0;
    frame();
    if (S.booting) { bootScreen(); tex.needsUpdate = true; return; }
    if (S.pages[S.page]) S.pages[S.page](S);
    statusBar();
    if (S.frozen) frozenScreen();
    if (S.overlay) overlay();
    tex.needsUpdate = true;
  }
  function frame() {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#0a0a0c'; rr(g, 0, 0, W, H, 34); g.fill();
    const bg = g.createLinearGradient(0, SY, 0, SY + SH); bg.addColorStop(0, '#f3f7fc'); bg.addColorStop(1, '#d9e4f1');
    g.fillStyle = bg; g.fillRect(SX, SY, SW, SH);
  }

  S.update = dt => {
    S.t += dt;
    let live = S.frozen;
    if (S.overlay) { live = true; S.overlay.left -= dt; if (S.overlay.left <= 0) S.overlay = null; }
    if (S.booting) { live = true; S.booting.t += dt; if (S.booting.t >= S.booting.len) { const f = S.booting.then; S.booting = null; if (f) f(); } }
    if (S.diag) { live = true; S.diag.t += dt; if (S.diag.t >= S.diag.len) { const f = S.diag; S.diag = null; S.onAction('diag-done', f); } }
    if (S.page === 'diag' || S.page === 'job' || wifiUp()) live = true;
    if (live || S.dirty) { S.dirty = false; render(); }
  };

  // ---- pointer: UV on the glass -> canvas pixel -> button ----
  const rc = new THREEr.Raycaster(), ndc = new THREEr.Vector2();
  function uvAt(e) {
    const r = C.scene.renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rc.setFromCamera(ndc, C.scene.camera);
    const h = rc.intersectObject(face, false)[0];
    return h ? { x: h.uv.x * W, y: (1 - h.uv.y) * H } : null;
  }
  const inside = (b, p) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  S.press = hit => {
    if (S.locked()) { S.shake = 0.25; return; }
    const p = { x: hit.uv.x * W, y: (1 - hit.uv.y) * H };
    const b = S.hot.find(h => inside(h, p));
    if (b) { S.onPress(); b.fn(); S.dirty = true; }
    else if (wifiUp()) C.parts.wifi.tap(p.x, p.y);
  };
  addEventListener('pointermove', e => {
    if (!O.pick || !O.pick.enabled || O.pick.view() !== 's3' || S.locked()) { if (S.hover !== -1) { S.hover = -1; S.dirty = true; } return; }
    const p = uvAt(e);
    const i = p ? S.hot.findIndex(h => inside(h, p)) : -1;
    if (i !== S.hover) { S.hover = i; S.dirty = true; }
  });
  S.addPage = (name, title, fn) => { fn.title = title; S.pages[name] = fn; S.dirty = true; };
})(window.Offline);
