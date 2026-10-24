// Four wheels under the printer.
(function (C) {
  const { shadow } = C.helpers;
  const { printer } = C.scene;
  const { dark, black } = C.mat;

  [[-26, -24], [26, -24], [-26, 24], [26, 24]].forEach(([x, z]) => {
    const housing = shadow(new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 5), dark));
    housing.position.set(x, 5.4, z);
    printer.add(housing);

    const wheel = shadow(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 2.2, 24), black));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 2.6, z);
    printer.add(wheel);
  });
})(window.Cetak);
