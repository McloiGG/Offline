// A simple blocky person, built from boxes and spheres, plus props they can carry and poses.
// Rest pose faces +z. Rotating a limb group about x by a NEGATIVE angle swings it forward.
// Exposes: Cetak.office.figure = { create, addStack, addFolder, addCup, walkPose, chatPose, sitPose, standPose }
//   create({ shirt, pants, skin, hair }) -> { group, body, legL, legR, armL, armR, head, cup? }
(function (C) {
  const { std } = C.office.mat;
  const { box, cyl, sphere } = C.office.util;

  const HIP_Y = 82;
  const SHOULDER_Y = 130;
  const ARM_LENGTH = 52;

  function limb(parent, x, y, length, width, mat, endMat, endY) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    parent.add(pivot);
    box(width, length, width, mat, 0, -length / 2, 0, pivot);
    if (endMat) endMat(pivot, endY);
    return pivot;
  }

  function create(opts) {
    const shirt = std(opts.shirt, 0.8);
    const pants = std(opts.pants, 0.8);
    const skin = std(opts.skin, 0.7);
    const shoe = std(0x1a1a1d, 0.6);

    const group = new THREE.Group();
    const body = new THREE.Group();    // bobs / leans as one piece
    group.add(body);

    const foot = (pivot, y) => box(12, 6, 18, shoe, 0, y + 3, 4, pivot);
    const hand = (pivot, y) => sphere(4.6, skin, 0, y, 0, pivot);
    const legL = limb(body, -8, HIP_Y, HIP_Y, 12, pants, foot, -HIP_Y);
    const legR = limb(body, 8, HIP_Y, HIP_Y, 12, pants, foot, -HIP_Y);
    const armL = limb(body, -23, SHOULDER_Y, 50, 9, shirt, hand, -ARM_LENGTH);
    const armR = limb(body, 23, SHOULDER_Y, 50, 9, shirt, hand, -ARM_LENGTH);

    box(36, 52, 20, shirt, 0, HIP_Y + 26, 0, body);

    const head = new THREE.Group();
    head.position.set(0, SHOULDER_Y + 16, 0);
    body.add(head);
    sphere(13, skin, 0, 0, 0, head);
    const cap = sphere(13.8, std(opts.hair, 0.9), 0, 1.2, -1.5, head);
    cap.geometry.dispose();
    cap.geometry = new THREE.SphereGeometry(13.8, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    [-4.6, 4.6].forEach(x => sphere(1.5, std(0x111111, 0.4), x, 2, 12.2, head));

    return { group, body, legL, legR, armL, armR, head, cup: null };
  }

  // ---- props ----

  const manila = std(0xd9b36c, 0.8);
  const paperMat = std(0xf6f6f6, 0.9);

  // A pile of folders held against the chest by both arms (use with walkPose({ stack: true })).
  function addStack(f) {
    const pile = new THREE.Group();
    pile.position.set(0, 110, 34);
    f.body.add(pile);
    [manila, std(0x6fa3d9, 0.8), paperMat, std(0xe8826e, 0.8), manila].forEach((m, i) =>
      box(33 - (i % 2), 4, 25 + (i % 3), m, (i % 2) * 0.8, i * 4.2 - 8, 0, pile).rotation.y = (i - 2) * 0.05);
    return pile;
  }

  // A single folder held out in front of the chest by the right hand (use with walkPose({ holdR: true })).
  function addFolder(f) {
    const folder = new THREE.Group();
    folder.position.set(12, 112, 38);
    folder.rotation.x = -0.35;
    f.body.add(folder);
    box(20, 28, 1.8, manila, 0, 0, 0, folder);
    box(8, 3, 1.8, manila, -5, 15.5, 0, folder);                 // tab
    box(18, 26, 1, paperMat, 0, 0.5, 1.4, folder);               // sheet poking out
    return folder;
  }

  // A paper coffee cup in the right hand. Poses keep it upright via uprightCup().
  function addCup(f) {
    const holder = new THREE.Group();
    holder.position.set(0, -ARM_LENGTH, 0);
    f.armR.add(holder);
    cyl(4.4, 3.4, 9, paperMat, 0, 4.5, 0, holder, 14);
    cyl(3.7, 3.7, 3.6, std(0x8a5a36, 0.8), 0, 4.2, 0, holder, 14).scale.set(1.18, 1, 1.18);   // sleeve
    cyl(4.7, 4.7, 1.2, std(0x2a2c30, 0.5), 0, 9.6, 0, holder, 14);                          // lid
    f.cup = holder;
    return holder;
  }

  // Counter-rotate the cup against the arm and body lean so it never tips over.
  function uprightCup(f) {
    if (f.cup) f.cup.rotation.x = -(f.armR.rotation.x + f.body.rotation.x);
  }

  // ---- poses ----

  // phase advances with distance walked; one full cycle = two steps.
  // opts: { stack } both arms hug a pile; { holdR } right hand holds a folder; { cup } right hand holds a cup.
  function walkPose(f, phase, opts) {
    const o = opts || {};
    const s = Math.sin(phase);
    f.legL.rotation.x = s * 0.55;
    f.legR.rotation.x = -s * 0.55;
    f.legL.scale.y = f.legR.scale.y = 1;

    if (o.stack) {
      f.armL.rotation.x = f.armR.rotation.x = -1.25;
    } else {
      f.armL.rotation.x = -s * 0.5;
      f.armR.rotation.x = o.holdR ? -1.25 : o.cup ? -1.45 : s * 0.5;
    }
    f.body.rotation.x = 0.05;
    f.body.rotation.z = 0;
    f.body.position.y = (1 - Math.abs(s)) * 1.6;
    f.head.rotation.x = 0;
    f.head.rotation.y = 0;
    uprightCup(f);
  }

  // Standing and chatting with a cup. talking 0..1 = how much they gesture / nod, sip 0..1 = cup raised.
  function chatPose(f, phase, talking, sip) {
    f.legL.rotation.x = f.legR.rotation.x = 0;
    f.legL.scale.y = f.legR.scale.y = 1;
    f.body.position.y = 0;
    f.body.rotation.x = 0.04 + talking * 0.03;
    f.body.rotation.z = Math.sin(phase * 0.5) * 0.02;                      // slow weight shift
    f.armR.rotation.x = -1.45 - sip * 0.6;                                 // cup arm: forward, raised to sip
    f.armL.rotation.x = -0.25 - talking * (0.55 + 0.35 * Math.sin(phase * 4.2));
    f.head.rotation.x = Math.sin(phase * 3) * (0.03 + talking * 0.05);     // nodding
    f.head.rotation.y = Math.sin(phase * 0.7) * 0.15;
    uprightCup(f);
  }

  // Seated at a desk: hips lowered onto the chair, thighs forward, hands over the keyboard.
  function sitPose(f, phase) {
    f.body.position.y = -28;
    f.body.rotation.x = 0.08;
    f.legL.rotation.x = f.legR.rotation.x = -1.5;
    f.legL.scale.y = f.legR.scale.y = 0.65;
    f.armL.rotation.x = -1.2 + Math.sin(phase * 7) * 0.05;
    f.armR.rotation.x = -1.2 + Math.sin(phase * 7 + 1.7) * 0.06;
    f.head.rotation.x = 0.05 + Math.sin(phase * 0.6) * 0.03;
  }

  function standPose(f, phase) {
    f.legL.rotation.x = f.legR.rotation.x = 0;
    f.armL.rotation.x = Math.sin(phase * 1.3) * 0.05;
    f.armR.rotation.x = -1.35 + Math.sin(phase * 2) * 0.08;   // pointing at the printer
    f.body.rotation.x = 0.03;
    f.body.position.y = 0;
    f.head.rotation.y = Math.sin(phase * 0.8) * 0.25;
  }

  C.office.figure = { create, addStack, addFolder, addCup, walkPose, chatPose, sitPose, standPose };
})(window.Cetak);
