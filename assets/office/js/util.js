// Tiny mesh builders in world units. `parent` is optional; pass a Group to build compound props.
(function (C) {
  function finish(mesh, x, y, z, parent) {
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (parent) parent.add(mesh);
    return mesh;
  }

  const box = (w, h, d, mat, x, y, z, parent) =>
    finish(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z, parent);

  const cyl = (rTop, rBottom, h, mat, x, y, z, parent, segments) =>
    finish(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments || 20), mat), x, y, z, parent);

  const sphere = (r, mat, x, y, z, parent) =>
    finish(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat), x, y, z, parent);

  // Drop a built prop into the world at (x, 0, z), turned by rotY radians.
  function place(group, x, z, rotY) {
    group.position.set(x, 0, z);
    group.rotation.y = rotY || 0;
    C.scene.scene.add(group);
    return group;
  }

  C.office.util = { box, cyl, sphere, place };
})(window.Cetak);
