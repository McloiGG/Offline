// Officemates walking their rounds with files or coffee.
// Each walker follows a closed waypoint loop at constant speed and turns smoothly at the corners.
(function (C) {
  const { WALKERS } = C.office.config;
  const figure = C.office.figure;
  const { scene } = C.scene;

  const STRIDE_PER_UNIT = 0.045;     // gait phase per world unit walked (about 70 units per step)
  const PROPS = {
    stack:  { attach: figure.addStack,  pose: { stack: true } },
    folder: { attach: figure.addFolder, pose: { holdR: true } },
    cup:    { attach: figure.addCup,    pose: { cup: true } }
  };

  const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

  WALKERS.forEach(cfg => {
    const person = figure.create(cfg);
    const prop = PROPS[cfg.prop];
    if (prop) prop.attach(person);
    scene.add(person.group);

    // Precompute segment lengths so position can be found from distance travelled.
    const pts = cfg.path;
    const lengths = pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length];
      return Math.hypot(q[0] - p[0], q[1] - p[1]);
    });
    const total = lengths.reduce((a, b) => a + b, 0);

    let dist = cfg.start * total;
    let facing = null;

    C.office.updaters.push((t, dt) => {
      dist = (dist + cfg.speed * dt) % total;

      let d = dist;
      let i = 0;
      while (d > lengths[i]) { d -= lengths[i]; i++; }
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const k = d / lengths[i];
      person.group.position.set(a[0] + (b[0] - a[0]) * k, 0, a[1] + (b[1] - a[1]) * k);

      const heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
      facing = facing === null ? heading : facing + wrapAngle(heading - facing) * Math.min(1, dt * 6);
      person.group.rotation.y = facing;

      figure.walkPose(person, dist * STRIDE_PER_UNIT, prop && prop.pose);
    });
  });
})(window.Cetak);
