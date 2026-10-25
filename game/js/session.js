// Session: main menu buttons, starting / restarting a run, pause card, Back, Esc, mute, GamePix pause hooks.
(function (O) {
  const C = window.Cetak, G = O.game, P = O.pick, F = O.fx, H = O.hud, HD = O.hands, CW = O.coworker, E = C.office.engine;
  const $ = id => document.getElementById(id);
  const menu = $('menu'), pauseEl = $('pause'), back = $('btn-back'), howto = $('howto-card');
  const PRINTER_AT = [960, 430];                       // the OFFLINE monitor in the menu art
  const hold = { card: false, sdk: false };
  let muted = false, busy = false, inGame = false;
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clearLater = () => { while (timers.length) clearTimeout(timers.pop()); };

  function applyAudio() {
    O.paused = hold.card || hold.sdk;
    E.setVolume(muted || O.paused ? 0 : 0.6);
    if (E.ctx) { if (O.paused) E.ctx.suspend(); else if (E.ctx.state === 'suspended') E.ctx.resume(); }
    $('p-mute').textContent = 'SOUND: ' + (muted ? 'OFF' : 'ON');
  }
  function setCard(on) {
    if (on && !inGame) return;
    hold.card = on; pauseEl.hidden = !on; applyAudio();
  }

  // ---- starting a run ----
  function beginGame() {
    clearLater();
    O.endingReset && O.endingReset();
    G.reset(); H.reset(); H.jump(0, 47); H.show(true);
    HD.rest('idle'); HD.lower(false); CW.expr('neutral'); CW.hide();
    C.ui.views.goTo('three'); P.enabled = true; inGame = true;
    G.begin();
  }
  function start() {
    if (busy) return;
    busy = true; E.ensure(); O.sfx.click(); howto.hidden = true;
    O.fit.setZoom(2.7, PRINTER_AT);                    // push into the printer on the art...
    later(800, () => {                                 // ...then fade into the 3D room
      menu.classList.add('leaving'); beginGame();
      setTimeout(() => { if (inGame) menu.hidden = true; busy = false; }, 800);
    });
  }
  function restart() { setCard(false); beginGame(); }

  function toMenu() {
    clearLater(); setCard(false); inGame = false; P.enabled = false;
    G.reset(); F.reset(); H.reset(); H.show(false);
    O.endingReset && O.endingReset();
    C.anim.printing.stop();
    C.ui.views.goTo('office');
    O.fit.setZoom(1, [960, 552]);
    menu.classList.add('leaving'); menu.hidden = false; void menu.offsetWidth;
    menu.classList.remove('leaving'); busy = false;
  }
  O.session = { start, restart, toMenu, setCard, isMuted: () => muted };

  // ---- menu ----
  $('obj-start').onclick = start;
  $('obj-howto').onclick = () => { E.ensure(); O.sfx.click(); howto.hidden = false; };
  howto.onclick = () => { O.sfx.click(); howto.hidden = true; };
  $('obj-quit').onclick = () => {
    E.ensure(); O.sfx.click();
    try { window.close(); } catch (e) { /* only script-opened tabs can close */ }
    const m = document.createElement('div');
    m.id = 'menu-quit-msg'; m.style.cssText = 'background:#000;cursor:pointer;z-index:9;position:absolute;inset:0;display:grid;place-items:center;color:#aaa;font:22px Georgia,serif;text-align:center';
    m.innerHTML = '<div>The printer is still broken.<br><small style="opacity:.6">(You can close this tab. Click to go back.)</small></div>';
    m.onclick = () => m.remove();
    $('stage').appendChild(m);
  };

  // ---- in game ----
  $('btn-menu').onclick = () => { O.sfx.click(); setCard(true); };
  back.onclick = () => { O.sfx.click(); P.out(); };
  $('p-resume').onclick = () => setCard(false);
  $('p-zoomout').onclick = () => { setCard(false); P.out(); };
  $('p-mute').onclick = () => { muted = !muted; applyAudio(); };
  $('p-restart').onclick = restart;
  $('p-menu').onclick = toMenu;
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !inGame) return;
    e.stopPropagation();                               // DANN's own Esc (fly to the 3/4 view) must not run first
    if (hold.card) setCard(false);
    else if (P.zoomed() && G.phase !== 'ending') P.out();
    else setCard(true);
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden && inGame && G.playing()) setCard(true); });

  // the Back button follows the camera
  C.office.updaters.push(() => { back.hidden = !(inGame && P.zoomed()); });

  // ---- GamePix SDK: the platform can pause the game or mute it, and expects the lifecycle calls ----
  const sdk = fn => { try { if (window.GamePix) fn(window.GamePix); } catch (e) { /* the game runs without the SDK */ } };
  sdk(gp => {
    gp.events.on('pause', () => { hold.sdk = true; applyAudio(); });
    gp.events.on('resume', () => { hold.sdk = false; applyAudio(); });
    gp.events.on('soundOff', () => { muted = true; applyAudio(); });
    gp.events.on('soundOn', () => { muted = false; applyAudio(); });
  });
  addEventListener('load', () => sdk(gp => gp.lifecycle.loaded()));
  addEventListener('pointerdown', () => sdk(gp => gp.lifecycle.firstInteraction()), { once: true });
  G.on('stateStart', d => { if (d.index === 0 && !d.reset) sdk(gp => gp.lifecycle.gameStart()); });
  G.on('rating', r => sdk(gp => gp.updateScore(Math.round(r.score))));
  G.on('close', () => sdk(gp => gp.gameStop()));
})(window.Offline);
