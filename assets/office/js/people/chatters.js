// Two coworkers standing by the coffee station, chatting. They take turns talking (gesturing, with a
// speech bubble over the speaker) and sip from their cups now and then.
(function (C) {
  const { CHATTERS, CHAT_PHRASES, CHAT_TURN_SECONDS } = C.office.config;
  const figure = C.office.figure;
  const { canvasTex } = C.helpers;
  const { scene } = C.scene;

  const INK = '#1b1d22';
  const TAIL = 36;                       // height of the bubble's pointer, at the bottom of the canvas

  // A white rounded speech bubble with a pointer at the bottom; the text shrinks until it fits.
  function bubbleTexture(text) {
    return canvasTex(512, 160, (g, w, h) => {
      const bottom = h - TAIL;
      g.fillStyle = '#ffffff';
      g.strokeStyle = INK;
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(20, 8);
      g.arcTo(w - 8, 8, w - 8, bottom, 28);
      g.arcTo(w - 8, bottom, 8, bottom, 28);
      g.lineTo(w / 2 + 16, bottom);
      g.lineTo(w / 2, h - 6);
      g.lineTo(w / 2 - 16, bottom);
      g.arcTo(8, bottom, 8, 8, 28);
      g.arcTo(8, 8, w - 8, 8, 28);
      g.closePath();
      g.fill();
      g.stroke();

      let size = 58;
      const setFont = () => { g.font = 'bold ' + size + 'px Arial, Helvetica, sans-serif'; };
      setFont();
      while (g.measureText(text).width > w - 56 && size > 20) { size -= 2; setFont(); }
      g.fillStyle = INK;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, w / 2, bottom / 2 + 6);
    });
  }

  const bubbleTextures = CHAT_PHRASES.map(bubbleTexture);

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
