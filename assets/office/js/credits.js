// Credits sequence: unplug the printer 5 times quickly and the socket sparks, the office blacks out and the credits roll.
// Needs the power part (onChange) and the office updaters / audio, so load it after audio/index.js.
(function (C) {
  const { scene } = C.scene;
  const { WALL } = C.config;
  const { power } = C.parts;
  const { audio } = C.office;

  const SKIP_CLICKS = 4;                         // clicks during the credits before the "no skipping" text shows
  const UNPLUGS = 5, WITHIN = 8;                // this many unplugs inside this many seconds sets it off
  const SPARK_TIME = 2.2, FADE_TIME = 0.7;       // seconds of sparks, then the fade to black
  const CREDITS = [
    ['A WORKING PRINTER', 'title'],
    ['', 'gap'],
    ['Made by', 'role'], ['CLOWN', 'name'], ['REX', 'name'], ['MARCUS', 'name'], ['MAZ', 'name'],
    ['', 'gap'],
    ['Thank you for fixing the printer.', 'role'],
    ['(You broke it again.)', 'small']
  ];

  // ---- sparks: a burst of glowing points flying out of the socket, plus a flickering orange light ----
  const COUNT = 70;
  const origin = new THREE.Vector3(WALL.socketX, WALL.socketY, WALL.z + 3);
  const positions = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  const life = new Float32Array(COUNT);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const sparks = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xffc34d, size: 1.8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  sparks.frustumCulled = false;
  sparks.visible = false;
  scene.add(sparks);

  const glow = new THREE.PointLight(0xffaa33, 0, 140);
  glow.position.set(origin.x, origin.y + 4, origin.z + 8);
  scene.add(glow);

  function emit(i) {
    positions.set([origin.x, origin.y, origin.z], i * 3);
    const speed = 25 + Math.random() * 45;
    velocities.set([(Math.random() - 0.5) * speed, Math.random() * speed * 0.8, 10 + Math.random() * speed], i * 3);
    life[i] = 0.3 + Math.random() * 0.6;
  }

  function moveSparks(dt, emitting) {
    for (let i = 0; i < COUNT; i++) {
      if (life[i] <= 0) {
        if (emitting && Math.random() < 0.35) emit(i);
        else { positions[i * 3 + 1] = -1000; continue; }
      }
      life[i] -= dt;
      velocities[i * 3 + 1] -= 130 * dt;
      for (let k = 0; k < 3; k++) positions[i * 3 + k] += velocities[i * 3 + k] * dt;
      if (positions[i * 3 + 1] < 0) life[i] = 0;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  // ---- credits overlay ----
  const overlay = document.createElement('div');
  overlay.id = 'blackout';
  const roll = document.createElement('div');
  roll.className = 'roll';
  CREDITS.forEach(([text, kind]) => {
    const line = document.createElement('div');
    line.className = kind;
    line.textContent = text;
    roll.appendChild(line);
  });
  const back = document.createElement('button');
  back.textContent = 'Back to the office';
  const taunt = document.createElement('div');
  taunt.className = 'taunt';
  taunt.textContent = 'Ayyy, no skipping !!';
  overlay.append(roll, taunt, back);
  document.body.appendChild(overlay);

  // ---- sequence ----
  let phase = 'idle';          // idle -> sparks -> credits
  let clock = 0;               // seconds since the sparks started
  let seconds = 0;             // office time, kept so onChange can timestamp unplugs
  let lights = [];             // [light, original intensity] for every light in the scene
  const unplugTimes = [];

  function start() {
    phase = 'sparks';
    clock = 0;
    lights = [];
    scene.traverse(o => { if (o.isLight && o !== glow) lights.push([o, o.intensity]); });
    sparks.visible = true;
    audio.play('spark');
  }

  function finish() {
    phase = 'idle';
    overlay.classList.remove('on', 'credits', 'done');
    taunt.classList.remove('show');
    skipClicks = 0;
    lights.forEach(([light, intensity]) => { light.intensity = intensity; });
    glow.intensity = 0;
    sparks.visible = false;
    unplugTimes.length = 0;
  }

  back.addEventListener('click', finish);

  // Clicking during the credits (before the button shows) scolds the player on the right side.
  let tauntTimer = 0, skipClicks = 0;
  overlay.addEventListener('click', e => {
    if (e.target === back || !overlay.classList.contains('credits') || overlay.classList.contains('done')) return;
    if (++skipClicks < SKIP_CLICKS) return;
    taunt.classList.add('show');
    clearTimeout(tauntTimer);
    tauntTimer = setTimeout(() => taunt.classList.remove('show'), 1400);
  });
  roll.addEventListener('animationend', () => overlay.classList.add('done'));   // the button only shows once the credits have finished

  power.onChange(plugged => {
    if (plugged || phase !== 'idle') return;
    unplugTimes.push(seconds);
    while (unplugTimes.length && seconds - unplugTimes[0] > WITHIN) unplugTimes.shift();
    if (unplugTimes.length >= UNPLUGS) start();
  });

  C.office.updaters.push((t, dt) => {
    seconds = t;
    if (phase === 'idle') return;
    clock += dt;

    if (clock < SPARK_TIME) {
      const flicker = Math.random() < 0.5 ? Math.random() * 0.4 : 1;   // the lights stutter before dying
      lights.forEach(([light, intensity]) => { light.intensity = intensity * flicker; });
      glow.intensity = Math.random() * 3.5;
      moveSparks(dt, true);
      return;
    }

    if (phase === 'sparks') {
      phase = 'credits';
      lights.forEach(([light]) => { light.intensity = 0; });
      glow.intensity = 0;
      overlay.classList.add('on');
      setTimeout(() => { if (phase === 'credits') overlay.classList.add('credits'); }, FADE_TIME * 1000);
    }
    moveSparks(dt, false);
  });
})(window.Cetak);
