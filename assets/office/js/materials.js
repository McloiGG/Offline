// Cached standard materials so props that share a colour share one material.
(function (C) {
  const cache = {};

  function std(color, roughness, metalness) {
    const r = roughness === undefined ? 0.7 : roughness;
    const m = metalness || 0;
    const key = color + '/' + r + '/' + m;
    return cache[key] || (cache[key] = new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m }));
  }

  C.office.mat = { std };
})(window.Cetak);
