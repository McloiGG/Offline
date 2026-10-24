// Shared materials. Reuse these instead of creating new ones where possible.
(function (C) {
  const std = (color, roughness, metalness) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: metalness || 0 });

  C.mat = {
    white:    std(0xe6e8ec, 0.45, 0.04),
    door:     std(0xeaecef, 0.4, 0.04),
    seam:     std(0xa9aeb7, 0.8),
    black:    std(0x18191c, 0.5, 0.15),
    black2:   std(0x0c0d0f, 0.7),
    dark:     std(0x2f3237, 0.5, 0.2),
    grey:     std(0x8f949c, 0.6),
    paper:    std(0xf8f8f8, 0.9),
    blue:     std(0x1c3f9e, 0.4),
    handle:   std(0x55585e, 0.5),
    handleIn: std(0xd9dce1, 0.5),
    // depthWrite off so the cover never z-fights with the ink tanks behind it.
    glass: new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.05, metalness: 0.2,
      transparent: true, opacity: 0.12, depthWrite: false
    })
  };
})(window.Cetak);
