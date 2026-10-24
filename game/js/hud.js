// HUD: score / queue / timer chips, toasts, the riddle card and the red failure flash.
(function (O) {
  const $ = id => document.getElementById(id);
  const ui = $('game-ui'), scoreEl = $('score'), queueEl = $('queue'), timerEl = $('timer');
  const chipS = $('chip-score'), chipQ = $('chip-queue'), chipT = $('chip-time');
  const riddleEl = $('riddle'), toasts = $('toasts'), flashEl = $('flash');
  let score = 0, queue = 47, riddleTimer = 0;

  function pulse(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

  O.hud = {
    show(on) { ui.hidden = !on; },
    score(v) {
      if (v === score) return;
      pulse(chipS, v > score ? 'bump' : 'loss');
      score = v; scoreEl.textContent = v;
    },
    queue(v) {
      if (v === queue) return;
      pulse(chipQ, 'bump');
      queue = v; queueEl.textContent = v;
    },
    time(sec) {
      if (sec == null) { timerEl.textContent = '--'; chipT.classList.remove('warn'); return; }
      timerEl.textContent = sec;
      chipT.classList.toggle('warn', sec <= 10);
    },
    riddle(text, ms) {
      clearTimeout(riddleTimer);
      riddleEl.textContent = text; riddleEl.hidden = false;
      riddleEl.style.animation = 'none'; void riddleEl.offsetWidth; riddleEl.style.animation = '';
      if (ms) riddleTimer = setTimeout(() => { riddleEl.hidden = true; }, ms);
    },
    toast(text, kind, ms) {
      const t = document.createElement('div');
      t.className = 'toast' + (kind ? ' ' + kind : ''); t.textContent = text;
      toasts.appendChild(t);
      while (toasts.children.length > 4) toasts.removeChild(toasts.firstChild);
      setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, ms || 3400);
    },
    flash() {
      flashEl.classList.add('on');
      setTimeout(() => flashEl.classList.remove('on'), 140);
    },
    reset() {
      O.hud.time(null);
      riddleEl.hidden = true; toasts.innerHTML = '';
    },
    // the current displayed values are the baseline for bump / loss animations
    jump(s, q) { score = s; queue = q; scoreEl.textContent = s; queueEl.textContent = q; }
  };
})(window.Offline);
