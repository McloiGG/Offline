// Two coworkers standing by the coffee station, chatting. They take turns talking (gesturing, with a
// speech bubble over the speaker) and sip from their cups now and then.
(function (C) {
  const { CHATTERS, CHAT_PHRASES, CHAT_TURN_SECONDS } = C.office.config;
  const figure = C.office.figure;
  const { canvasTex } = C.helpers;
  const { scene } = C.scene;

  const bubbleTextures = CHAT_PHRASES.map(text =>
    canvasTex(512, 160, (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.strokeStyle = '#1b1d22';
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(20, 8);
      g.arcTo(w - 8, 8, w - 8, h - 36, 28);
      g.arcTo(w - 8, h - 36, 8, h - 36, 28);
      g.lineTo(w / 2 + 16, h - 36);
      g.lineTo(w / 2, h - 6);
      g.lineTo(w / 2 - 16, h - 36);
      g.arcTo(8, h - 36, 8, 8, 28);
      g.arcTo(8, 8, w - 8, 8, 28);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#1b1d22';
      let size = 58;
      g.font = 'bold ' + size + 'px Arial, Helvetica, sans-serif';
      while (g.measureText(text).width > w - 56 && size > 20) {
        size -= 2;
        g.font = 'bold ' + size + 'px Arial, Helvetica, sans-serif';
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, w / 2, (h - 36) / 2 + 6);
    }));

  const people = CHATTERS.map(cfg => {
    const person = figure.create(cfg);
    figure.addCup(person);
    person.group.position.set(cfg.x, 0, cfg.z);
    person.group.rotation.y = cfg.faceX * Math.PI / 2;     // face the other person
    scene.add(person.group);

    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTextures[0], transparent: true }));
    bubble.scale.set(64, 20, 1);
    bubble.position.set(0, 190, 0);
    bubble.visible = false;
    person.group.add(bubble);

    return { person, bubble, talking: 0 };
  });

  let lastTurn = -1;

  C.office.updaters.push((t, dt) => {
    const turn = Math.floor(t / CHAT_TURN_SECONDS);
    const speaker = turn % people.length;

    if (turn !== lastTurn) {                         // a new turn: pick the phrase for the new speaker
      lastTurn = turn;
      people[speaker].bubble.material.map = bubbleTextures[turn % bubbleTextures.length];
    }

    people.forEach((p, i) => {
      const speaking = i === speaker;
      p.talking += ((speaking ? 1 : 0) - p.talking) * Math.min(1, dt * 5);
      p.bubble.visible = speaking && (t % CHAT_TURN_SECONDS) < CHAT_TURN_SECONDS - 0.4;

      // Short sips, a few seconds apart; each person is on a different rhythm.
      const sip = Math.pow(Math.max(0, Math.sin(t * 0.55 + i * 2.4)), 10);
      figure.chatPose(p.person, t + i * 2, p.talking, sip);
    });
  });
})(window.Cetak);
