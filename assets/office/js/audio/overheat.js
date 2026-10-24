// Overheat fan: plays from 0s, loops 14-19s smoothly while on; on stop it plays 19s to the end of the file
// together with the "complete" chime.
// Adds to Cetak.office.audio: startOverheat(), stopOverheat(), isOverheating()
(function (C) {
  const { audio, recordings } = C.office;
  const FILE = '../../audio/overheat.mp3';
  const LOOP_FROM = 14, LOOP_TO = 19, CROSSFADE = 1;

  let state = null;              // { loop, stopping }

  function finish(s) {
    s.loop.stop();
    if (state === s) state = null;
    audio.onOverheatChange(false);
  }

  audio.startOverheat = () => {
    if (state || typeof Audio === 'undefined') return;
    const s = state = { loop: recordings.crossfadeLoop(FILE, { from: LOOP_FROM, to: LOOP_TO, fade: CROSSFADE }), stopping: false };
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
    if (el.currentTime < LOOP_TO) el.currentTime = LOOP_TO;
    el.play().catch(() => {});
    audio.playComplete();
    audio.onOverheatChange(false);
    const left = el.duration - LOOP_TO;
    return left > 0 && isFinite(left) ? left : undefined;
  };

  audio.isOverheating = () => !!state && !state.stopping;
})(window.Cetak);
