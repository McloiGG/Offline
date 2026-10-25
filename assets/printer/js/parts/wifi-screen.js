// Offline state of the touchscreen: a "no network" animation, a Connect Wi-Fi button, a name / password form
// and a connecting animation, all painted on the screen canvas.
// Exposes: Cetak.parts.wifi = { setOffline(on), isOffline(), tap(x, y), hit(x, y), on(fn) }
//   on(fn) is called with 'offline', 'online', 'tap', 'wrong', 'connecting' or 'connected'.
(function (C) {
  const { roundRectPath } = C.helpers;
  const display = C.parts.display;

  const SSID = 'Corbrat', PASSWORD = '241026';
  const CONNECTING_SECONDS = 3, CONNECTED_SECONDS = 1;

  const listeners = [];
  const emit = type => listeners.forEach(fn => fn(type));

  let mode = null;              // null | 'offline' | 'form' | 'connecting'
  let startedAt = null;         // seconds, set on the first painted frame of the current mode
  const form = { name: '', pass: '', field: 'name', error: '' };

  const BUTTON = { x: 350, y: 360, w: 300, h: 70 };
  const FIELDS = { name: { x: 200, y: 120, w: 600, h: 62 }, pass: { x: 200, y: 204, w: 600, h: 62 } };
  const CONNECT = { x: 200, y: 296, w: 290, h: 62 };
  const CANCEL = { x: 510, y: 296, w: 290, h: 62 };

  const inside = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  function button(g, r, text, fill) {
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.25)';
    g.shadowBlur = 10;
    g.shadowOffsetY = 4;
    g.fillStyle = fill;
    roundRectPath(g, r.x, r.y, r.w, r.h, 16);
    g.fill();
    g.restore();
    g.fillStyle = '#ffffff';
    g.font = 'bold 28px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, r.x + r.w / 2, r.y + r.h / 2 + 1);
  }

  // Wi-Fi symbol: a dot and three arcs; `lit` is how many arcs are drawn (0-3, may be fractional for a fade).
  function wifiIcon(g, cx, cy, size, lit, color) {
    g.save();
    g.lineCap = 'round';
    g.lineWidth = size * 0.1;
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = color;
      g.globalAlpha = Math.max(0.15, Math.min(1, lit - i));
      g.beginPath();
      g.arc(cx, cy, size * (0.45 + i * 0.3), -Math.PI * 0.75, -Math.PI * 0.25);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = color;
    g.beginPath();
    g.arc(cx, cy, size * 0.09, 0, 7);
    g.fill();
    g.restore();
  }

  function text(g, str, x, y, font, color) {
    g.font = font;
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(str, x, y);
  }

  function offlineScreen(g, w, _h, t) {
    display.paintFrame(g, w, 'No network');
    const pulse = (t * 1.4) % 1;
    // Arcs flicker on one after another, the symbol bobs slightly and a red slash blinks over it.
    wifiIcon(g, 500, 235, 150, (t * 1.6) % 4, '#7b8794');
    g.save();
    g.strokeStyle = '#d93025';
    g.lineWidth = 12;
    g.lineCap = 'round';
    g.globalAlpha = 0.65 + 0.35 * Math.sin(t * 6);
    g.beginPath();
    g.moveTo(420, 120);
    g.lineTo(580, 260);
    g.stroke();
    g.restore();
    // Expanding ring that never connects.
    g.strokeStyle = 'rgba(217,48,37,' + (1 - pulse) * 0.5 + ')';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(500, 235, 70 + pulse * 110, 0, 7);
    g.stroke();

    text(g, 'No network connection', 500, 322, 'bold 34px Arial', '#2b3440');
    button(g, BUTTON, 'Connect Wi-Fi', '#2f80ed');
  }

  function field(g, r, label, value, active, t) {
    g.fillStyle = '#ffffff';
    roundRectPath(g, r.x, r.y, r.w, r.h, 12);
    g.fill();
    g.strokeStyle = active ? '#2f80ed' : '#b8c2cf';
    g.lineWidth = active ? 4 : 2;
    g.stroke();
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    if (value) {
      g.font = 'bold 30px Arial';
      g.fillStyle = '#2b3440';
      g.fillText(value, r.x + 20, r.y + r.h / 2 + 1);
    } else {
      g.font = '28px Arial';
      g.fillStyle = '#9aa3ad';
      g.fillText(label, r.x + 20, r.y + r.h / 2 + 1);
    }
    if (active && Math.floor(t * 2) % 2 === 0) {
      g.font = 'bold 30px Arial';
      const cx = r.x + 20 + (value ? g.measureText(value).width + 2 : 0);
      g.fillStyle = '#2f80ed';
      g.fillRect(cx, r.y + 14, 3, r.h - 28);
    }
  }

  function formScreen(g, w, h, t) {
    display.paintFrame(g, w, 'Wi-Fi setup');
    text(g, 'Connect to Wi-Fi', 500, 100, 'bold 32px Arial', '#2b3440');
    field(g, FIELDS.name, 'Wi-Fi name', form.name, form.field === 'name', t);
    field(g, FIELDS.pass, 'Password', '•'.repeat(form.pass.length), form.field === 'pass', t);
    button(g, CONNECT, 'Connect', '#27ae60');
    button(g, CANCEL, 'Cancel', '#7b8794');
    if (form.error) text(g, form.error, 500, 396, 'bold 26px Arial', '#d93025');
    else text(g, 'Type with your keyboard. Tab switches field.', 500, 396, '22px Arial', '#6b7684');
  }

  function connectingScreen(g, w, h, t) {
    if (startedAt === null) startedAt = t;
    const e = t - startedAt;
    if (e >= CONNECTING_SECONDS + CONNECTED_SECONDS) { goOnline(); return; }

    const done = e >= CONNECTING_SECONDS;
    display.paintFrame(g, w, done ? 'Connected' : 'Connecting');
    if (done) {
      wifiIcon(g, 500, 235, 150, 3, '#27ae60');
      text(g, 'Connected to ' + SSID, 500, 340, 'bold 36px Arial', '#27ae60');
      return;
    }
    // Arcs light up one by one, with a spinner ring around the symbol.
    wifiIcon(g, 500, 235, 150, (e * 2.2) % 4, '#2f80ed');
    g.strokeStyle = '#2f80ed';
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(500, 215, 130, e * 5, e * 5 + 1.6);
    g.stroke();
    text(g, 'Connecting to ' + SSID + '.'.repeat(1 + Math.floor(e * 3) % 3), 500, 340, 'bold 34px Arial', '#2b3440');
    g.fillStyle = '#c9d3df';
    roundRectPath(g, 300, 385, 400, 16, 8);
    g.fill();
    g.fillStyle = '#2f80ed';
    roundRectPath(g, 300, 385, Math.max(16, 400 * e / CONNECTING_SECONDS), 16, 8);
    g.fill();
  }

  function goOnline() {
    mode = null;
    display.setScreen(null);
    emit('online');
  }

  function show(next, painter) {
    mode = next;
    startedAt = null;
    display.setScreen(painter);
  }

  function submit() {
    if (form.name === SSID && form.pass === PASSWORD) {
      show('connecting', connectingScreen);
      emit('connecting');
      setTimeout(() => { if (mode === 'connecting') emit('connected'); }, CONNECTING_SECONDS * 1000);
    } else {
      form.error = form.name === SSID ? 'Wrong password, try again' : 'Wi-Fi network not found';
      form.pass = '';
      form.field = form.name === SSID ? 'pass' : 'name';
      emit('wrong');
    }
  }

  function openForm() {
    Object.assign(form, { name: '', pass: '', field: 'name', error: '' });
    show('form', formScreen);
  }

  function tap(x, y) {
    if (!display.isOn()) return;
    if (mode === 'offline' && inside(BUTTON, x, y)) { emit('tap'); openForm(); return; }
    if (mode !== 'form') return;
    if (inside(FIELDS.name, x, y)) { form.field = 'name'; emit('tap'); }
    else if (inside(FIELDS.pass, x, y)) { form.field = 'pass'; emit('tap'); }
    else if (inside(CONNECT, x, y)) { emit('tap'); submit(); }
    else if (inside(CANCEL, x, y)) { emit('tap'); show('offline', offlineScreen); }
  }

  const FORM_TARGETS = [FIELDS.name, FIELDS.pass, CONNECT, CANCEL];
  const hit = (x, y) => display.isOn() && (
    (mode === 'offline' && inside(BUTTON, x, y)) ||
    (mode === 'form' && FORM_TARGETS.some(r => inside(r, x, y)))
  );

  addEventListener('keydown', e => {
    if (mode !== 'form' || !display.isOn() || (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName))) return;
    const key = e.key;
    if (key === 'Escape') return;
    if (key === 'Enter') submit();
    else {
      if (key === 'Tab') form.field = form.field === 'name' ? 'pass' : 'name';
      else if (key === 'Backspace') form[form.field] = form[form.field].slice(0, -1);
      else if (key.length === 1 && !e.ctrlKey && !e.metaKey && form[form.field].length < 24) form[form.field] += key;
      else return;
      form.error = '';
    }
    e.preventDefault();
  });

  C.parts.wifi = {
    setOffline(on) {
      if (on === (mode !== null)) return;
      if (on) { show('offline', offlineScreen); emit('offline'); }
      else goOnline();
    },
    isOffline: () => mode !== null,
    tap,
    hit,
    on: fn => listeners.push(fn)
  };
})(window.Cetak);
