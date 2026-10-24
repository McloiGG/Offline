// Renderer, camera, orbit controls, lights, floor, and the two groups the printer is built into.
(function (C) {
  const { COLORS } = C.config;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);

  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 1, 1000);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.minDistance = 40;
  controls.maxDistance = 420;
  controls.maxPolarAngle = Math.PI * 0.495;

  // Lighting: soft sky/ground fill, one shadow-casting sun, one cool fill light.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab0bb, 0.7));

  const sun = new THREE.DirectionalLight(0xffffff, 0.6);
  sun.position.set(120, 220, 160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.35;
  Object.assign(sun.shadow.camera, { left: -130, right: 130, top: 160, bottom: -60, near: 10, far: 700 });
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.25);
  fill.position.set(-160, 80, 120);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.ShadowMaterial({ opacity: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // `printer` holds everything that belongs to the machine (and never moves).
  // `stack` is everything above the cassettes; it is lifted when extra cassettes are shown.
  const printer = new THREE.Group();
  scene.add(printer);
  const stack = new THREE.Group();
  printer.add(stack);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  C.scene = { scene, camera, renderer, controls, printer, stack };
})(window.Cetak);
