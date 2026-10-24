// Flow controller: connects the rules (Offline.Game) to the HUD, the coworker, the printer and the touchscreen.
(function (O) {
  const C = window.Cetak, G = O.game = new O.Game(), W = O.world, S = O.screen, H = O.hud, F = O.fx, X = O.sfx;
  const CW = O.coworker, HD = O.hands;
  const PROGRESS = [0.5, 0.35, 0.8, 0.9, 0.99];
  const WRONG = {
    tray: 'The tray was fine', restart: 'Restarting fixed nothing', ink: 'That cartridge is fine', cable: 'Power-cycling did nothing',
    pause: 'Pausing was not the answer', diagnostic: 'The diagnostic found nothing', vent: 'Poking the fan helps nothing'
  };
  const AGAIN = ['It is still broken.', 'Same fault. Still ticking.', 'The fault came straight back.'];

  O.paused = false;

  // ---- the rules drive the world ----
  G.on('stateStart', d => {
    if (d.reset || d.index === 0) F.reset();
    W.queue = G.queue; H.queue(G.queue); H.time(d.state.timer || null);
    W.progress = PROGRESS[d.index];
    F.apply(d.state.key);
    if (d.state.key === 'offline' || d.state.key === 'cable') C.office.audio.play('warning');
    H.score(G.score());
  });
  G.on('riddle', d => H.riddle(d.text, d.ms));
  G.on('score', () => H.score(G.score()));
  G.on('timerWarn', () => CW.expr('glance', 2500));
  G.on('timerSecond', d => { const s = Math.ceil(d.left / 1000); H.time(s); if (s <= 10) X.tick(s % 2); });
  G.on('expire', d => {
    H.time(Math.ceil(G.timeLeft / 1000)); H.flash(); X.fail();
    H.toast("Time's up!  -" + d.penalty, 'bad'); CW.expr('eye', 1800);
  });
  G.on('actionClick', () => HD.flash('press', 300));
  G.on('wrong', d => {
    X.wrong();
    const msg = (d.id === 'tray' && G.state().key === 'jam') ? 'Fresh paper, same jam' : (WRONG[d.id] || 'That did nothing');
    H.toast(msg + '  -' + d.penalty, 'bad');
  });
  G.on('coworkerReact', d => CW.expr(d.kind, 1600));

  // A wrong move looks fixed for a moment (green tick), then the fault comes back.
  G.on('fakeRecovery', d => {
    X.fakeOk();
    const ms = d.delay, boot = Math.min(1500, ms * 0.55);
    if (d.id === 'restart') S.boot(boot, () => S.flash('Printer restarted', 'ok', ms - boot));
    else if (d.id === 'cable') { /* the boot screen after a replug is the fake recovery */ }
    else S.flash(d.id === 'pause' ? 'Job paused' : 'Looks fixed', 'ok', ms);
    H.toast(d.id === 'vent' ? 'The fans roar. Is it cooling?' : 'That seems to have worked...', 'good', ms);
  });
  G.on('fail', () => {
    X.fail(); H.flash(); CW.expr('hm', 1500);
    S.flash('Not fixed. Fault still present', 'bad', 1800);
    H.toast(AGAIN[Math.floor(Math.random() * AGAIN.length)], 'bad');
  });
  G.on('diagnostic', d => S.startDiag(d.ms));
  G.on('hint', d => { X.hint(); CW.say(d.text, 6500, 'hint'); CW.expr('lean', 3000); H.toast('Hint  -' + d.penalty, 'warn'); });
  G.on('exhaust', d => {
    H.flash(); X.fail(); S.flash('Factory reset', 'warn', 2800);
    H.toast('Everything tried. The printer resets.  -' + d.penalty, 'bad', 4200);
  });
  G.on('coworker', d => {
    if (d.kind === 'silence') return CW.expr('neutral');
    CW.say(d.text, d.kind === 'riddle' ? 6500 : 4500); CW.expr(d.kind === 'riddle' ? 'lean' : 'glance', 2200);
  });
  G.on('solved', d => {
    X.chime(); F.clear(); F.closeTray();
    W.queue = d.queue; W.progress = 1; H.queue(d.queue); H.score(G.score()); H.time(null);
    H.toast('Fixed!  +' + d.score + (d.perfect ? '  Flawless' : ''), 'good', 3200);
    CW.expr('nod', 2200); S.go('home');
    if (G.stateIndex < 4) S.flash('Printer ready', 'ok', 2200);
    if (O.pick.zoomed()) O.pick.out();
  });

  // ---- the touchscreen's own buttons ----
  S.onPress = () => { X.tap(); HD.flash('press', 250); };
  S.onAction = (name) => {
    const playing = G.playing();
    if (name === 'print') { X.wrong(); S.flash(W.fault ? O.FAULT_TEXT[W.fault] : 'Nothing waiting to print', W.fault ? 'bad' : 'warn', 1800); }
    else if (name === 'pause') { if (playing) G.act('pause'); else S.flash('Nothing to pause', 'warn', 1300); }
    else if (name === 'restart') { if (playing) G.act('restart'); else S.boot(1500, null); }
    else if (name === 'diagnostic') { if (playing) G.act('diagnostic'); else S.flash('All checks passed', 'ok', 1500); }
    else if (name === 'reconnect') {
      if (!playing || W.net) S.flash('Already connected', 'ok', 1400); else G.act('wifi');
    } else if (name === 'diag-done') { S.flash('Diagnostic could not finish', 'bad', 1900); S.go('help'); }
  };

  document.getElementById('coworker').addEventListener('click', () => { X.blip(); G.coworkerClick(); });

  // ---- the plug: pulled out and put back ----
  C.parts.power.onChange(plugged => {
    if (performance.now() < F.quietUntil) return;
    if (plugged) G.plugIn(); else G.unplug();
  });
  C.parts.power.onLand(() => HD.flash('idle', 100));

  // ---- one clock for everything ----
  C.office.updaters.push((t, dt) => {
    S.update(dt);
    if (!O.paused) G.tick(dt * 1000);
  });
})(window.Offline);
