// Overheat fan: plays from 0s, loops 14-19s smoothly while on; on stop it plays 19s to the end of the file
// together with the "complete" chime. Once the red airflow reaches full strength the warning beeps play
// and the printer screen shows an error; the beeps play again after every loop of the fan sound.
// Adds startOverheat(), stopOverheat(), isOverheating(), overheatAlarm()
(function (C) {
  const { audio, recordings } = C.office;
  const FILE = '../../audio/overheat.mp3';
  const LOOP_FROM = 14, LOOP_TO = 19, CROSSFADE = 1;

  let state = null;              // { loop, stopping }
  let alarmed = false;           // true once the red airflow has reached full strength

  function finish(s) {
    s.loop.stop();
    alarmed = false;
    audio.setAlert('overheat', null);
    if (state === s) state = null;
    audio.onOverheatChange(false);
  }

  audio.overheatAlarm = () => {
    if (!audio.isOverheating()) return;
    alarmed = true;
    audio.play('warning');
    audio.setAlert('overheat', 'Overheating! Let the printer cool down');
  };

  audio.startOverheat = () => {
    if (state || typeof Audio === 'undefined') return;
    const s = state = { loop: recordings.crossfadeLoop(FILE, {
      from: LOOP_FROM, to: LOOP_TO, fade: CROSSFADE,
      onLoop: () => { if (alarmed) audio.play('warning'); }
    }), stopping: false };
    s.loop.elements.forEach(el => {
      el.onended = () => { if (s.stopping) finish(s); };
      el.onerror = () => finish(s);
    });
    s.loop.play();
    audio.onOverheatChange(true);
  };

  // Returns the length in seconds of the ending, so the airflow can fade out with it.
  audio.stopOverheat = () => {
    const s = state;
    if (!s || s.stopping) return;
    s.stopping = true;
    const el = s.loop.freeze();
    alarmed = false;
    audio.setAlert('overheat', null);
    if (el.currentTime < LOOP_TO) el.currentTime = LOOP_TO;
    el.play().catch(() => {});
    audio.playComplete();
    audio.onOverheatChange(false);
    const left = el.duration - LOOP_TO;
    return left > 0 && isFinite(left) ? left : undefined;
  };

  audio.isOverheating = () => !!state && !state.stopping;
})(window.Cetak);
