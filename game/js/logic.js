// Game rules. No DOM, no rendering; driven by tick(dtMs). Ported from the prototype, minus the lockouts:
// every control works at any time, and a wrong move simply costs points and has a consequence.
(function (O) {
  'use strict';
  const ACTIONS = ['tray', 'restart', 'ink', 'cable', 'pause', 'diagnostic'];
  const R1 = 'I entered hungry and stopped halfway. Find where I gave up.';
  const STATES = [
    { n: 1, key: 'jam', name: 'Paper Jam', timer: 60, riddle: R1, correct: 'tray', fakeDelay: 2000, diagMs: 4000, queueAfter: 31,
      comments: ["It's been like this since Tuesday.", "I'm just finishing something."],
      hints: { good: 'The thing that feeds it is also where it choked.', bad: 'Restart it. Printers like that.' } },
    { n: 2, key: 'ink', name: 'Ink Low', timer: 50, riddle: 'I gave everything I had. Now look inside.', correct: 'ink', fakeDelay: 3000, diagMs: 5000, queueAfter: 19,
      comments: ["I'd check the tray. Or don't.", "I'm just finishing something."],
      hints: { good: 'It runs on color. One of them gave up.', bad: "It's the tray again. Obviously." } },
    { n: 3, key: 'offline', name: 'Offline', timer: 45, riddle: R1, correct: 'wifi', fakeDelay: 3000, diagMs: 6000, queueAfter: 8,
      comments: ["you've heard this one before.", "you've heard this one before."],
      hints: { good: 'It knows the words but forgot where to send them.', bad: 'Run a diagnostic. It is thorough.' } },
    { n: 4, key: 'heat', name: 'Overheating', timer: 40, riddle: 'Too much. Too long. Too loud. Quiet everything.', correct: 'pause', transitionMs: 5000, fakeDelay: 3000, diagMs: 9000, queueAfter: 1,
      comments: ['Some things are better left running.', "I don't touch it anymore."],
      hints: { good: 'Stop trying to fix it. Just stop it.', bad: 'Unplug it. Hard reset.' } },
    { n: 5, key: 'cable', name: 'Plug In, Plug Out', timer: 0, riddle: 'You already have everything you need.', correct: null, fakeDelay: 3000, diagMs: 5000, queueAfter: 0,
      comments: ['Have you tried looking at it?', 'The list was never mine.'],
      hints: { good: "You're looking at screens when the answer is behind everything.", bad: 'Restart it. Three times if needed.' } }
  ];
  const BASE = 1000, P_WRONG = 100, P_HINT = 200, P_EXPIRE = 150, P_EXHAUST = 500, START_QUEUE = 47, RIDDLE_MS = 4500;
  const PAGE_MS = 3600;                                // the printer model's sheet: 2.2 s sucked in + 0.9 s slide + 0.4 s drop onto the tray
  const REACTIONS = ['nod', 'hm', 'eye', 'notebook'];

  function Game() {
    this.listeners = {}; this.clock = 0; this.pending = []; this.phase = 'menu';
    this.banked = 0; this.elapsedMs = 0; this.queue = START_QUEUE; this.penalties = [0, 0, 0, 0, 0];
    this.stateIndex = -1; this.severity = 0; this.pageReady = false; this.result = null;
  }
  const G = Game.prototype;
  G.on = function (e, fn) { (this.listeners[e] = this.listeners[e] || []).push(fn); return this; };
  G.emit = function (e, d) { (this.listeners[e] || []).slice().forEach(fn => fn(d || {})); };
  G.schedule = function (ms, fn, tag) { this.pending.push({ at: this.clock + ms, fn, tag: tag || '' }); };
  G.clearPending = function (tag) { this.pending = tag ? this.pending.filter(p => p.tag !== tag) : []; };
  G.state = function () { return STATES[this.stateIndex]; };
  G.playing = function () { return this.phase === 'playing'; };

  G.reset = function () {
    const listeners = this.listeners;
    Game.call(this);
    this.listeners = listeners;
  };
  G.begin = function () { this.banked = 0; this.elapsedMs = 0; this.queue = START_QUEUE; this.penalties = [0, 0, 0, 0, 0]; this.severity = 0; this.startState(0); };

  G.startState = function (i, isReset) {
    const s = STATES[i];
    this.stateIndex = i; this.phase = 'playing'; this.timeLeft = s.timer * 1000; this.warned = false;
    if (!isReset) this.severity = 0;
    this.wrong = 0; this.used = {}; this.usedCount = 0; this.hintUsed = false; this.coworkerClicks = 0; this.unplugged = false;
    this.clearPending();
    this.emit('stateStart', { index: i, state: s, reset: !!isReset, queue: this.queue });
    if (!isReset) this.emit('riddle', { text: s.riddle, ms: RIDDLE_MS });
  };

  G.score = function () {
    const cur = this.playing() ? Math.max(0, BASE - this.penalties[this.stateIndex]) : 0;
    return this.banked + cur;
  };
  G.minutes = function () { return this.elapsedMs / 60000; };

  G.tick = function (dt) {
    this.clock += dt;
    if (this.phase === 'playing' || this.phase === 'transition') this.elapsedMs += dt;
    if (this.playing()) {
      const s = this.state();
      if (s.timer > 0) {
        const before = this.timeLeft;
        this.timeLeft -= dt;
        if (!this.warned && this.timeLeft <= 10000) { this.warned = true; this.emit('timerWarn'); }
        if (this.timeLeft <= 0) this.expire(s);
        else if (Math.floor(before / 1000) !== Math.floor(this.timeLeft / 1000)) this.emit('timerSecond', { left: this.timeLeft });
      }
    }
    for (let guard = 0; guard < 50; guard++) {
      let due = null, idx = -1;
      this.pending.forEach((p, i) => { if (p.at <= this.clock && (!due || p.at < due.at)) { due = p; idx = i; } });
      if (!due) break;
      this.pending.splice(idx, 1);
      due.fn();
    }
  };

  G.expire = function (s) {
    this.penalties[this.stateIndex] += P_EXPIRE; this.severity++;
    this.timeLeft = s.timer * 500; this.warned = false;
    this.emit('expire', { severity: this.severity, penalty: P_EXPIRE }); this.emit('score');
  };

  // A completed action (a tap on the screen, a part swapped, the plug replugged). Returns true if it fixed the fault.
  // `ok === false` forces a wrong move (e.g. the right kind of part, but the wrong one).
  G.act = function (id, ok) {
    if (!this.playing()) return false;
    const s = this.state();
    this.emit('actionClick', { id });
    if (ok !== false && s.correct === id) { this.solve(); return true; }
    if (id === 'wifi') return false;
    this.wrongAction(id, s);
    return false;
  };

  G.wrongAction = function (id, s) {
    const i = this.stateIndex;
    if (ACTIONS.indexOf(id) >= 0 && !this.used[id]) { this.used[id] = true; this.usedCount++; }
    this.wrong++; this.penalties[i] += P_WRONG;
    this.emit('wrong', { id, count: this.wrong, penalty: P_WRONG }); this.emit('score');
    this.emit('coworkerReact', { kind: REACTIONS[Math.floor(Math.random() * REACTIONS.length)] });
    if (id === 'diagnostic') this.emit('diagnostic', { ms: s.diagMs });
    else {
      this.emit('fakeRecovery', { id, delay: s.fakeDelay });
      this.schedule(s.fakeDelay, () => {
        if (!this.playing() || this.stateIndex !== i) return;
        this.severity++; this.emit('fail', { id, severity: this.severity });
      }, 'fail');
    }
    if (this.wrong >= 3 && !this.hintUsed) this.deliverHint();
    if (i !== 4 && this.usedCount >= ACTIONS.length) this.exhaust();
  };

  G.exhaust = function () {
    const i = this.stateIndex;
    this.clearPending('fail'); this.penalties[i] += P_EXHAUST;
    this.emit('exhaust', { penalty: P_EXHAUST }); this.emit('score');
    this.schedule(3000, () => this.startState(i, true), 'reset');
  };

  G.deliverHint = function () {
    if (this.hintUsed) return;
    const s = this.state();
    this.hintUsed = true; this.penalties[this.stateIndex] += P_HINT;
    this.emit('hint', { text: Math.random() < 0.3 ? s.hints.good : s.hints.bad, penalty: P_HINT }); this.emit('score');
  };

  G.coworkerClick = function () {
    if (!this.playing()) return;
    const s = this.state(), n = ++this.coworkerClicks;
    if (n === 1) this.emit('coworker', { kind: 'riddle', text: s.riddle });
    else if (n === 2) this.emit('coworker', { kind: 'comment', text: (this.wrong > 0 && s.comments[1]) ? s.comments[1] : s.comments[0] });
    else this.emit('coworker', { kind: 'silence' });
  };

  // State 5: pulling the plug does nothing by itself; replugging after it finishes the job.
  G.unplug = function () { if (this.playing()) { this.unplugged = true; this.clearPending('fail'); this.emit('unplug'); } };
  G.plugIn = function () {
    if (!this.playing()) return;
    const was = this.unplugged; this.unplugged = false; this.emit('plugIn');
    if (this.stateIndex === 4 && was) this.schedule(2800, () => { if (this.playing()) this.solve(); }, 'boot');
    else this.act('cable');
  };

  G.solve = function () {
    const i = this.stateIndex, s = STATES[i];
    const stateScore = Math.max(0, BASE - this.penalties[i]);
    this.banked += stateScore; this.queue = s.queueAfter; this.phase = 'transition'; this.clearPending();
    this.emit('solved', { index: i, state: s, score: stateScore, perfect: this.penalties[i] === 0, queue: this.queue }); this.emit('score');
    if (i < STATES.length - 1) this.schedule(s.transitionMs || 3500, () => this.startState(i + 1));
    else this.ending();
  };

  G.ending = function () {
    this.phase = 'ending'; this.pageClicked = false;
    this.schedule(1200, () => this.emit('print'));
    this.schedule(1200 + PAGE_MS, () => { this.pageReady = true; this.emit('pageLanded'); this.emit('perfect'); });
    this.schedule(22000, () => this.pageClick(), 'pageauto');
  };

  G.pageClick = function () {
    if (this.phase !== 'ending' || !this.pageReady || this.pageClicked) return;
    this.pageClicked = true; this.clearPending('pageauto'); this.emit('pageOpen');
    this.schedule(2800, () => {
      const minutes = Math.max(this.minutes(), 1 / 60);
      this.result = { score: this.banked, minutes, rating: this.banked / minutes, closeIn: 8 };
      this.emit('rating', this.result);
    });
    this.schedule(10800, () => { this.phase = 'closed'; this.emit('close'); });
  };

  Game.ACTIONS = ACTIONS; Game.STATES = STATES; Game.START_QUEUE = START_QUEUE;
  O.Game = Game;
})(window.Offline);
