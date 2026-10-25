// Touchscreen pages. Every tile and button is a real hit target (see screen.js). Reads the printer's condition
// from Offline.world, which the flow controller keeps in step with the game state.
(function (O) {
  const S = O.screen, D = S.draw, g = S.g;
  const W = O.world = { fault: null, ink: [0.85, 0.7, 0.55, 0.9], paper: 20, net: true, temp: 0.3, job: 0, queue: 47, eco: false, progress: 0 };
  const JOBS = O.JOBS = [
    { name: 'Q3 Report.pdf', colour: false, pages: 12 },
    { name: 'Bake Sale Poster.png', colour: true, pages: 1 },
    { name: 'Invoice #4471.pdf', colour: false, pages: 2 },
    { name: 'Annual Report.pdf', colour: false, pages: 240 },
    { name: 'Ten Thousand Flyers', colour: true, pages: 10000 }
  ];
  O.INK_NAMES = ['Black', 'Yellow', 'Magenta', 'Cyan'];
  O.INK_HEX = ['#3a3d42', '#ffd400', '#e4007f', '#00a0e9'];
  O.FAULT_TEXT = { jam: 'Paper jam in the feed path', ink: 'Ink empty', offline: 'Printer is offline', heat: 'Too hot to print', cable: 'Spooler not responding' };
  const TILES = [['Copy', '#2f80ed'], ['Scan', '#27ae60'], ['Fax', '#ffffff'], ['Print Job', '#8e44ad'], ['Box', '#f2994a'],
    ['Settings', '#7b8794'], ['Status', '#16a5a5'], ['Ink Level', '#00a0e9'], ['Eco', '#6cbf3c'], ['Help', '#9aa3ad']];
  const note = (t, k) => S.flash(t, k || 'warn', 1700);
  const busy = () => W.fault ? O.FAULT_TEXT[W.fault] : null;

  function tap(i) {
    const n = TILES[i][0];
    if (n === 'Print Job') return S.go('job');
    if (n === 'Settings') return S.go('settings');
    if (n === 'Status') return S.go('status');
    if (n === 'Ink Level') return S.go('ink');
    if (n === 'Help') return S.go('help');
    if (n === 'Eco') { W.eco = !W.eco; return note(W.eco ? 'Eco mode on: fans run quieter' : 'Eco mode off', 'ok'); }
    if (busy() && (n === 'Copy' || n === 'Scan' || n === 'Fax')) return note('Unavailable: ' + busy(), 'bad');
    note({ Copy: 'Place a document on the glass', Scan: 'Lift the lid first', Fax: 'No phone line connected', Box: 'The box is empty' }[n]);
  }

  S.addPage('home', 'Home', () => {
    TILES.forEach(([name, color], i) => {
      const cx = 126 + (i % 5) * 180, cy = 154 + Math.floor(i / 5) * 190, white = color === '#ffffff';
      D.hotspot(cx - 78, cy - 60, 156, 156, () => tap(i));
      g.save(); g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
      D.box(cx - 56, cy - 56, 112, 112, 22, color); g.restore();
      if (white) D.box(cx - 56, cy - 56, 112, 112, 22, null, '#c3cbd6');
      D.text(name[0], cx, cy + 3, 54, white ? '#44505f' : '#fff', 'center');
      D.text(name, cx, cy + 82, 22, '#2b3440', 'center', 'normal');
    });
    g.fillStyle = '#c9ced6';
    [430, 500, 570].forEach(x => { g.beginPath(); g.arc(x, 518, 11, 0, 7); g.fill(); });
    g.fillStyle = W.fault ? '#d9473a' : '#3ddc84'; g.beginPath(); g.arc(940, 518, 7, 0, 7); g.fill();
  });

  function mark(cx, cy, ok) {
    g.fillStyle = ok ? '#2fb24a' : '#d9473a'; g.beginPath(); g.arc(cx, cy, 17, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    if (ok) { g.moveTo(cx - 8, cy); g.lineTo(cx - 2, cy + 6); g.lineTo(cx + 9, cy - 7); }
    else { g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 1); g.moveTo(cx, cy + 7); g.lineTo(cx, cy + 8); }
    g.stroke();
  }
  S.addPage('status', 'Status', () => {
    D.card('Printer status');
    const lowest = Math.min.apply(null, W.ink), hot = W.temp > 0.6;
    [['Paper tray', W.fault !== 'jam', W.fault === 'jam' ? 'Attention' : 'OK'],
      ['Ink', lowest > 0.06, lowest > 0.06 ? 'OK' : 'Attention'],
      ['Network', W.net, W.net ? 'Connected' : 'Offline'],
      ['Temperature', !hot, Math.round(24 + W.temp * 70) + ' °C'],
      ['Print queue', true, W.queue + ' jobs']].forEach(([label, ok, val], i) => {
      const y = 176 + i * 44;
      D.text(label, 90, y, 26, '#2b3440'); mark(480, y, ok); D.text(val, 520, y, 24, ok ? '#44505f' : '#d9473a');
    });
    D.homeBtn();
  });

  S.addPage('ink', 'Ink Level', () => {
    D.card('Ink cartridges');
    O.INK_NAMES.forEach((n, i) => {
      const y = 178 + i * 54, v = W.ink[i], empty = v <= 0.06;
      D.text(n, 90, y, 26, '#2b3440');
      D.bar(250, y - 14, 520, 28, v, O.INK_HEX[i]);
      D.text(empty ? 'EMPTY' : Math.round(v * 100) + '%', 920, y, 26, empty ? '#d9473a' : '#44505f', 'right');
    });
    D.homeBtn();
  });

  S.addPage('job', 'Print Job', () => {
    const j = JOBS[W.job] || JOBS[0];
    D.card('Print queue');
    D.text(W.queue + ' jobs pending', 924, 120, 24, '#8a929c', 'right');
    D.text('Now printing', 76, 172, 20, '#8a929c', 'left', 'normal');
    D.text(j.name, 76, 208, 36, '#2b3440');
    D.text(j.colour ? 'Colour: uses all four inks' : 'Black & white: uses black ink only', 76, 246, 22, j.colour ? '#8e44ad' : '#44505f');
    O.INK_HEX.forEach((c, i) => D.box(716 + i * 52, 188, 40, 40, 8, (j.colour || i === 0) ? c : '#dfe4ea'));
    D.bar(76, 270, 800, 22, W.progress, W.fault ? '#d9473a' : '#2f80ed');
    D.text(W.fault ? 'Stopped' : Math.round(W.progress * 100) + '%  ·  ' + j.pages + ' page' + (j.pages > 1 ? 's' : ''), 76, 316, 22, '#8a929c', 'left', 'normal');
    D.button(76, 336, 220, 52, 'Print', () => S.onAction('print'), { color: '#27ae60' });
    D.button(316, 336, 240, 52, 'Pause job', () => S.onAction('pause'), { color: '#e0a030' });
    D.homeBtn();
  });

  S.addPage('settings', 'Settings', () => {
    D.card('Settings');
    D.button(76, 150, 410, 84, 'Restart printer', () => S.onAction('restart'), { color: '#d9473a', size: 30 });
    D.button(514, 150, 410, 84, 'Network', () => S.go('net'), { color: '#2f80ed', size: 30 });
    D.button(76, 256, 410, 84, W.eco ? 'Eco mode: on' : 'Eco mode: off', () => { W.eco = !W.eco; }, { color: '#6cbf3c', size: 30 });
    D.button(514, 256, 410, 84, 'Date & time', () => note('Set by your administrator'), { color: '#7b8794', size: 30 });
    D.homeBtn();
  });

  S.addPage('net', 'Network', () => {
    if (S.custom) { S.custom(S.g, S.W, S.H, S.t); D.homeBtn(); return; }   // DANN's "No network" screen and Wi-Fi form
    D.card('Wi-Fi');
    D.wifi(112, 164, W.net);
    D.text('Corbrat', 170, 176, 36, '#2b3440');
    D.text(W.net ? 'Connected' : 'Not connected', 170, 220, 26, W.net ? '#2fb24a' : '#d9473a');
    D.button(76, 282, 280, 64, 'Reconnect', () => S.onAction('reconnect'), { color: '#2f80ed', size: 30 });
    D.homeBtn();
  });

  S.addPage('help', 'Help', () => {
    D.card('Help & support');
    D.text('Support line: 1-800-555-0147', 76, 168, 28, '#2b3440');
    D.text('Estimated wait: 47 minutes', 76, 208, 22, '#8a929c', 'left', 'normal');
    D.button(76, 250, 330, 70, 'Run diagnostic', () => S.onAction('diagnostic'), { color: '#16a5a5', size: 30 });
    D.homeBtn();
  });

  S.addPage('diag', 'Diagnostic', () => {
    D.card('Running diagnostic');
    const d = S.diag, p = d ? Math.min(0.99, 0.99 * d.t / (d.len * 0.8)) : 0.99;
    D.bar(76, 190, 800, 30, p, '#16a5a5');
    D.text(Math.round(p * 100) + '%', 76, 262, 56, '#2b3440');
    D.text(p >= 0.99 ? 'Finishing up...' : 'Checking paper path, ink, network, fans...', 76, 330, 22, '#8a929c', 'left', 'normal');
    D.spinner(880, 262, 24, '#16a5a5');
  });
})(window.Offline);
