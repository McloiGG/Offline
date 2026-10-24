// What a click does once the camera is on a part. Looking is free; deliberate fixes (pull the jam, swap a cartridge,
// reload the paper, boost the fans, pull the plug) are guesses, so a wrong one costs points and has a consequence.
(function (O) {
  const C = window.Cetak, P = O.pick, G = O.game, W = O.world, S = O.screen, F = O.fx, H = O.hud, X = O.sfx, HD = O.hands;
  const { ZF, X: PX } = C.config;
  const d = P.defs;
  const key = () => (G.playing() ? G.state().key : '');
  const addZone = (m, name) => { m.userData.zone = name; P.zones.push(m); return m; };

  // ---- touchscreen ----
  d.screen.click = hit => { if (hit.object === S.face) S.press(hit); };

  // ---- paper tray: open / close is free ----
  d.tray.enter = () => F.openTray();
  addZone(F.jamHit, 'tray');
  let reloading = false;
  d.tray.click = hit => {
    const o = hit.object;
    if (o === F.jamHit) return pullJam();
    if (o.geometry && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.height <= 0.25 && F.trayOpen()) return reload();
    if (F.trayOpen()) F.closeTray(); else F.openTray();
  };
  let pulling = false;
  function pullJam() {
    if (pulling) return;
    pulling = true; X.pull(); HD.flash('reach', 500);
    F.tween(0.5, k => { F.jam.position.y = k * 16; F.jam.scale.setScalar(1 - k * 0.85); }, () => {
      pulling = false; F.setJam(false);
      G.act('tray');
    });
  }
  function reload() {
    if (reloading) return;
    reloading = true; X.swap();
    const had = W.paper;
    F.setPaper(0);
    setTimeout(() => { F.setPaper(Math.max(had, 20)); reloading = false; }, 900);
    if (G.playing()) G.act('tray', false); else H.toast('Paper reloaded', 'good', 1500);
  }

  // ---- ink tanks: click one to swap that cartridge ----
  [392, 408, 424, 440].forEach((cx, i) => {
    const m = P.mk(4.2, 12, 4, PX(cx), 66.3, ZF + 4.2);
    m.userData.tank = i; addZone(m, 'ink');
  });
  const swapping = [false, false, false, false];
  d.ink.click = hit => {
    const i = hit.object.userData.tank;
    if (i === undefined || swapping[i]) return;
    swapping[i] = true; X.swap(); HD.flash('reach', 700);
    const from = W.ink[i], right = key() === 'ink' && i === F.emptyTank;
    F.tween(0.45, k => F.setInk(i, from * (1 - k)), () => {
      F.tween(0.5, k => F.setInk(i, k), () => {
        swapping[i] = false; X.click();
        if (G.playing()) G.act('ink', right);
      });
    });
    if (!G.playing()) return;
    H.toast(O.INK_NAMES[i] + ' cartridge out...', '', 1200);
  };

  // ---- fans: boosting them while it overheats is a wrong guess ----
  d.vent.click = () => {
    X.blip(); HD.flash('press', 300);
    if (key() === 'heat') G.act('vent', false);
    else H.toast('The fans spin freely. Nothing wrong with them.', '', 2200);
  };

  // ---- the printer's power inlet ----
  d.port.click = () => { X.blip(); H.toast(C.parts.power.isPlugged() ? 'The cable is seated.' : 'No cable. No power.', '', 1800); };

  // ---- feedback for every click / hover / drag ----
  P.onClick = () => { X.click(); HD.flash('press', 220); };
  P.onHover = name => HD.rest(name ? 'hover' : 'idle');
  P.onDrag = on => { HD.rest(on ? 'pull-cable' : 'idle'); if (on) X.blip(); };
})(window.Offline);
