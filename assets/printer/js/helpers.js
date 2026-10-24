// Mesh-building helpers. Coordinates for rect/slab/label are in *photo pixels* (see config.js).
// `parent` defaults to the printer body group (Cetak.scene.stack).
(function (C) {
  const { S, X, Y } = C.config;

  function shadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Flat box spanning photo px (x0,y0)-(x1,y1). `zf` is the front face z, `d` the depth.
  function rect(x0, y0, x1, y1, zf, d, mat, parent) {
    const m = shadow(new THREE.Mesh(new THREE.BoxGeometry((x1 - x0) * S, (y1 - y0) * S, d), mat));
    m.position.set(X((x0 + x1) / 2), Y((y0 + y1) / 2), zf - d / 2);
    (parent || C.scene.stack).add(m);
    return m;
  }

  // Rounded-corner outline; r = [topLeft, topRight, bottomRight, bottomLeft] radii.
  function roundedShape(x0, y0, x1, y1, r) {
    const [a, b, c, d] = r;
    const sh = new THREE.Shape();
    sh.moveTo(x0 + a, y1);
    sh.lineTo(x1 - b, y1);
    if (b) sh.quadraticCurveTo(x1, y1, x1, y1 - b);
    sh.lineTo(x1, y0 + c);
    if (c) sh.quadraticCurveTo(x1, y0, x1 - c, y0);
    sh.lineTo(x0 + d, y0);
    if (d) sh.quadraticCurveTo(x0, y0, x0, y0 + d);
    sh.lineTo(x0, y1 - a);
    if (a) sh.quadraticCurveTo(x0, y1, x0 + a, y1);
    return sh;
  }

  // Extruded rounded box, same coordinate convention as rect().
  function slab(px0, py0, px1, py1, zf, d, mat, r, parent) {
    const sh = roundedShape(X(px0), Y(py1), X(px1), Y(py0), r);
    const m = shadow(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }), mat));
    m.position.z = zf - d;
    (parent || C.scene.stack).add(m);
    return m;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    return t;
  }

  // 2D-canvas rounded-rect path (used when drawing textures).
  function roundRectPath(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // Text decal on a plane at photo px (cxpx, cypx). wU/hU are world-unit size.
  // polygonOffset + no depth write keeps decals from z-fighting the surface they sit on.
  function label(text, cxpx, cypx, wU, hU, zf, fg, weight, parent) {
    const tex = canvasTex(512, Math.round(512 * hU / wU), (g, w, h) => {
      g.fillStyle = fg;
      g.font = (weight || 'bold') + ' ' + Math.round(h * 0.78) + 'px Arial, Helvetica, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + h * 0.04);
    });
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wU, hU), mat);
    m.position.set(X(cxpx), Y(cypx), zf);
    (parent || C.scene.stack).add(m);
    return m;
  }

  C.helpers = { shadow, rect, roundedShape, slab, canvasTex, roundRectPath, label };
})(window.Cetak);
