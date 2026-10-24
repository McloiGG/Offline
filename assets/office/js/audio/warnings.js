// Ink warning and paper jam warning: looping recordings plus the matching panel state.
// Adds to Cetak.office.audio: setInkWarning(on), isInkWarning(), setPaperJam(on), isPaperJam()
(function (C) {
  const { audio, recordings } = C.office;

  // Ink warning: the (loud) recording loops while on, so it is turned down. The ink panel logo blinks red meanwhile.
  const INK_FILE = '../../audio/ink.mp3', INK_LEVEL = 0.35;
  let inkEl = null;
  let inkWarn = false;

  audio.setInkWarning = on => {
    if (on && !inkEl) {
      inkEl = recordings.loop(INK_FILE, INK_LEVEL);
    } else if (!on && inkEl) {
      inkEl.pause();
      inkEl = null;
      audio.playComplete();
    }
    inkWarn = on;
    C.parts.inkPanel.setWarning(on);
    audio.onInkWarningChange(on);
  };
  audio.isInkWarning = () => inkWarn;

  // Paper jam: the recording starts at 7s and loops 7-10s; the warning beeps play after every few loops.
  const JAM_FILE = '../../audio/paperjam.mp3';
  const JAM = { start: 7, from: 7, to: 10, fade: 0.6 }, LOOPS_PER_BEEP = 3;
  let jam = null;
  let loops = 0;

  audio.setPaperJam = on => {
    if (on && !jam && typeof Audio !== 'undefined') {
      loops = 0;
      jam = recordings.crossfadeLoop(JAM_FILE, Object.assign({
        onLoop() { if (++loops % LOOPS_PER_BEEP === 0) audio.play('warning'); }
      }, JAM));
      jam.play();
    } else if (!on && jam) {
      jam.stop();
      jam = null;
      audio.playComplete();
    }
    audio.onPaperJamChange(!!jam);
  };
  audio.isPaperJam = () => !!jam;
})(window.Cetak);
