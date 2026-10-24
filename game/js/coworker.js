// The coworker: a cat drawn on a 2D canvas (6 expressions), a speech bubble, and the three-click conversation.
(function (O) {
  const cv = document.getElementById('cw');
  const g = cv.getContext('2d');
  const bubble = document.getElementById('bubble');
  let bubbleTimer = 0, expr = 'neutral';

  function rr(x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function draw(e) {
    expr = e;
    const W = 512, H = 512, fur = '#c8a878', shade = '#a98a5c', shirt = '#e8e4f0';
    g.clearRect(0, 0, W, H);
    const dy = e === 'nod' ? 22 : (e === 'notebook' ? 30 : (e === 'lean' ? 16 : 0));
    const dx = e === 'glance' ? 10 : 0;
    const sg = g.createLinearGradient(0, 360, 0, 512);
    sg.addColorStop(0, '#f7f5fc'); sg.addColorStop(1, '#c7c2d6');
    g.fillStyle = sg; g.beginPath(); g.moveTo(70, 512); g.quadraticCurveTo(80, 380 + dy * 0.4, 256 + dx, 366 + dy * 0.4);
    g.quadraticCurveTo(440, 380 + dy * 0.4, 450, 512); g.closePath(); g.fill();
    g.strokeStyle = '#c7c2d6'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#f4f2fa';
    g.beginPath(); g.moveTo(216 + dx, 366 + dy * 0.4); g.lineTo(256 + dx, 410 + dy * 0.4); g.lineTo(226 + dx, 436 + dy * 0.4); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(296 + dx, 366 + dy * 0.4); g.lineTo(256 + dx, 410 + dy * 0.4); g.lineTo(286 + dx, 436 + dy * 0.4); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#e05050'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(222 + dx, 380 + dy * 0.4); g.lineTo(250 + dx, 480); g.moveTo(290 + dx, 380 + dy * 0.4); g.lineTo(262 + dx, 480); g.stroke();
    g.fillStyle = '#f0eedc'; g.fillRect(238 + dx, 478, 36, 34);
    const hx = 256 + dx, hy = 250 + dy;
    g.fillStyle = fur; g.fillRect(hx - 28, hy + 40, 56, 90);
    [-1, 1].forEach(sx => {
      g.fillStyle = fur; g.strokeStyle = shade; g.lineWidth = 3;
      g.beginPath(); g.moveTo(hx + sx * 78, hy - 40); g.quadraticCurveTo(hx + sx * 92, hy - 110, hx + sx * 62, hy - 130);
      g.quadraticCurveTo(hx + sx * 46, hy - 128, hx + sx * 34, hy - 100); g.lineTo(hx + sx * 20, hy - 66); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#d9a89a'; g.beginPath(); g.moveTo(hx + sx * 66, hy - 52); g.quadraticCurveTo(hx + sx * 76, hy - 100, hx + sx * 60, hy - 112);
      g.lineTo(hx + sx * 38, hy - 78); g.closePath(); g.fill();
    });
    const hg = g.createLinearGradient(hx - 90, hy - 80, hx + 90, hy + 80);
    hg.addColorStop(0, '#dcc59c'); hg.addColorStop(0.5, fur); hg.addColorStop(1, shade);
    g.fillStyle = hg; g.strokeStyle = shade; g.lineWidth = 3;
    g.beginPath(); g.ellipse(hx, hy, 92, 82, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#e8d6b4'; g.beginPath(); g.ellipse(hx, hy + 52, 34, 22, 0, 0, Math.PI * 2); g.fill();
    const look = e === 'eye' ? 0 : (e === 'glance' ? 7 : (e === 'notebook' ? 0 : -3));
    const lookY = (e === 'notebook' || e === 'nod') ? 6 : 0;
    const half = e === 'hm' ? 0.5 : (e === 'nod' ? 0.45 : 0.7);
    [-1, 1].forEach(sx => {
      const ex = hx + sx * 42;
      g.fillStyle = '#f6f2e4'; g.strokeStyle = '#5a4630'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(ex, hy + 2, 24, 22 * half + 4, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#d6c35a'; g.beginPath(); g.ellipse(ex + look, hy + 3 + lookY, 14, 16 * half + 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a1418'; g.beginPath(); g.ellipse(ex + look, hy + 3 + lookY, 3, 14 * half + 2, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5a4630'; g.lineWidth = 5; g.beginPath();
      g.moveTo(ex - 24, hy - 4 + (e === 'hm' ? 4 : 0)); g.lineTo(ex + 24, hy - 4 - (e === 'hm' && sx > 0 ? 8 : 0)); g.stroke();
    });
    g.fillStyle = '#c47a7a'; g.beginPath(); g.moveTo(hx - 9, hy + 36); g.lineTo(hx + 9, hy + 36); g.lineTo(hx, hy + 47); g.closePath(); g.fill();
    g.strokeStyle = '#5a4630'; g.lineWidth = 3; g.beginPath();
    if (e === 'hm') { g.moveTo(hx - 12, hy + 62); g.lineTo(hx + 12, hy + 62); }
    else { g.moveTo(hx, hy + 47); g.lineTo(hx, hy + 54); g.moveTo(hx - 14, hy + 58); g.quadraticCurveTo(hx - 6, hy + 66, hx, hy + 54); g.quadraticCurveTo(hx + 6, hy + 66, hx + 14, hy + 58); }
    g.stroke();
    g.strokeStyle = '#8a7550'; g.lineWidth = 1.6; g.beginPath();
    [-1, 1].forEach(sx => { for (let i = -1; i <= 1; i++) { g.moveTo(hx + sx * 30, hy + 52 + i * 4); g.lineTo(hx + sx * 84, hy + 48 + i * 12); } });
    g.stroke();
    g.strokeStyle = '#2a2030'; g.lineWidth = 8; g.fillStyle = 'rgba(207,224,234,0.18)';
    [-1, 1].forEach(sx => { rr(hx + (sx < 0 ? -84 : 10), hy - 30, 74, 62, 20); g.fill(); g.stroke(); });
    g.lineWidth = 6; g.beginPath(); g.moveTo(hx - 10, hy - 2); g.quadraticCurveTo(hx, hy - 10, hx + 10, hy - 2); g.stroke();
    if (e === 'notebook') {
      g.fillStyle = '#5a6070'; g.save(); g.translate(hx - 140, 440); g.rotate(-0.15);
      g.fillRect(-60, -40, 120, 150); g.fillStyle = '#f2efe4'; g.fillRect(-52, -32, 104, 134); g.restore();
      g.fillStyle = shirt; g.fillRect(hx - 190, 488, 60, 24);
      g.strokeStyle = '#2a2030'; g.lineWidth = 5; g.beginPath(); g.moveTo(hx - 120, 470); g.lineTo(hx - 150, 500); g.stroke();
    }
  }

  function say(text, ms, cls) {
    bubble.textContent = text; bubble.className = cls || ''; bubble.hidden = false;
    clearTimeout(bubbleTimer);
    if (ms) bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms);
  }

  let calm = 0;
  O.coworker = {
    draw, say,
    hide() { bubble.hidden = true; },
    expr(e, ms) { draw(e); clearTimeout(calm); if (ms) calm = setTimeout(() => draw('neutral'), ms); }
  };
  draw('neutral');
})(window.Offline);
