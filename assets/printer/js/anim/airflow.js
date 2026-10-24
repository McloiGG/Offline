// Airflow: blue dots streaming out of the right-hand vent.
// Exposes: Cetak.anim.airflow = { toggle(), isOn(), update(dt) }
(function (C) {
  const { printer, stack } = C.scene;
  const { ventY } = C.parts.vents;

  const COUNT = 60;
  const VENT_X = 36;          // where a particle starts (just outside the right vent)
  const TRAVEL = 38;          // how far it flies
  const VENT_Z = -6;

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
    color: 0x3aa8ff, size: 1.4, transparent: true, opacity: 0.8, depthWrite: false
  }));
  points.visible = false;
  points.frustumCulled = false;       // positions change every frame, so bounds would be stale
  printer.add(points);

  C.anim.airflow = {
    isOn: () => points.visible,
    toggle() {
      points.visible = !points.visible;
      return points.visible;
    },
    update(dt) {
      if (!points.visible) return;
      const lift = stack.position.y;    // follow the stack when extra cassettes raise it
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.t += dt * p.speed;
        if (p.t > 1) p.t = 0;
        positions[i * 3] = VENT_X + p.t * TRAVEL;
        positions[i * 3 + 1] = ventY + lift + p.y + Math.sin(p.t * 6 + i) * 0.8;
        positions[i * 3 + 2] = VENT_Z + p.z;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  };
})(window.Cetak);
