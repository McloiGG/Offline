/* OFFLINE - Three.js scene: office, rotatable printer, coworker billboard, effects. */
(function (global) {
  'use strict';
  var T = global.THREE;

  function mat(color, rough, metal, extra) {
    var o = { color: color, roughness: rough == null ? 0.7 : rough, metalness: metal || 0 };
    if (extra) for (var k in extra) o[k] = extra[k];
    return new T.MeshStandardMaterial(o);
  }
  function box(w, h, d, m, x, y, z, parent, shadow) {
    var mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    if (shadow !== false) { mesh.castShadow = true; mesh.receiveShadow = true; }
    if (parent) parent.add(mesh);
    return mesh;
  }
  function canvasTex(w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return { canvas: c, ctx: c.getContext('2d'), tex: t };
  }
  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  var MODES = {
    idle:      { light: 0x4fd17a, blink: 0,   screen: 'normal' },
    jam:       { light: 0xd9473a, blink: 1.6, screen: 'jam',     jam: true, tray: true },
    ink:       { light: 0xe0a030, blink: 1.2, screen: 'ink',     ink: true },
    offline:   { light: 0x555a60, blink: 0,   screen: 'offline', wifiBtn: true },
    heat:      { light: 0xd9473a, blink: 3.2, screen: 'heat',    vents: true, shimmer: true },
    cable5:    { light: 0xd9473a, blink: 1.4, screen: 'error' },
    unplugged: { light: 0x333638, blink: 0,   screen: 'black',   dim: true },
    booting:   { light: 0x4fd17a, blink: 1.2, screen: 'boot' },
    heatcool:  { light: 0xe0b030, blink: 0,   screen: 'normal' }
  };

  function Scene(canvas) {
    var self = this;
    this.canvas = canvas;
    this.time = 0;
    this.severity = 0;
    this.fake = false;
    this.hover = null;
    this.mode = 'idle';
    this.shake = 0;
    this.bootT = 0;
    this.cablePlug = 1;
    this.cableTarget = 1;
    this.rotTarget = 0;
    this.spawnAcc = 0;
    this.pickables = [];

    var r = this.renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.72;

    var scene = this.scene = new T.Scene();
    scene.background = new T.Color(0xd9d4c8);
    scene.fog = new T.Fog(0xd9d4c8, 12, 26);

    this.camera = new T.PerspectiveCamera(38, 16 / 9, 0.1, 60);
    this.rigs = {
      menu: { pos: new T.Vector3(0.4, 2.3, 9.2), look: new T.Vector3(0.3, 1.1, 0) },
      play: { pos: new T.Vector3(0, 1.55, 3.5), look: new T.Vector3(0, 0.82, -0.5) },
      end:  { pos: new T.Vector3(0.1, 1.8, 5.4), look: new T.Vector3(0, 0.95, -0.5) }
    };
    this.camPos = this.rigs.menu.pos.clone();
    this.camLook = this.rigs.menu.look.clone();
    this.camAnim = null;
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    scene.add(new T.HemisphereLight(0xfff4e0, 0x9a948a, 0.75));
    var sun = new T.DirectionalLight(0xfff0d6, 2.1);
    sun.position.set(-6, 7, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -3;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 24;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    this.glow = glowTex();
    this.buildRoom();
    this.buildPlayerDesk();
    this.buildCoworker();
    this.buildPrinter();
    this.buildCable();
    this.buildFx();
    this.setMode('idle');
    this.setCoworker('neutral');
    this.resize();
    global.addEventListener('resize', function () { self.resize(); });
  }

  var P = Scene.prototype;

  P.resize = function () {
    var w = global.innerWidth, h = global.innerHeight;
    this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1.4 ? 46 : 38;
    this.camera.updateProjectionMatrix();
  };

  P.pickable = function (obj, name) { obj.userData.pick = name; this.pickables.push(obj); };

  P.buildRoom = function () {
    var s = this.scene;
    var floor = new T.Mesh(new T.PlaneGeometry(30, 20), mat(0x8e9096, 0.9));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
    var wall = mat(0xd8cdb6, 0.95);
    box(30, 6, 0.2, wall, 0, 3, -4.2, s);
    var left = box(0.2, 6, 20, wall, -7.5, 3, 4, s);
    box(30, 0.18, 0.12, mat(0xb9ad94, 0.8), 0, 0.09, -4.08, s, false);
    // window on the left wall
    var wf = new T.Group(); wf.position.set(-7.38, 2.9, -0.6); s.add(wf);
    var glass = new T.Mesh(new T.PlaneGeometry(3.4, 2.4), new T.MeshBasicMaterial({ color: 0xfff6dc }));
    glass.rotation.y = Math.PI / 2; wf.add(glass);
    var fm = mat(0xf2eee4, 0.6);
    box(0.12, 2.6, 0.12, fm, 0, 0, -1.75, wf, false); box(0.12, 2.6, 0.12, fm, 0, 0, 1.75, wf, false);
    box(0.12, 0.12, 3.6, fm, 0, 1.25, 0, wf, false); box(0.12, 0.12, 3.6, fm, 0, -1.25, 0, wf, false);
    box(0.1, 2.4, 0.08, fm, 0, 0, 0, wf, false);
    var wl = new T.PointLight(0xfff0d0, 12, 14, 1.6); wl.position.set(-6.2, 3, -0.6); s.add(wl);
    // back wall outlet
    this.outlet = new T.Vector3(1.9, 0.45, -4.02);
    box(0.22, 0.3, 0.05, mat(0xf4f1ea, 0.6), this.outlet.x, this.outlet.y, -4.08, s, false);
    // wall poster for atmosphere
    box(1.1, 0.8, 0.03, mat(0xece7da, 0.9), -1.6, 3.4, -4.08, s, false);
    box(0.9, 0.12, 0.04, mat(0x9aa7b0, 0.9), -1.6, 3.6, -4.06, s, false);
  };

  P.buildPlayerDesk = function () {
    var s = this.scene, wood = mat(0x8a6a48, 0.65);
    box(8, 0.12, 2.2, wood, 0, 0.9, 4.4, s);
    box(0.14, 0.9, 2.0, wood, -3.8, 0.45, 4.4, s); box(0.14, 0.9, 2.0, wood, 3.8, 0.45, 4.4, s);
    box(0.5, 0.025, 0.7, mat(0xf2efe6, 0.9), -2.6, 0.97, 4.2, s).rotation.y = 0.25;
    var cup = new T.Mesh(new T.CylinderGeometry(0.12, 0.1, 0.2, 20), mat(0xeeeae0, 0.4));
    cup.position.set(3.0, 1.08, 4.0); cup.castShadow = true; s.add(cup);

    // side table with the desk clock, beside the printer
    var tg = new T.Group(); tg.position.set(1.45, 0, 0.75); s.add(tg);
    box(0.8, 0.06, 0.7, wood, 0, 0.75, 0, tg);
    [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]].forEach(function (p) { box(0.05, 0.75, 0.05, wood, p[0], 0.375, p[1], tg); });
    var cm = this.clockTex = canvasTex(256, 256);
    box(0.36, 0.36, 0.09, mat(0x34373d, 0.5), 0, 0.96, 0, tg);
    var face = new T.Mesh(new T.CircleGeometry(0.15, 40), new T.MeshBasicMaterial({ map: cm.tex, toneMapped: false }));
    face.position.set(0, 0.96, 0.048); tg.add(face);
    box(0.2, 0.025, 0.12, mat(0x34373d, 0.5), 0, 0.79, 0.03, tg);
    this.clockKey = '';
    this.setClock(60, 1, false, false);
  };

  P.buildCoworker = function () {
    var s = this.scene, g = this.coworkerGroup = new T.Group();
    g.position.set(-2.6, 0, -1.6); s.add(g);
    var wood = mat(0x8a6a48, 0.65), dark = mat(0x3c4048, 0.6);
    box(2.2, 0.1, 1.1, wood, 0, 0.78, 0, g);
    box(0.1, 0.78, 1.0, wood, -1.0, 0.39, 0, g); box(0.1, 0.78, 1.0, wood, 1.0, 0.39, 0, g);
    box(2.1, 0.5, 0.06, wood, 0, 0.5, 0.45, g);
    // monitor, seen from behind-ish
    box(0.86, 0.5, 0.05, dark, 0.45, 1.26, -0.15, g);
    box(0.08, 0.26, 0.08, dark, 0.45, 0.99, -0.15, g);
    box(0.5, 0.03, 0.26, dark, 0.45, 0.86, -0.15, g);
    // chair
    box(0.62, 0.08, 0.6, mat(0x464b55, 0.8), -0.3, 0.52, 0.85, g);
    box(0.6, 0.62, 0.08, mat(0x464b55, 0.8), -0.3, 0.9, 1.15, g);
    // notebook on desk
    box(0.3, 0.025, 0.4, mat(0x5a6070, 0.8), -0.75, 0.84, 0.15, g, false);
    this.cwTex = canvasTex(512, 512);
  };

  P.setCoworker = function (expr) {
    this.cwExpr = expr;
    var g = this.cwTex.ctx, W = 512, H = 512;
    g.clearRect(0, 0, W, H);
    var fur = '#c8a878', shade = '#a98a5c', shirt = '#e8e4f0';
    var dy = expr === 'nod' ? 22 : (expr === 'notebook' ? 30 : (expr === 'lean' ? 16 : 0));
    var dx = expr === 'glance' ? 10 : 0;
    // shoulders / shirt
    var sg = g.createLinearGradient(0, 360, 0, 512);
    sg.addColorStop(0, '#f7f5fc'); sg.addColorStop(1, '#c7c2d6');
    g.fillStyle = sg; g.beginPath(); g.moveTo(70, 512); g.quadraticCurveTo(80, 380 + dy * 0.4, 256 + dx, 366 + dy * 0.4);
    g.quadraticCurveTo(440, 380 + dy * 0.4, 450, 512); g.closePath(); g.fill();
    g.strokeStyle = '#c7c2d6'; g.lineWidth = 3; g.stroke();
    // collar + lanyard
    g.fillStyle = '#f4f2fa'; g.beginPath(); g.moveTo(216 + dx, 366 + dy * 0.4); g.lineTo(256 + dx, 410 + dy * 0.4); g.lineTo(226 + dx, 436 + dy * 0.4); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(296 + dx, 366 + dy * 0.4); g.lineTo(256 + dx, 410 + dy * 0.4); g.lineTo(286 + dx, 436 + dy * 0.4); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#e05050'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(222 + dx, 380 + dy * 0.4); g.lineTo(250 + dx, 480); g.moveTo(290 + dx, 380 + dy * 0.4); g.lineTo(262 + dx, 480); g.stroke();
    g.fillStyle = '#f0eedc'; g.fillRect(238 + dx, 478, 36, 34);
    // neck + head
    var hx = 256 + dx, hy = 250 + dy;
    g.fillStyle = fur; g.fillRect(hx - 28, hy + 40, 56, 90);
    // ears
    function ear(sx) {
      g.fillStyle = fur; g.strokeStyle = shade; g.lineWidth = 3;
      g.beginPath(); g.moveTo(hx + sx * 78, hy - 40); g.quadraticCurveTo(hx + sx * 92, hy - 110, hx + sx * 62, hy - 130);
      g.quadraticCurveTo(hx + sx * 46, hy - 128, hx + sx * 34, hy - 100); g.lineTo(hx + sx * 20, hy - 66); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#d9a89a'; g.beginPath(); g.moveTo(hx + sx * 66, hy - 52); g.quadraticCurveTo(hx + sx * 76, hy - 100, hx + sx * 60, hy - 112);
      g.lineTo(hx + sx * 38, hy - 78); g.closePath(); g.fill();
    }
    ear(-1); ear(1);
    var hg = g.createLinearGradient(hx - 90, hy - 80, hx + 90, hy + 80);
    hg.addColorStop(0, '#dcc59c'); hg.addColorStop(0.5, fur); hg.addColorStop(1, shade);
    g.fillStyle = hg; g.strokeStyle = shade; g.lineWidth = 3;
    g.beginPath(); g.ellipse(hx, hy, 92, 82, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#e8d6b4'; g.beginPath(); g.ellipse(hx, hy + 52, 34, 22, 0, 0, Math.PI * 2); g.fill();
    // eyes
    var look = expr === 'eye' ? 0 : (expr === 'glance' ? 7 : (expr === 'notebook' ? 0 : -3));
    var lookY = (expr === 'notebook' || expr === 'nod') ? 6 : 0;
    var half = (expr === 'hm') ? 0.5 : (expr === 'nod' ? 0.45 : 0.7);
    [-1, 1].forEach(function (sx) {
      var ex = hx + sx * 42;
      g.fillStyle = '#f6f2e4'; g.strokeStyle = '#5a4630'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(ex, hy + 2, 24, 22 * half + 4, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#d6c35a'; g.beginPath(); g.ellipse(ex + look, hy + 3 + lookY, 14, 16 * half + 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a1418'; g.beginPath(); g.ellipse(ex + look, hy + 3 + lookY, 3, 14 * half + 2, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5a4630'; g.lineWidth = 5; g.beginPath();
      g.moveTo(ex - 24, hy - 4 + (expr === 'hm' ? 4 : 0)); g.lineTo(ex + 24, hy - 4 - (expr === 'hm' && sx > 0 ? 8 : 0)); g.stroke();
    });
    // nose + mouth
    g.fillStyle = '#c47a7a'; g.beginPath(); g.moveTo(hx - 9, hy + 36); g.lineTo(hx + 9, hy + 36); g.lineTo(hx, hy + 47); g.closePath(); g.fill();
    g.strokeStyle = '#5a4630'; g.lineWidth = 3; g.beginPath();
    if (expr === 'hm') { g.moveTo(hx - 12, hy + 62); g.lineTo(hx + 12, hy + 62); }
    else { g.moveTo(hx, hy + 47); g.lineTo(hx, hy + 54); g.moveTo(hx - 14, hy + 58); g.quadraticCurveTo(hx - 6, hy + 66, hx, hy + 54); g.quadraticCurveTo(hx + 6, hy + 66, hx + 14, hy + 58); }
    g.stroke();
    // whiskers
    g.strokeStyle = '#8a7550'; g.lineWidth = 1.6; g.beginPath();
    [-1, 1].forEach(function (sx) { for (var i = -1; i <= 1; i++) { g.moveTo(hx + sx * 30, hy + 52 + i * 4); g.lineTo(hx + sx * 84, hy + 48 + i * 12); } });
    g.stroke();
    // glasses
    g.strokeStyle = '#2a2030'; g.lineWidth = 8; g.fillStyle = 'rgba(207,224,234,0.18)';
    [-1, 1].forEach(function (sx) { rr(g, hx + (sx < 0 ? -84 : 10), hy - 30, 74, 62, 20); g.fill(); g.stroke(); });
    g.lineWidth = 6; g.beginPath(); g.moveTo(hx - 10, hy - 2); g.quadraticCurveTo(hx, hy - 10, hx + 10, hy - 2); g.stroke();
    // notebook + pen
    if (expr === 'notebook') {
      g.fillStyle = '#5a6070'; g.save(); g.translate(hx - 140, 440); g.rotate(-0.15);
      g.fillRect(-60, -40, 120, 150); g.fillStyle = '#f2efe4'; g.fillRect(-52, -32, 104, 134); g.restore();
      g.fillStyle = shirt; g.fillRect(hx - 190, 488, 60, 24);
      g.strokeStyle = '#2a2030'; g.lineWidth = 5; g.beginPath(); g.moveTo(hx - 120, 470); g.lineTo(hx - 150, 500); g.stroke();
    }
    this.cwTex.tex.needsUpdate = true;
  };

  P.buildPrinter = function () {
    var s = this.scene;
    var pivot = this.printer = new T.Group();
    pivot.position.set(0, 0, -0.5);
    s.add(pivot);
    var body = mat(0xece8df, 0.55), side = mat(0xd9d4c8, 0.6), trayM = mat(0xf3f0e8, 0.5), dark = mat(0x2b2e33, 0.5, 0.3);
    this.printerMats = [body, side, trayM];

    box(1.7, 1.0, 1.15, body, 0, 0.62, 0, pivot);
    box(1.74, 0.16, 1.2, mat(0x66696f, 0.7), 0, 0.2, 0, pivot);
    // wheels
    var wm = mat(0x3a3d42, 0.6);
    [[-0.72, -0.45], [0.72, -0.45], [-0.72, 0.45], [0.72, 0.45]].forEach(function (p) {
      var w = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.05, 14), wm);
      w.rotation.z = Math.PI / 2; w.position.set(p[0], 0.07, p[1]); w.castShadow = true; pivot.add(w);
    });
    // feeder
    box(1.6, 0.14, 1.0, mat(0xf6f4ee, 0.5), 0, 1.19, 0, pivot);
    box(1.52, 0.1, 0.9, mat(0xe9e5dc, 0.5), 0, 1.3, -0.02, pivot);
    box(0.34, 0.03, 0.06, dark, 0, 1.35, 0.32, pivot, false);
    // trays (front is +z)
    this.trays = [];
    for (var i = 0; i < 3; i++) {
      var t = new T.Group(); t.position.set(0, 0.28 + i * 0.205, 0.58); pivot.add(t);
      box(1.46, 0.18, 0.06, trayM, 0, 0, 0, t);
      box(0.4, 0.045, 0.05, dark, 0, 0, 0.035, t, false);
      this.trays.push(t);
    }
    this.trayTopHome = this.trays[2].position.z;
    this.trays[2].position.y = 0.28 + 2 * 0.205;
    // output slot + jam sheet
    box(1.1, 0.04, 0.05, dark, -0.1, 0.99, 0.58, pivot, false);
    var jam = this.jam = new T.Group(); jam.position.set(-0.1, 1.0, 0.62); pivot.add(jam);
    var jm = mat(0xf4f0e5, 0.9, 0, { side: T.DoubleSide });
    var j1 = box(0.8, 0.02, 0.34, jm, 0, 0, 0.12, jam); j1.rotation.x = -0.35;
    var j2 = box(0.35, 0.02, 0.28, jm, 0.25, 0.03, 0.2, jam); j2.rotation.set(-0.15, 0.4, 0.5);
    var j3 = box(0.28, 0.02, 0.22, jm, -0.25, 0.04, 0.18, jam); j3.rotation.set(-0.5, -0.5, -0.4);
    jam.visible = false;
    // ink window on the front
    box(0.9, 0.34, 0.03, dark, -0.28, 0.99 - 0.0, 0.585, pivot, false).position.y = 0.88;
    var cols = [0x1b1c1f, 0xe9c33c, 0xd2417e, 0x2f9ccd];
    this.carts = cols.map(function (c, k) {
      var m = mat(c, 0.4, 0, { transparent: true });
      var b = box(0.17, 0.22, 0.04, m, -0.28 - 0.33 + k * 0.22, 0.88, 0.6, pivot, false);
      return b;
    });
    this.cartY = this.carts[1];
    // touchscreen arm + panel (upper right of the front)
    var arm = new T.Group(); arm.position.set(0.5, 1.12, 0.35); pivot.add(arm);
    box(0.08, 0.18, 0.08, dark, 0, 0.03, 0, arm);
    var panel = new T.Group(); panel.position.set(0, 0.18, 0.04); panel.rotation.x = -0.45; arm.add(panel);
    box(0.62, 0.42, 0.05, mat(0x2d3036, 0.4), 0, 0, 0, panel);
    var st = this.screenTex = canvasTex(256, 168);
    var scr = this.screen = new T.Mesh(new T.PlaneGeometry(0.56, 0.36), new T.MeshBasicMaterial({ map: st.tex, toneMapped: false }));
    scr.position.z = 0.03; panel.add(scr);
    this.screenPanel = panel;
    // click targets for each state's error
    var hm = new T.MeshBasicMaterial({ visible: false });
    box(1.1, 0.2, 0.2, hm, -0.1, 1.07, 0.62, pivot, false);
    box(1.0, 0.26, 0.2, hm, -0.28, 0.84, 0.7, pivot, false);
    this.pickable(pivot.children[pivot.children.length - 2], 'jam');
    this.pickable(pivot.children[pivot.children.length - 1], 'ink');
    this.wifiMat = new T.MeshStandardMaterial({ color: 0x2a2d32, emissive: 0x4fd17a, emissiveIntensity: 0 });
    var wd = new T.Mesh(new T.SphereGeometry(0.05, 14, 10), this.wifiMat);
    wd.position.set(-0.55, 0.55, -0.6); pivot.add(wd);
    var wr = new T.Mesh(new T.TorusGeometry(0.09, 0.012, 6, 20, Math.PI), new T.MeshStandardMaterial({ color: 0x8a8d94 }));
    wr.position.set(-0.55, 0.55, -0.595); wr.rotation.z = Math.PI * 0.5 * 1; wr.rotation.z = 0; pivot.add(wr);
    var wh = box(0.3, 0.3, 0.15, hm, -0.55, 0.55, -0.66, pivot, false); this.pickable(wh, 'wifidot');

    // printed page
    var pg = this.pageMesh = new T.Mesh(new T.BoxGeometry(0.5, 0.012, 0.66), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
    pg.position.set(0, 1.015, 0.7); pg.rotation.x = -0.18; pg.visible = false; pivot.add(pg);
    var ph = box(0.7, 0.3, 0.8, hm, 0, 1.05, 0.72, pivot, false); this.pickable(ph, 'page');
    this.pageHit = ph;
    // status light
    var sm = this.lightMat = new T.MeshStandardMaterial({ color: 0x222222, emissive: 0x4fd17a, emissiveIntensity: 1.2 });
    var lamp = this.lamp = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), sm);
    lamp.position.set(0.14, 1.115, 0.5); pivot.add(lamp);
    this.lampGlow = new T.Sprite(new T.SpriteMaterial({ map: this.glow, color: 0x4fd17a, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    this.lampGlow.scale.set(0.3, 0.3, 1); lamp.add(this.lampGlow);
    // vents on the +x side and back grid
    this.vents = [];
    for (var v = 0; v < 3; v++) {
      var vm = mat(0x9a958a, 0.8, 0, { emissive: 0x000000 });
      var vb = box(0.02, 0.035, 0.6, vm, 0.86, 0.62 + v * 0.09, 0.05, pivot, false);
      this.vents.push(vb);
    }
    var gridM = mat(0x2a2d32, 0.6);
    for (var gx = 0; gx < 8; gx++) for (var gy = 0; gy < 4; gy++) box(0.1, 0.05, 0.02, gridM, -0.6 + gx * 0.14, 0.78 + gy * 0.1, -0.585, pivot, false);
    // cable port on the back, lower left as seen from behind (+x)
    var portG = this.portPos = new T.Object3D(); portG.position.set(0.55, 0.38, -0.58); pivot.add(portG);
    box(0.24, 0.18, 0.03, mat(0xb9bdc4, 0.5), 0.55, 0.38, -0.585, pivot, false);
    this.portHollow = box(0.17, 0.11, 0.04, mat(0x000000, 1), 0.55, 0.38, -0.595, pivot, false);
    this.pickable(this.portHollow, 'port');
    this.portHit = box(0.4, 0.3, 0.2, new T.MeshBasicMaterial({ visible: false }), 0.55, 0.38, -0.66, pivot, false);
    this.pickable(this.portHit, 'port');
    // whole-body pick volume
    var bodyHit = box(1.8, 1.5, 1.3, new T.MeshBasicMaterial({ visible: false }), 0, 0.75, 0, pivot, false);
    this.pickable(bodyHit, 'printer');
  };

  P.buildCable = function () {
    this.cableMat = mat(0x34373d, 0.5, 0.1, { emissive: 0x000000 });
    this.cableMesh = new T.Mesh(new T.BufferGeometry(), this.cableMat);
    this.cableMesh.castShadow = true;
    this.scene.add(this.cableMesh);
    this.cableHit = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ visible: false }));
    this.cableHit.visible = false;
    this.scene.add(this.cableHit);
    this.pickable(this.cableHit, 'cable');
    this.connector = new T.Group();
    box(0.1, 0.075, 0.13, mat(0x2c2e33, 0.45), 0, 0, 0, this.connector);
    box(0.045, 0.012, 0.05, mat(0xb9bdc4, 0.3, 0.8), -0.02, 0, 0.09, this.connector, false);
    box(0.045, 0.012, 0.05, mat(0xb9bdc4, 0.3, 0.8), 0.02, 0, 0.09, this.connector, false);
    this.scene.add(this.connector);
    var cHit = new T.Mesh(new T.BoxGeometry(0.34, 0.28, 0.4), new T.MeshBasicMaterial({ visible: false }));
    this.connector.add(cHit); this.pickable(cHit, 'cable');
    this.cableDirty = true;
    this.updateCable(true);
  };

  P.updateCable = function (force) {
    if (!force && !this.cableDirty && Math.abs(this.cablePlug - this.cableTarget) < 0.001) return;
    this.cablePlug += (this.cableTarget - this.cablePlug) * (force ? 1 : 0.18);
    if (Math.abs(this.cablePlug - this.cableTarget) < 0.005) this.cablePlug = this.cableTarget;
    this.cableDirty = false;
    var p = this.cablePlug;
    this.printer.updateMatrixWorld(true);
    var port = new T.Vector3(); this.portPos.getWorldPosition(port);
    var nrm = new T.Vector3(0, 0, -1).applyQuaternion(this.printer.quaternion);
    var side = new T.Vector3(-nrm.z, 0, nrm.x);
    var hang = port.clone().add(nrm.clone().multiplyScalar(0.38)).add(side.clone().multiplyScalar(0.12));
    hang.y = 0.045;
    var plugged = port.clone().add(nrm.clone().multiplyScalar(0.07));
    var conn = hang.clone().lerp(plugged, p);
    conn.y = hang.y + (plugged.y - hang.y) * p * p;
    var out = conn.clone().add(nrm.clone().multiplyScalar(0.22 * p));
    out.y = Math.max(0.04, conn.y - 0.12 * p);
    var end = this.outlet.clone(); end.y = 0.04;
    var m1 = out.clone().lerp(end, 0.38); m1.y = 0.035; m1.x += 0.45;
    var m2 = out.clone().lerp(end, 0.72); m2.y = 0.035; m2.x -= 0.2;
    var up = this.outlet.clone(); up.z += 0.1; up.y = 0.38;
    var curve = new T.CatmullRomCurve3([conn, out, m1, m2, end, up], false, 'catmullrom', 0.5);
    this.cableMesh.geometry.dispose(); this.cableHit.geometry.dispose();
    this.cableMesh.geometry = new T.TubeGeometry(curve, 56, 0.024, 8, false);
    this.cableHit.geometry = new T.TubeGeometry(curve, 28, 0.11, 6, false);
    this.connector.position.copy(conn);
    this.connector.lookAt(conn.clone().add(nrm));
    if (p < 0.99) this.connector.rotation.x += (1 - p) * 0.5;
    this.portHollow.visible = p < 0.6;
  };

  P.buildFx = function () {
    var s = this.scene;
    this.smoke = [];
    var sm = new T.SpriteMaterial({ map: this.glow, color: 0x888b92, transparent: true, depthWrite: false, opacity: 0.0 });
    for (var i = 0; i < 28; i++) {
      var sp = new T.Sprite(sm.clone()); sp.visible = false; sp.userData.life = 0; s.add(sp); this.smoke.push(sp);
    }
    this.shim = [];
    for (var k = 0; k < 7; k++) {
      var h = new T.Sprite(new T.SpriteMaterial({ map: this.glow, color: 0xffd9a8, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
      h.userData.phase = k * 0.9; s.add(h); this.shim.push(h);
    }
    this.shimmerOn = false; this.shimmerLevel = 0;
    this.ventFx = 0;
    this.checkSprite = null;
  };

  P.drawScreen = function (key) {
    var g = this.screenTex.ctx, W = 256, H = 168;
    g.clearRect(0, 0, W, H);
    function bg(c) { g.fillStyle = c; g.fillRect(0, 0, W, H); }
    function txt(t, x, y, size, color, align) { g.fillStyle = color; g.font = '700 ' + size + 'px "Segoe UI", Arial, sans-serif'; g.textAlign = align || 'left'; g.fillText(t, x, y); }
    var grad;
    if (key === 'black') { bg('#000'); }
    else if (key === 'offline') {
      bg('#0b0d10');
      g.strokeStyle = '#aab2ba'; g.lineWidth = 7; g.lineCap = 'round'; g.fillStyle = '#aab2ba';
      [[46, 18], [30, 12], [15, 7]].forEach(function (a, i) { g.beginPath(); g.arc(128, 100, a[0] * 1.5, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); });
      g.beginPath(); g.arc(128, 104, 5, 0, 7); g.fill();
      g.strokeStyle = '#e2574a'; g.lineWidth = 7; g.beginPath(); g.moveTo(150, 108); g.lineTo(180, 138); g.moveTo(180, 108); g.lineTo(150, 138); g.stroke();
      txt('NO NETWORK', 128, 28, 16, '#6a7078', 'center');
    } else if (key === 'boot') {
      bg('#0b0d10');
      g.fillStyle = '#4b535b'; g.beginPath(); g.arc(128, 54, 18, 0, 7); g.fill();
      g.fillStyle = '#2a3036'; rr(g, 30, 98, 196, 18, 9); g.fill();
      g.fillStyle = '#7fd6c4'; rr(g, 30, 98, Math.max(18, 196 * 0.6 * Math.min(1, this.bootT)), 18, 9); g.fill();
      txt('STARTING...', 128, 144, 14, '#6d767d', 'center');
    } else {
      grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#d3e5ee'); grad.addColorStop(1, '#a7c2d2');
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
      g.fillStyle = '#6f8fa8'; g.fillRect(0, 0, W, 24);
      txt('OFFICE PRINT 3000', 10, 17, 13, '#eef6fa');
      if (key === 'normal') {
        ['#86b9ae', '#e3b867', '#c98a96'].forEach(function (c, i) { g.fillStyle = c; rr(g, 12 + i * 80, 40, 70, 56, 8); g.fill(); });
        g.fillStyle = '#8fa8b8'; rr(g, 12, 112, 230, 12, 6); g.fill(); g.fillStyle = '#5f8aa6'; rr(g, 12, 112, 140, 12, 6); g.fill();
        txt('READY', 12, 150, 14, '#587a92');
      } else if (key === 'jam') {
        g.fillStyle = '#d9473a'; g.fillRect(0, 62, W, 38); txt('PAPER JAM  TRAY 2', 128, 88, 17, '#fff', 'center'); txt('Clear paper path', 128, 138, 14, '#587a92', 'center');
      } else if (key === 'ink') {
        g.fillStyle = '#15181c'; rr(g, 70, 44, 116, 80, 12); g.fill();
        g.fillStyle = '#f0b13a'; g.beginPath(); g.moveTo(128, 54); g.lineTo(168, 116); g.lineTo(88, 116); g.closePath(); g.fill();
        g.fillStyle = '#3a2418'; g.fillRect(125, 74, 6, 22); g.beginPath(); g.arc(128, 105, 4, 0, 7); g.fill();
        txt('INK LOW', 128, 150, 15, '#587a92', 'center');
      } else if (key === 'heat') {
        grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#4a2a26'); grad.addColorStop(1, '#2a1614'); g.fillStyle = grad; g.fillRect(0, 24, W, H);
        g.fillStyle = '#d9473a'; g.fillRect(0, 62, W, 40); txt('OVERHEATING', 128, 90, 20, '#fff', 'center'); txt('TEMP 94C', 128, 138, 14, '#e8a090', 'center');
      } else if (key === 'error') {
        g.fillStyle = '#d98a3a'; g.fillRect(0, 62, W, 38); txt('ERROR 0x00', 128, 88, 18, '#fff', 'center'); txt('Something is wrong', 128, 138, 14, '#587a92', 'center');
      }
    }
    this.screenTex.tex.needsUpdate = true;
  };

  P.setClock = function (secLeft, frac, warn, none) {
    var key = (none ? 'n' : Math.ceil(secLeft)) + (warn ? 'w' : '') + Math.round(frac * 60);
    if (key === this.clockKey) return;
    this.clockKey = key;
    var g = this.clockTex.ctx, S = 256, c = S / 2;
    g.clearRect(0, 0, S, S);
    g.fillStyle = warn ? '#e8483a' : '#f4f0e5'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
    g.lineWidth = 10; g.strokeStyle = warn ? '#ffd0c8' : '#d4cebd'; g.beginPath(); g.arc(c, c, 108, 0, 7); g.stroke();
    if (!none) {
      g.strokeStyle = warn ? '#fff' : '#5f8aa6'; g.lineCap = 'round';
      g.beginPath(); g.arc(c, c, 108, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, frac)); g.stroke();
    }
    g.fillStyle = warn ? '#fff' : '#2b2e33'; g.font = '700 84px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(none ? '--' : String(Math.ceil(secLeft)), c, c + 4);
    this.clockTex.tex.needsUpdate = true;
  };

  P.moveCamera = function (rig, seconds, done) {
    var r = this.rigs[rig];
    this.camAnim = { t: 0, dur: Math.max(0.01, seconds), p0: this.camPos.clone(), l0: this.camLook.clone(), p1: r.pos, l1: r.look, done: done };
  };
  P.snapCamera = function (rig) {
    this.camPos.copy(this.rigs[rig].pos); this.camLook.copy(this.rigs[rig].look); this.camAnim = null;
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook);
  };
  P.showPage = function (on) { this.pageMesh.visible = on; };
  P.setCableAmount = function (a) { this.cableTarget = this.cablePlug = a; this.cableDirty = true; };

  P.setMode = function (key) {
    var m = MODES[key] || MODES.idle;
    this.mode = key; this.m = m;
    this.drawScreen(m.screen);
    this.jam.visible = !!m.jam;
    var tray = this.trays[2];
    tray.position.z = 0.58 + (m.tray ? 0.07 : 0);
    this.cartY.material.opacity = m.ink ? 0.1 : 1;
    this.cartY.scale.y = m.ink ? 0.12 : 1;
    this.cartY.position.y = m.ink ? 0.79 : 0.88;
    this.wifiMat.emissiveIntensity = key === 'offline' || key === 'unplugged' || key === 'booting' ? 0 : 0.8;
    this.shimmerOn = !!m.shimmer;
    var dim = m.dim ? 0.82 : 1;
    this.printerMats.forEach(function (mm) { mm.color.setScalar(1).multiplyScalar(dim); });
    this.printerMats[0].color.setHex(0xece8df).multiplyScalar(dim);
    this.printerMats[1].color.setHex(0xd9d4c8).multiplyScalar(dim);
    this.printerMats[2].color.setHex(0xf3f0e8).multiplyScalar(dim);
    if (key === 'booting') this.bootT = 0;
    this.applyVents();
  };

  P.applyVents = function () {
    var on = this.m && this.m.vents;
    this.vents.forEach(function (v) {
      v.material.emissive.setHex(on ? 0xf08a3c : 0x000000);
      v.material.emissiveIntensity = on ? 1.4 : 0;
      v.material.color.setHex(on ? 0xf0a060 : 0x9a958a);
    });
  };

  P.setSeverity = function (n) { this.severity = n; };
  P.setFake = function (on) { this.fake = on; };
  P.setShake = function () { this.shake = 0.5; };
  P.setCablePlugged = function (b) { this.cableTarget = b ? 1 : 0; };
  P.setCableInstant = function (b) { this.cableTarget = b ? 1 : 0; this.cablePlug = this.cableTarget; this.cableDirty = true; };
  P.setHover = function (name) {
    this.hover = name;
    var hot = name === 'cable';
    this.cableMat.emissive.setHex(hot ? 0x445066 : 0x000000);
    this.cableMat.emissiveIntensity = hot ? 1 : 0;
  };
  P.rotateBy = function (dx) { this.rotTarget += dx; };
  P.rotateTo = function (a) { this.rotTarget = a; };
  P.getRotation = function () { return this.rotTarget; };

  P.pickAt = function (clientX, clientY) {
    var rect = this.canvas.getBoundingClientRect();
    var v = new T.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    var rc = this.raycaster = this.raycaster || new T.Raycaster();
    rc.setFromCamera(v, this.camera);
    var hits = rc.intersectObjects(this.pickables, false);
    var order = { jam: 0, ink: 0, wifidot: 0, page: 0, cable: 1, port: 1, printer: 3 };
    var best = null;
    for (var i = 0; i < hits.length; i++) {
      var name = hits[i].object.userData.pick;
      if (name === 'page' && !this.pageMesh.visible) continue;
      if (!best || order[name] < order[best]) best = name;
    }
    return best;
  };

  P.screenPos = function (name) {
    var v = new T.Vector3();
    if (name === 'printerTop') this.printer.localToWorld(v.set(0, 1.9, 0));
    else if (name === 'printerFront') this.printer.localToWorld(v.set(0, 1.0, 0.7));
    else if (name === 'printerSign') this.printer.localToWorld(v.set(0.1, 0.95, 0.6));
    else if (name === 'screen') this.screen.getWorldPosition(v);
    v.project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * global.innerWidth, y: (-v.y * 0.5 + 0.5) * global.innerHeight };
  };

  P.spawnSmoke = function (heat) {
    for (var i = 0; i < this.smoke.length; i++) {
      var sp = this.smoke[i];
      if (sp.userData.life > 0) continue;
      sp.userData.life = 1; sp.userData.speed = 0.35 + Math.random() * 0.3; sp.userData.heat = heat;
      sp.position.set(this.printer.position.x + (Math.random() - 0.5) * 1.1, 1.45, this.printer.position.z + (Math.random() - 0.5) * 0.7);
      sp.scale.setScalar(0.3); sp.visible = true;
      return;
    }
  };

  P.update = function (dt) {
    var t = this.time += dt;
    // rotation
    var cur = this.printer.rotation.y;
    var targ = this.rotTarget + (this.shake > 0 ? Math.sin(t * 60) * 0.012 * this.shake : 0);
    this.printer.rotation.y += (targ - cur) * Math.min(1, dt * 8);
    if (Math.abs(targ - cur) > 0.0005) this.cableDirty = true;
    this.shake = Math.max(0, this.shake - dt);
    this.updateCable();

    // status light
    var m = this.m, on = true, level = 1;
    var col = this.fake ? 0x4fd17a : m.light;
    var blink = this.fake ? 0 : m.blink + this.severity * 0.5;
    if (this.mode === 'unplugged') on = false;
    if (blink > 0) level = 0.35 + 0.65 * (Math.sin(t * blink * Math.PI * 2) * 0.5 + 0.5);
    if (this.mode === 'idle' && this.glowBoot > 0) { level = 1 + this.glowBoot; this.glowBoot = Math.max(0, this.glowBoot - dt * 0.15); }
    this.lightMat.emissive.setHex(on ? col : 0x000000);
    this.lightMat.emissiveIntensity = on ? 1.4 * level : 0;
    this.lampGlow.material.color.setHex(col);
    this.lampGlow.material.opacity = on ? 0.55 * level : 0;
    if (this.mode === 'offline') { this.lightMat.emissive.setHex(0x30343a); this.lampGlow.material.opacity = 0; }

    if (this.mode === 'booting') {
      this.bootT += dt / 2.0;
      if (Math.floor(t * 30) % 3 === 0) this.drawScreen('boot');
    }
    var ca = this.camAnim;
    if (ca) {
      ca.t = Math.min(1, ca.t + dt / ca.dur);
      var e = ca.t < 0.5 ? 2 * ca.t * ca.t : 1 - Math.pow(-2 * ca.t + 2, 2) / 2;
      this.camPos.lerpVectors(ca.p0, ca.p1, e); this.camLook.lerpVectors(ca.l0, ca.l1, e);
      this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook);
      if (ca.t >= 1) { this.camAnim = null; if (ca.done) ca.done(); }
    }

    // smoke
    var rate = this.fake ? 0 : (this.severity > 0 ? 0.8 + this.severity * 1.3 : 0);
    if (this.mode === 'heat') rate += 1.5;
    if (this.mode === 'unplugged') rate = 0;
    this.spawnAcc += rate * dt;
    while (this.spawnAcc > 1) { this.spawnAcc -= 1; this.spawnSmoke(this.mode === 'heat'); }
    for (var i = 0; i < this.smoke.length; i++) {
      var sp = this.smoke[i];
      if (sp.userData.life <= 0) continue;
      sp.userData.life -= dt * 0.28;
      sp.position.y += dt * sp.userData.speed;
      sp.position.x += Math.sin(t * 1.3 + i) * dt * 0.08;
      var k = 1 - sp.userData.life;
      sp.scale.setScalar(0.3 + k * 1.1);
      sp.material.opacity = Math.max(0, Math.min(0.5, sp.userData.life * 0.9)) * (sp.userData.heat ? 0.8 : 0.65);
      sp.material.color.setHex(sp.userData.heat ? 0x6a5f58 : 0x8a8d94);
      if (sp.userData.life <= 0) sp.visible = false;
    }
    // heat shimmer
    var target = this.shimmerOn ? 1 : 0;
    this.shimmerLevel += (target - this.shimmerLevel) * Math.min(1, dt * 1.5);
    for (var j = 0; j < this.shim.length; j++) {
      var h = this.shim[j];
      var ph = (t * 0.55 + h.userData.phase) % 1;
      h.position.set(this.printer.position.x + Math.sin(t * 2 + j * 1.7) * 0.35 + (j - 3) * 0.2, 1.5 + ph * 0.9, this.printer.position.z + 0.2);
      h.scale.set(0.9, 0.35, 1);
      h.material.opacity = this.shimmerLevel * 0.2 * Math.sin(ph * Math.PI);
    }
  };

  P.render = function () { this.renderer.render(this.scene, this.camera); };

  P.setBootGlow = function () { this.glowBoot = 1; };

  global.OFFLINE = global.OFFLINE || {};
  global.OFFLINE.Scene = Scene;
})(window);
