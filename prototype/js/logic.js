/* OFFLINE - game logic. No DOM, no rendering. Driven by tick(dtMs) so it is deterministic and testable. */
(function (global) {
  'use strict';

  var ACTIONS = [
    { id: 'tray', label: 'Check the paper tray' },
    { id: 'restart', label: 'Restart the printer' },
    { id: 'ink', label: 'Check the ink cartridge' },
    { id: 'cable', label: 'Unplug and replug the cable' },
    { id: 'pause', label: 'Pause the operation' },
    { id: 'diagnostic', label: 'Run a diagnostic' }
  ];

  var RIDDLE_1 = 'I entered hungry and stopped halfway. Find where I gave up.';

  var STATES = [
    {
      n: 1, key: 'jam', name: 'Paper Jam', timer: 60, riddle: RIDDLE_1,
      correct: 'tray', errorPick: 'jam', fakeDelay: 2000, diagMs: 4000, queueAfter: 31,
      comments: ["It's been like this since Tuesday.", "I'm just finishing something."],
      hints: { good: 'The thing that feeds it is also where it choked.', bad: 'Restart it. Printers like that.' }
    },
    {
      n: 2, key: 'ink', name: 'Ink Low', timer: 50, riddle: 'I gave everything I had. Now look inside.',
      correct: 'ink', errorPick: 'ink', fakeDelay: 3000, diagMs: 5000, queueAfter: 19,
      comments: ["I'd check the tray. Or don't.", "I'm just finishing something."],
      hints: { good: 'It runs on color. One of them gave up.', bad: "It's the tray again. Obviously." }
    },
    {
      n: 3, key: 'offline', name: 'Offline', timer: 45, riddle: RIDDLE_1,
      correct: null, secondary: 'wifi', errorPick: 'wifidot', fakeDelay: 3000, diagMs: 6000, queueAfter: 8,
      comments: ["you've heard this one before.", "you've heard this one before."],
      hints: { good: 'It knows the words but forgot where to send them.', bad: 'Run a diagnostic. It is thorough.' }
    },
    {
      n: 4, key: 'heat', name: 'Overheating', timer: 40, riddle: 'Too much. Too long. Too loud. Quiet everything.',
      correct: 'pause', errorPick: 'printer', transitionMs: 5000, fakeDelay: 3000, diagMs: 9000, queueAfter: 1,
      comments: ['Some things are better left running.', "I don't touch it anymore."],
      hints: { good: 'Stop trying to fix it. Just stop it.', bad: 'Unplug it. Hard reset.' }
    },
    {
      n: 5, key: 'cable', name: 'Plug In, Plug Out', timer: 0, riddle: 'You already have everything you need.',
      correct: null, secondary: 'cable', errorPick: 'printer', fakeDelay: 3000, diagMs: 5000, queueAfter: 0,
      comments: ['Have you tried looking at it?', 'The list was never mine.'],
      hints: { good: "You're looking at screens when the answer is behind everything.", bad: 'Restart it. Three times if needed.' }
    }
  ];

  var BASE = 1000, P_WRONG = 100, P_HINT = 200, P_EXPIRE = 150, P_EXHAUST = 500;
  var START_QUEUE = 47;
  var INTRO_MS = 4500;
  var REACTIONS = ['nod', 'hm', 'eye', 'notebook'];

  function Game(opts) {
    opts = opts || {};
    this.rng = opts.rng || Math.random;
    this.listeners = {};
    this.clock = 0;
    this.pending = [];
    this.phase = 'menu';
    this.banked = 0;
    this.elapsedMs = 0;
    this.queue = START_QUEUE;
    this.stateScores = [];
    this.penalties = [0, 0, 0, 0, 0];
    this.stateIndex = -1;
    this.busy = false;
    this.cableUnplugged = false;
    this.panelOpen = false;
    this.pageReady = false;
    this.result = null;
  }

  Game.prototype.on = function (evt, fn) {
    (this.listeners[evt] = this.listeners[evt] || []).push(fn);
    return this;
  };
  Game.prototype.emit = function (evt, data) {
    var ls = this.listeners[evt] || [];
    for (var i = 0; i < ls.length; i++) ls[i](data || {});
  };
  Game.prototype.schedule = function (ms, fn, tag) {
    this.pending.push({ at: this.clock + ms, fn: fn, tag: tag || '' });
  };
  Game.prototype.clearPending = function (tag) {
    this.pending = this.pending.filter(function (p) { return tag ? p.tag !== tag : false; });
  };
  Game.prototype.state = function () { return STATES[this.stateIndex]; };

  Game.prototype.start = function () {
    if (this.phase !== 'menu') return;
    this.phase = 'intro';
    this.emit('intro');
  };

  Game.prototype.beginPlay = function () {
    if (this.phase !== 'intro') return;
    this.startState(0);
  };

  Game.prototype.startState = function (i, isReset) {
    this.stateIndex = i;
    var s = STATES[i];
    this.phase = 'playing';
    this.busy = false;
    this.timeLeft = s.timer * 1000;
    this.warned = false;
    this.severity = isReset ? this.severity : 0;
    this.wrong = 0;
    this.used = {};
    this.usedCount = 0;
    this.hintUsed = false;
    this.hintUnlocked = false;
    this.coworkerClicks = 0;
    this.cableUnplugged = false;
    this.panelOpen = false;
    this.clearPending();
    this.emit('stateStart', { index: i, state: s, reset: !!isReset, queue: this.queue });
    if (!isReset) {
      var self = this;
      this.busy = true;
      this.emit('riddle', { text: s.riddle, ms: INTRO_MS });
      this.schedule(INTRO_MS, function () {
        if (self.stateIndex !== i || self.phase !== 'playing') return;
        self.busy = false;
        self.emit('stateReady', { index: i });
      }, 'intro');
    }
  };

  Game.prototype.score = function () {
    var cur = this.stateIndex >= 0 && this.phase === 'playing' ? Math.max(0, BASE - this.penalties[this.stateIndex]) : 0;
    return this.banked + cur;
  };
  Game.prototype.minutes = function () { return this.elapsedMs / 60000; };

  Game.prototype.tick = function (dt) {
    this.clock += dt;
    if (this.phase === 'playing' || this.phase === 'transition') this.elapsedMs += dt;

    if (this.phase === 'playing' && !this.busy && this.stateIndex >= 0) {
      var s = STATES[this.stateIndex];
      if (s.timer > 0) {
        var before = this.timeLeft;
        this.timeLeft -= dt;
        if (!this.warned && this.timeLeft <= 10000) {
          this.warned = true;
          this.emit('timerWarn');
        }
        if (this.timeLeft <= 0) this.expire(s);
        else if (Math.floor(before / 1000) !== Math.floor(this.timeLeft / 1000)) this.emit('timerSecond', { left: this.timeLeft });
      }
    }

    var guard = 0;
    while (guard++ < 50) {
      var due = null, idx = -1;
      for (var i = 0; i < this.pending.length; i++) {
        var p = this.pending[i];
        if (p.at <= this.clock && (!due || p.at < due.at)) { due = p; idx = i; }
      }
      if (!due) break;
      this.pending.splice(idx, 1);
      due.fn();
    }
  };

  Game.prototype.expire = function (s) {
    this.penalties[this.stateIndex] += P_EXPIRE;
    this.severity++;
    this.timeLeft = (s.timer * 1000) / 2;
    this.warned = false;
    this.emit('expire', { severity: this.severity, penalty: P_EXPIRE });
    this.emit('score');
  };

  Game.prototype.openPanel = function () {
    if (this.phase !== 'playing' || this.busy || this.cableUnplugged || this.panelOpen) return false;
    this.panelOpen = true;
    this.emit('panelOpen', { state: this.state() });
    return true;
  };
  Game.prototype.closePanel = function () {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    this.emit('panelClose');
  };

  Game.prototype.act = function (id) {
    if (this.phase !== 'playing' || this.busy || !this.panelOpen) return false;
    var s = this.state();
    this.emit('actionClick', { id: id });
    if (s.correct === id) { this.solve(); return true; }
    this.wrongAction(id, s);
    return false;
  };

  Game.prototype.wrongAction = function (id, s) {
    var self = this;
    var i = this.stateIndex;
    if (!this.used[id]) { this.used[id] = true; this.usedCount++; }
    this.wrong++;
    this.penalties[i] += P_WRONG;
    this.emit('wrong', { id: id, count: this.wrong, penalty: P_WRONG });
    this.emit('score');
    this.emit('coworkerReact', { kind: REACTIONS[Math.floor(this.rng() * REACTIONS.length)] });

    if (id === 'diagnostic') {
      this.emit('diagnostic', { ms: s.diagMs });
    } else {
      this.emit('fakeRecovery', { delay: s.fakeDelay });
      this.schedule(s.fakeDelay, function () {
        if (self.phase !== 'playing' || self.stateIndex !== i) return;
        self.severity++;
        self.emit('fail', { severity: self.severity });
      }, 'fail');
    }

    if (this.wrong >= 3 && !this.hintUsed) this.deliverHint();

    if (i !== 4 && this.usedCount >= ACTIONS.length) this.exhaust();
  };

  Game.prototype.exhaust = function () {
    var self = this;
    var i = this.stateIndex;
    this.busy = true;
    this.panelOpen = false;
    this.clearPending('fail');
    this.penalties[i] += P_EXHAUST;
    this.emit('exhaust', { penalty: P_EXHAUST });
    this.emit('score');
    this.schedule(3000, function () { self.startState(i, true); }, 'reset');
  };

  Game.prototype.deliverHint = function () {
    if (this.hintUsed) return null;
    var s = this.state();
    this.hintUsed = true;
    this.penalties[this.stateIndex] += P_HINT;
    var accurate = this.rng() < 0.3;
    var text = accurate ? s.hints.good : s.hints.bad;
    this.emit('hint', { text: text, penalty: P_HINT });
    this.emit('score');
    return text;
  };

  Game.prototype.coworkerClick = function () {
    if (this.phase !== 'playing' || this.busy) return;
    var s = this.state();
    this.coworkerClicks++;
    var n = this.coworkerClicks;
    if (n === 1) this.emit('coworker', { kind: 'riddle', text: s.riddle });
    else if (n === 2) {
      var text = (this.wrong > 0 && s.comments[1]) ? s.comments[1] : s.comments[0];
      this.emit('coworker', { kind: 'comment', text: text });
    } else this.emit('coworker', { kind: 'silence' });
  };

  Game.prototype.secondary = function (id) {
    if (this.phase !== 'playing' || this.busy) return;
    var s = this.state();
    if (id === 'wifi' && s.secondary === 'wifi' && this.panelOpen) this.solve();
    else if (id === 'cable' && s.secondary === 'cable' && !this.cableUnplugged) this.unplug();
    else if (id === 'port' && s.secondary === 'cable' && this.cableUnplugged) this.plugIn();
  };

  Game.prototype.secondaryAvailable = function (id) {
    if (this.phase !== 'playing' || this.busy) return false;
    var s = this.state();
    if (id === 'wifi') return s.secondary === 'wifi' && this.panelOpen;
    if (id === 'cable') return s.secondary === 'cable' && !this.cableUnplugged;
    if (id === 'port') return s.secondary === 'cable' && this.cableUnplugged;
    return false;
  };

  Game.prototype.unplug = function () {
    this.cableUnplugged = true;
    this.panelOpen = false;
    this.clearPending('fail');
    this.emit('unplug');
  };

  Game.prototype.plugIn = function () {
    var self = this;
    this.busy = true;
    this.cableUnplugged = false;
    this.emit('plugIn');
    this.schedule(2800, function () { self.busy = false; self.solve(); });
  };

  Game.prototype.solve = function () {
    var self = this;
    var i = this.stateIndex;
    var s = STATES[i];
    var stateScore = Math.max(0, BASE - this.penalties[i]);
    this.stateScores[i] = stateScore;
    this.banked += stateScore;
    this.queue = s.queueAfter;
    this.phase = 'transition';
    this.panelOpen = false;
    this.clearPending();
    this.emit('solved', { index: i, state: s, score: stateScore, perfect: this.penalties[i] === 0, queue: this.queue });
    this.emit('score');
    if (i < STATES.length - 1) {
      this.schedule(s.transitionMs || 3500, function () { self.startState(i + 1); });
    } else {
      this.ending();
    }
  };

  Game.prototype.ending = function () {
    var self = this;
    this.phase = 'ending';
    this.pageClicked = false;
    this.schedule(1200, function () { self.emit('print'); });
    this.schedule(3200, function () { self.pageReady = true; self.emit('pageLanded'); self.emit('perfect'); });
    this.schedule(20000, function () { self.pageClick(); }, 'pageauto');
  };

  Game.prototype.pageClick = function () {
    var self = this;
    if (this.phase !== 'ending' || !this.pageReady || this.pageClicked) return;
    this.pageClicked = true;
    this.clearPending('pageauto');
    this.emit('pageOpen');
    this.schedule(2800, function () {
      var minutes = Math.max(self.minutes(), 1 / 60);
      self.result = { score: self.banked, minutes: minutes, rating: self.banked / minutes, closeIn: 8 };
      self.emit('rating', self.result);
    });
    this.schedule(10800, function () { self.phase = 'closed'; self.emit('close'); });
  };

  Game.ACTIONS = ACTIONS;
  Game.STATES = STATES;
  Game.START_QUEUE = START_QUEUE;
  global.OFFLINE = global.OFFLINE || {};
  global.OFFLINE.Game = Game;
})(window);
