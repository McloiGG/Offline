// Airflow: dots streaming out of the right-hand vent. Blue by default (toggle), red while overheating (heat),
// and blue after the overheating ends, fading from full to nothing (cool).
// heat(onFull) calls onFull once when the red airflow reaches full strength.
// Exposes: Cetak.anim.airflow = { toggle(), heat(onFull), cool(seconds), isOn(), update(dt) }
(function (C) {
  const { printer, stack } = C.scene;
  const { ventY } = C.parts.vents;

  const COUNT = 60;
  const VENT_X = 36;          // where a particle starts (just outside the right vent)
  const TRAVEL = 38;          // how far it flies
  const VENT_Z = -6;
  const BLUE = 0x3aa8ff, RED = 0xff3b30;
  const COOL_SECONDS = 4;
  const RAMP_SECONDS = 6;               // red airflow takes this long to reach full strength

  const positions = new Float32Array(COUNT * 3);
  const particles = [];
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      y: (Math.random() - 0.5) * 18,
      z: (Math.random() - 0.5) * 24,
      t: Math.random(),                 // 0..1 progress along the flight
      speed: 0.35 + Math.random() * 0.4
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: BLUE, size: 1.4, transparent: true, opacity: 0.8, depthWrite: false
  }));
  points.visible = false;
  points.frustumCulled = false;       // positions change every frame, so bounds would be stale
  printer.add(points);

  let coolTotal = COOL_SECONDS;         // length of the current blue cooldown
  let coolLeft = 0;                     // seconds of blue "cooling" airflow still to show
  let strength = 1;                     // 0..1: scales speed, opacity and how many particles are shown
  let ramp = false;                     // true while strength is climbing from 0 to 1
  let onFull = null;                    // called when the ramp reaches full strength

  C.anim.airflow = {
    isOn: () => points.visible,
    toggle() {
      coolLeft = 0;
      ramp = false;
      onFull = null;
      strength = 1;
      points.material.color.setHex(BLUE);
      points.visible = !points.visible;
      return points.visible;
    },
    heat(callback) {
      coolLeft = 0;
      onFull = callback || null;
      points.material.color.setHex(RED);
      strength = 0;
      ramp = true;
      points.visible = true;
    },
    cool(seconds) {
      coolTotal = coolLeft = seconds || COOL_SECONDS;
      ramp = false;
      onFull = null;
      strength = 1;
      points.material.color.setHex(BLUE);
      points.visible = true;
    },
    update(dt) {
      if (coolLeft > 0) {
        coolLeft -= dt;
        if (coolLeft <= 0) points.visible = false;
        else strength = coolLeft / coolTotal;       // blue starts at full strength and fades out to 0
      }
      if (!points.visible) return;
      if (ramp) {
        strength = Math.min(1, strength + dt / RAMP_SECONDS);
        if (strength >= 1) {
          ramp = false;
          if (onFull) { const fn = onFull; onFull = null; fn(); }
        }
      }
      const ease = strength * strength * (3 - 2 * strength);     // smoothstep: slow start, gentle finish
      points.material.opacity = 0.8 * ease;
      geometry.setDrawRange(0, Math.max(1, Math.round(COUNT * ease)));
      const lift = stack.position.y;    // follow the stack when extra cassettes raise it
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.t += dt * p.speed * (0.25 + 0.75 * ease);
        if (p.t > 1) p.t = 0;
        positions[i * 3] = VENT_X + p.t * TRAVEL;
        positions[i * 3 + 1] = ventY + lift + p.y + Math.sin(p.t * 6 + i) * 0.8;
        positions[i * 3 + 2] = VENT_Z + p.z;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  };
})(window.Cetak);
