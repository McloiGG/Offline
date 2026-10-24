/* OFFLINE - wiring: Game events -> Scene, DOM overlay, Audio. */
(function (global) {
  'use strict';
  var O = global.OFFLINE;
  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2;

  var game = new O.Game();
  var scene = new O.Scene($('gl'));
  var Au = O.Audio;

  var MODE_BY_KEY = { jam: 'jam', ink: 'ink', offline: 'offline', heat: 'heat', cable: 'cable5' };
  var maxTime = 1, bubbleTimer = 0, cwTimer = 0, fakeTimer = 0, handTimer = 0, checkTimer = 0, diagTimer = 0;
  var diagRun = null, shownScore = 1000, started = false;

  O.app = { game: game, scene: scene };

  function show(id) { $(id).classList.remove('hidden'); }
  function hide(id) { $(id).classList.add('hidden'); }
  function pop(el, cls) { el.classList.remove('bump', 'loss'); void el.offsetWidth; el.classList.add(cls); }

  function toast(text, kind) {
    var d = document.createElement('div');
    d.className = 'toast' + (kind ? ' ' + kind : '');
    d.textContent = text;
    $('toasts').appendChild(d);
    setTimeout(function () { d.remove(); }, 2500);
  }

  /* ---------- coworker panel (2D UI element) ---------- */
  var cwCtx = $('cwCanvas').getContext('2d');
  function setCw(expr) {
    scene.setCoworker(expr);
    cwCtx.clearRect(0, 0, 512, 512);
    cwCtx.drawImage(scene.cwTex.canvas, 0, 0);
  }
  function react(expr, ms) {
    setCw(expr);
    clearTimeout(cwTimer);
    cwTimer = setTimeout(function () { setCw('neutral'); }, ms || 1300);
  }
  function say(text, ms) {
    var b = $('bubble');
    b.textContent = text; show('bubble');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { hide('bubble'); }, ms || 4000);
  }

  /* ---------- hands (first person, bottom of screen) ---------- */
  $('hands').innerHTML = global.OFFLINE_HANDS;
  var handsSvg = $('handsSvg');
  var handBase = 'idle';
  function hands(pose, ms) {
    clearTimeout(handTimer);
    handsSvg.setAttribute('data-hands', pose);
    if (ms) handTimer = setTimeout(function () { handsSvg.setAttribute('data-hands', handBase); }, ms);
  }
  function handsRest(pose) { handBase = pose; handsSvg.setAttribute('data-hands', pose); }

  /* ---------- score / queue ---------- */
  function setScore() {
    var s = game.score(), el = $('scoreNum');
    if (s === shownScore) return;
    el.textContent = s; pop(el, s < shownScore ? 'loss' : 'bump'); shownScore = s;
  }
  function setQueue(n) {
    var el = $('queueNum');
    if (el.textContent !== String(n)) { el.textContent = n; pop(el, 'bump'); }
  }

  /* ---------- 2D interface illustrations, one per state ---------- */
  var INK = '#2b2e33';
  function svgWrap(cap, body) {
    return '<svg viewBox="0 0 640 300" width="640" height="300" role="img" aria-label="' + cap + '">' +
      '<rect width="640" height="300" rx="12" fill="#dfe8ec"/>' +
      '<text x="18" y="28" font-size="13" letter-spacing="2" fill="#6f6b60" font-family="Segoe UI,Arial">' + cap.toUpperCase() + '</text>' + body + '</svg>';
  }
  var ART = {
    jam: function () {
      return svgWrap('Top tray', '<g id="art-jam">' +
        '<rect x="60" y="150" width="520" height="110" rx="10" fill="#ece8df" stroke="#9a958a" stroke-width="3"/>' +
        '<rect x="90" y="190" width="460" height="14" rx="7" fill="' + INK + '"/>' +
        '<path d="M200 190 L250 90 L290 150 L330 70 L380 140 L420 100 L440 190 Z" fill="#fbf8ee" stroke="#8c8678" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M250 90 L262 150 M330 70 L318 135 M380 140 L360 180 M290 150 L300 185" stroke="#c7c1b0" stroke-width="3" fill="none"/>' +
        '<rect x="270" y="215" width="100" height="22" rx="6" fill="#d9473a"/><text x="320" y="231" font-size="13" text-anchor="middle" fill="#fff" font-family="Segoe UI,Arial" font-weight="700">TRAY 2</text></g>');
    },
    ink: function () {
      var cols = ['#1b1c1f', '#e9c33c', '#d2417e', '#2f9ccd'], fills = [0.8, 0.07, 0.7, 0.6], out = '';
      for (var i = 0; i < 4; i++) {
        var x = 100 + i * 120, h = 130 * fills[i];
        out += '<rect x="' + x + '" y="80" width="86" height="160" rx="10" fill="#fff" stroke="#8c8678" stroke-width="3"/>' +
          '<rect x="' + (x + 8) + '" y="' + (232 - h) + '" width="70" height="' + h + '" rx="6" fill="' + cols[i] + '"/>';
      }
      return svgWrap('Cartridge bay', '<g id="art-ink">' + out + '<text x="344" y="266" font-size="14" fill="#d9473a" font-family="Segoe UI,Arial" font-weight="700" text-anchor="middle">INK LOW</text></g>');
    },
    offline: function () {
      return svgWrap('Printer screen', '<g id="art-offline">' +
        '<rect x="120" y="50" width="400" height="220" rx="14" fill="#0b0d10" stroke="#2d3036" stroke-width="6"/>' +
        '<text x="320" y="92" font-size="16" fill="#6a7078" text-anchor="middle" font-family="Segoe UI,Arial" letter-spacing="2">NO NETWORK</text>' +
        '<g stroke="#4b535b" stroke-width="8" fill="none" stroke-linecap="round"><path d="M250 160 A90 90 0 0 1 390 160"/><path d="M272 184 A58 58 0 0 1 368 184"/></g>' +
        '<g id="netIcon" style="cursor:pointer"><rect x="270" y="196" width="100" height="56" rx="12" fill="#16301f" stroke="#7fe0a0" stroke-width="3"><animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/></rect>' +
        '<g stroke="#7fe0a0" stroke-width="4" stroke-linecap="round" fill="none"><path d="M320 208 V224 M300 224 H340 M300 224 V234 M340 224 V234"/></g>' +
        '<g fill="#7fe0a0"><rect x="312" y="202" width="16" height="9" rx="2"/><rect x="292" y="233" width="16" height="9" rx="2"/><rect x="332" y="233" width="16" height="9" rx="2"/></g></g></g>');
    },
    heat: function () {
      return svgWrap('Status panel', '<g id="art-heat">' +
        '<rect x="110" y="50" width="420" height="210" rx="14" fill="#2a1614" stroke="#2d3036" stroke-width="6"/>' +
        '<circle id="heatLight" cx="190" cy="120" r="36" fill="#d9473a"><animate attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite"/></circle>' +
        '<text x="250" y="112" font-size="26" fill="#fff" font-family="Segoe UI,Arial" font-weight="700">OVERHEATING</text>' +
        '<text id="tempText" x="250" y="146" font-size="20" fill="#e8a090" font-family="Segoe UI,Arial">TEMP 88 C</text>' +
        '<rect x="150" y="200" width="340" height="18" rx="9" fill="#4a2a26"/><rect id="tempBar" x="150" y="200" width="250" height="18" rx="9" fill="#e0603a"/></g>');
    },
    cable: function () {
      return svgWrap('Printer screen', '<g id="art-cable">' +
        '<rect x="120" y="50" width="400" height="220" rx="14" fill="#d3e5ee" stroke="#2d3036" stroke-width="6"/>' +
        '<rect x="120" y="50" width="400" height="34" rx="12" fill="#6f8fa8"/>' +
        '<text x="140" y="74" font-size="16" fill="#eef6fa" font-family="Segoe UI,Arial" font-weight="700">OFFICE PRINT 3000</text>' +
        '<rect x="120" y="130" width="400" height="60" fill="#d98a3a"/>' +
        '<text x="320" y="170" font-size="28" fill="#fff" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="700">ERROR 0x00</text>' +
        '<text x="320" y="236" font-size="16" fill="#587a92" text-anchor="middle" font-family="Segoe UI,Arial">Printer reports: everything is fine</text></g>');
    }
  };
  var ART_BY_KEY = { jam: 'jam', ink: 'ink', offline: 'offline', heat: 'heat', cable: 'cable' };

  /* ---------- panel ---------- */
  var actionEls = {};
  O.Game.ACTIONS.forEach(function (a, i) {
    var b = document.createElement('button');
    b.className = 'act'; b.textContent = a.label;
    b.title = 'Key ' + (i + 1);
    b.onclick = function () { doAction(a.id); };
    $('actions').appendChild(b);
    actionEls[a.id] = b;
  });
  function doAction(id) {
    if (!game.panelOpen || game.phase !== 'playing' || game.busy) return;
    Au.unlock(); hands('press', 220);
    game.act(id);
  }
  function refreshActions() {
    var on = game.phase === 'playing' && !game.busy && game.panelOpen;
    for (var id in actionEls) actionEls[id].disabled = !on;
  }
  function stopDiag() { diagRun = null; hide('panelDiag'); }
  function openPanelDom(state) {
    $('stage').innerHTML = ART[ART_BY_KEY[state.key]]();
    for (var id in actionEls) actionEls[id].classList.remove('used', 'flash');
    stopDiag(); hide('fakeCheck');
    show('panel');
    var net = $('netIcon');
    if (net) net.onclick = function () { hands('press', 220); Au.click(); game.secondary('wifi'); };
    handsRest('idle');
  }
  function closePanelDom() { hide('panel'); stopDiag(); hide('fakeCheck'); }

  game.on('panelOpen', function (e) { Au.click(); openPanelDom(e.state); });
  game.on('panelClose', closePanelDom);
  $('panelClose').onclick = function () { game.closePanel(); };

  /* ---------- game events ---------- */
  game.on('stateStart', function (e) {
    var s = e.state;
    maxTime = Math.max(1, s.timer * 1000);
    closePanelDom();
    hide('bubble');
    show('hud'); show('coworker'); show('hands'); handsRest('idle');
    clearTimeout(fakeTimer);
    scene.setFake(false);
    scene.setMode(MODE_BY_KEY[s.key]);
    scene.setCableAmount(s.n === 5 ? 0.8 : 1);
    scene.setSeverity(game.severity); Au.setSeverity(game.severity);
    Au.startHum(); Au.updateHum(false);
    setQueue(e.queue); setScore();
    scene.setClock(s.timer, 1, false, s.timer === 0);
    if (e.reset) { Au.startup(); scene.setBootGlow(); toast('Printer restarted', ''); }
    refreshActions();
  });

  game.on('riddle', function (e) { say(e.text, e.ms - 300); react('eye', e.ms - 600); });

  game.on('timerSecond', function (e) { if (e.left <= 10000) Au.clockTick(); });
  game.on('expire', function (e) {
    scene.setSeverity(e.severity); Au.setSeverity(e.severity);
    scene.setShake(); Au.fail();
    toast('Time is up  -' + e.penalty, 'bad');
    maxTime = game.timeLeft;
  });

  game.on('actionClick', function (e) { Au.click(); actionEls[e.id].classList.add('used'); });
  game.on('wrong', function (e) {
    var el = actionEls[e.id];
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    toast('Wrong  -' + e.penalty, 'bad');
    if (e.id === 'tray' || e.id === 'ink') Au.crunch();
    if (e.id === 'restart') Au.shutdown();
    if (game.state().n === 4) { scene.setSeverity(game.severity + 1); Au.setSeverity(game.severity + 2); }
  });
  game.on('coworkerReact', function (e) {
    react(e.kind, e.kind === 'notebook' ? 2000 : 1200);
    if (e.kind === 'hm') Au.hm(); else if (e.kind === 'notebook') Au.pen();
  });

  game.on('diagnostic', function (e) {
    stopDiag();
    $('diagFill').style.width = '0'; $('diagPct').textContent = '0%';
    $('diagLabel').textContent = 'Running diagnostic';
    show('panelDiag');
    diagRun = { t: 0, ms: e.ms, ticks: 0 };
  });

  game.on('fakeRecovery', function (e) {
    scene.setFake(true); Au.chime();
    Au.setSeverity(game.state().n === 4 ? Math.max(2, game.severity) : 0);
    if (game.panelOpen) {
      show('fakeCheck');
      clearTimeout(checkTimer); checkTimer = setTimeout(function () { hide('fakeCheck'); }, 1800);
    }
    clearTimeout(fakeTimer);
    fakeTimer = setTimeout(function () { scene.setFake(false); }, e.delay);
  });
  game.on('fail', function (e) {
    scene.setFake(false); scene.setSeverity(e.severity); scene.setShake();
    Au.setSeverity(e.severity); Au.fail();
    hide('fakeCheck');
    toast('...and it is broken again', 'bad');
  });

  game.on('hint', function (e) { say(e.text, 6000); });

  game.on('exhaust', function (e) {
    clearTimeout(fakeTimer);
    closePanelDom();
    scene.setFake(false); scene.setMode('unplugged'); scene.setShake();
    Au.shutdown(); Au.updateHum(true);
    toast('Nothing worked. Printer shutting down  -' + e.penalty, 'bad');
    refreshActions();
  });

  game.on('coworker', function (e) {
    if (e.kind === 'riddle') { say(e.text, 6000); react('eye', 1800); }
    else if (e.kind === 'comment') { say(e.text, 4500); react('glance', 1600); }
    else { hide('bubble'); react('eye', 3000); }
  });

  game.on('unplug', function () {
    closePanelDom();
    scene.setCablePlugged(false); scene.setMode('unplugged'); scene.setSeverity(0);
    Au.click(); Au.shutdown(); Au.setSeverity(0); Au.updateHum(true);
    hands('pull-cable'); handBase = 'idle'; handTimer = setTimeout(function () { hands('idle'); }, 1400);
  });
  game.on('plugIn', function () {
    scene.setCablePlugged(true); scene.setMode('booting');
    Au.click(); Au.startup(); Au.updateHum(false);
    hands('plug-in'); handTimer = setTimeout(function () { hands('idle'); }, 2200);
    refreshActions();
  });

  game.on('solved', function (e) {
    clearTimeout(fakeTimer); hide('bubble');
    scene.setFake(false); scene.setSeverity(0); Au.setSeverity(0);
    setQueue(e.queue);
    Au.solved();
    if (e.index === 3) {
      // winding down: panel stays up, status light red -> yellow -> green
      var light = $('heatLight');
      if (light) { light.setAttribute('fill', '#e0b030'); light.innerHTML = ''; }
      var tt = $('tempText'); if (tt) tt.textContent = 'COOLING...';
      scene.setMode('heatcool'); Au.shutdown(); Au.vent();
      setTimeout(function () { if (light) light.setAttribute('fill', '#4fd17a'); if (tt) tt.textContent = 'TEMP 41 C'; scene.setMode('idle'); }, 4000);
      toast('+' + e.score + (e.perfect ? '  Perfect' : ''), 'good');
    } else {
      closePanelDom();
      scene.setMode('idle'); scene.setCableAmount(1);
      toast('+' + e.score + (e.perfect ? '  Perfect' : ''), 'good');
    }
    if (e.index === 0 || e.index === 1) react('glance', 1500);
    else if (e.index < 4) react('nod', 1500);
    if (e.index === 4) {
      hide('hud');
      scene.moveCamera('end', 5);
      setCw('lean');
    }
    refreshActions();
  });

  game.on('score', setScore);

  game.on('print', function () { Au.print(); scene.setBootGlow(); scene.setMode('idle'); });
  game.on('pageLanded', function () { scene.showPage(true); Au.land(); });
  game.on('pageOpen', function () { show('pageView'); Au.page(); });
  game.on('perfect', function () { setCw('neutral'); say('perfect.', 3500); Au.solved(); });
  var countTimer = null;
  game.on('rating', function (r) {
    hide('pageView');
    $('endRating').textContent = Math.round(r.rating);
    var left = r.closeIn || 8;
    $('endCount').textContent = 'Closing in ' + left;
    clearInterval(countTimer);
    countTimer = setInterval(function () {
      left--;
      if (left <= 0) { clearInterval(countTimer); left = 0; }
      $('endCount').textContent = 'Closing in ' + left;
    }, 1000);
    show('end'); Au.chime();
  });
  game.on('close', function () {
    clearInterval(countTimer);
    hide('end'); hide('bubble'); hide('coworker'); show('black'); Au.updateHum(true);
    try { global.close(); } catch (err) { /* browsers may refuse */ }
  });

  /* ---------- pointer input ---------- */
  var cv = $('gl'), drag = null;

  function isErrorHit(hit) {
    if (!hit || game.phase !== 'playing') return false;
    var s = game.state();
    if (s.errorPick === 'printer') return hit === 'printer' || hit === 'jam' || hit === 'ink';
    return hit === s.errorPick;
  }
  function interactive(hit) {
    if (!hit) return false;
    if (hit === 'page') return game.phase === 'ending' && game.pageReady && !game.pageClicked;
    if (hit === 'cable' || hit === 'port') return game.secondaryAvailable(hit);
    return !game.panelOpen && !game.busy && !game.cableUnplugged && isErrorHit(hit);
  }

  cv.addEventListener('pointerdown', function (e) {
    Au.unlock();
    if (game.panelOpen || started === false) return;
    drag = { x: e.clientX, y: e.clientY, last: e.clientX, rotating: false };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function (e) {
    if (game.panelOpen || !started) return;
    if (drag) {
      var dx = e.clientX - drag.last; drag.last = e.clientX;
      if (!drag.rotating && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) { drag.rotating = true; hands('reach'); }
      if (drag.rotating && (game.phase === 'playing' || game.phase === 'ending')) scene.rotateBy(dx * 0.009);
      return;
    }
    var hit = scene.pickAt(e.clientX, e.clientY);
    var ok = interactive(hit);
    scene.setHover(ok && hit === 'cable' ? 'cable' : null);
    cv.style.cursor = ok ? 'pointer' : 'grab';
    if (game.phase === 'playing') hands(ok ? 'hover' : 'idle');
  });
  cv.addEventListener('pointerup', function (e) {
    var d = drag; drag = null;
    if (!d) return;
    if (d.rotating) { hands('idle'); return; }
    var hit = scene.pickAt(e.clientX, e.clientY);
    if (!interactive(hit)) { hands('idle'); return; }
    hands('press', 220);
    if (hit === 'page') game.pageClick();
    else if (hit === 'cable' || hit === 'port') game.secondary(hit);
    else game.openPanel();
  });

  $('coworker').addEventListener('click', function () { Au.unlock(); game.coworkerClick(); });
  $('pageView').onclick = function () { hide('pageView'); };

  function toggleMute() {
    var m = !Au.isMuted(); Au.setMuted(m);
    $('mute').textContent = m ? 'Sound off' : 'Sound on';
  }
  $('mute').onclick = toggleMute;

  global.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    var k = e.key;
    if (k >= '1' && k <= '6') doAction(O.Game.ACTIONS[+k - 1].id);
    else if (k === 'Escape') game.closePanel();
    else if (k === 'm' || k === 'M') toggleMute();
    else if (k === 'ArrowLeft' && !game.panelOpen) scene.rotateBy(-0.3);
    else if (k === 'ArrowRight' && !game.panelOpen) scene.rotateBy(0.3);
  });

  /* ---------- menu and camera push ---------- */
  $('btnHow').onclick = function () { Au.unlock(); Au.click(); show('card'); };
  $('card').onclick = function () { hide('card'); };
  $('btnQuit').onclick = function () {
    Au.click();
    try { global.close(); } catch (err) { /* ignore */ }
    hide('menu'); show('black');
  };
  $('btnStart').onclick = function () {
    if (started) return;
    started = true;
    Au.unlock(); Au.startAmbient(); Au.click();
    hide('card');
    var cat = $('mCat');
    cat.style.transition = 'transform .35s'; cat.style.transform = 'translateY(-4%)';
    setTimeout(function () { cat.style.transform = 'translateY(6%)'; }, 700);
    var ln = $('line');
    ln.textContent = 'The printer is broken.';
    ln.style.top = '14%';
    show('line');
    setTimeout(function () {
      scene.moveCamera('play', 3.8, function () {
        hide('line');
        game.start(); game.beginPlay();
        show('rotHint');
        setTimeout(function () { hide('rotHint'); }, 6000);
      });
      $('menuScene').classList.add('zoom');
      setTimeout(function () { hide('menu'); }, 1800);
    }, 1400);
  };

  /* debug: index.html#state=3 or #state=5,rot=3.14,panel */
  var dbg = /#state=(\d)((?:,[a-z]+=?[-\d.]*)*)/.exec(global.location.hash);
  if (dbg) {
    started = true;
    hide('menu'); scene.snapCamera('play');
    game.start(); game.beginPlay();
    var n = +dbg[1] - 1;
    if (n > 0) game.startState(n);
    var rm = /rot=(-?[\d.]+)/.exec(dbg[2]);
    if (rm) scene.printer.rotation.y = scene.rotTarget = +rm[1];
    if (/panel/.test(dbg[2])) game.openPanel();
  }

  /* ---------- loop ---------- */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(100, now - last); last = now;
    if (game.phase !== 'menu') game.tick(dt);

    if (game.phase === 'playing' && game.stateIndex >= 0) {
      var s = game.state();
      if (s.timer > 0) {
        var left = Math.max(0, game.timeLeft);
        scene.setClock(left / 1000, left / maxTime, left <= 10000, false);
      }
      if (game.panelOpen && s.key === 'heat') {
        var k = 1 - Math.max(0, game.timeLeft) / maxTime, t = 86 + Math.round(k * 12) + game.severity * 2;
        var tt = $('tempText'), tb = $('tempBar');
        if (tt) tt.textContent = 'TEMP ' + t + ' C';
        if (tb) tb.setAttribute('width', Math.min(340, 220 + k * 100 + game.severity * 10));
      }
    }
    if (diagRun) {
      diagRun.t += dt;
      var f = Math.min(0.99, diagRun.t / diagRun.ms);
      $('diagFill').style.width = (f * 100) + '%';
      $('diagPct').textContent = Math.floor(f * 100) + '%';
      var need = Math.floor(f * 10);
      if (need > diagRun.ticks) { diagRun.ticks = need; Au.tick(); }
      if (f >= 0.99) { $('diagLabel').textContent = 'Running diagnostic...'; diagRun = null; }
    }
    refreshActions();
    scene.update(dt / 1000);
    scene.render();
    requestAnimationFrame(frame);
  }
  setCw('neutral');
  requestAnimationFrame(frame);
})(window);
