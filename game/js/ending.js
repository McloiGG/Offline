// The ending: one page prints, the player opens it (it is blank), the coworker says "perfect.",
// the Efficiency Rating shows, and the game closes itself.
(function (O) {
  const C = window.Cetak, G = O.game, P = O.pick, H = O.hud, X = O.sfx, CW = O.coworker;
  const { X: PX, Y: PY, ZF } = C.config;
  const $ = id => document.getElementById(id);
  const endEl = $('end'), pageView = $('page-view'), rating = $('rating'), black = $('black');
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));

  // The sheet that lands in the output tray is the clickable page.
  const pageHit = P.mk(30, 6, 18, PX(446), PY(180) + 4, ZF + 1);
  pageHit.visible = false;
  P.register('page', 'print', [pageHit], {
    enter() { G.pageClick(); },
    click() { G.pageClick(); }
  });

  O.endingReset = () => {
    while (timers.length) clearTimeout(timers.pop());
    pageHit.visible = false;
    C.scene.stack.children.forEach(m => { if (m.isMesh && Array.isArray(m.material) && m.material.length === 6 && m.userData.slot !== undefined) { m.visible = false; m.userData.active = false; } });
    endEl.hidden = true; pageView.hidden = true; rating.hidden = true; black.hidden = true; black.innerHTML = '';
  };

  // The page that comes out is blank: the demo prints a CMYK sample on one pooled sheet's top face, so give every pooled sheet plain paper.
  const blankSheets = () => C.scene.stack.children.forEach(m => {
    if (m.isMesh && Array.isArray(m.material) && m.material.length === 6) m.material[2] = C.mat.paper;
  });

  G.on('print', () => {
    C.ui.views.goTo('print');
    blankSheets();
    C.anim.printing.start();                           // the sound and a single sheet
    later(2900, () => C.anim.printing.stop());         // before the model spawns a second sheet (every 3.0 s); the first one still lands
  });
  G.on('pageLanded', () => {
    pageHit.visible = true;
    X.page(); H.toast('A page came out. Open it.', 'good', 6000);
    CW.expr('notebook', 2500);
  });
  G.on('pageOpen', () => {
    pageHit.visible = false;
    H.clearToasts();
    endEl.hidden = false; pageView.hidden = false; rating.hidden = true;
    O.hands.lower(true);
    X.chime(); CW.expr('nod', 6000); CW.say('perfect.', 6000);
  });
  G.on('rating', d => {
    pageView.hidden = true; rating.hidden = false;
    $('rating-num').textContent = Math.round(d.rating);
    $('rating-detail').textContent = d.score + ' points in ' + d.minutes.toFixed(1) + ' min';
    let left = d.closeIn;
    const show = () => { $('rating-close').textContent = 'The printer is working. Closing in ' + left + '...'; };
    show();
    for (let i = 1; i <= d.closeIn; i++) later(i * 1000, () => { left = d.closeIn - i; show(); });
  });
  G.on('close', () => {
    rating.hidden = true; endEl.hidden = true;
    black.hidden = false;
    black.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#8a8f98;font:22px Georgia,serif">' +
      '<div><div style="font-size:15px;letter-spacing:.3em;margin-bottom:18px">OFFLINE</div>The printer is working.<br>' +
      '<button id="again" style="margin-top:26px;font:700 16px Georgia,serif;padding:10px 22px;border-radius:8px;border:2px solid #555;background:none;color:#bbb;cursor:pointer">Play again</button></div></div>';
    $('again').onclick = () => O.session.toMenu();
  });
})(window.Offline);
