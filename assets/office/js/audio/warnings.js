// Ink warning and paper jam warning: looping recordings plus the matching panel state.
// Adds to Cetak.office.audio: setInkWarning(on), isInkWarning(), setPaperJam(on), isPaperJam()
(function (C) {
  const { audio, recordings } = C.office;

  // Ink warning: the (loud) recording loops while on, so it is turned down. The ink panel logo blinks red meanwhile.
  const INK_FILE = '../../audio/ink.mp3', INK_LEVEL = 0.35;
  const INK_NAMES = { BK: 'black', Y: 'yellow', M: 'magenta', C: 'cyan' };
  let inkEl = null;
  let inkWarn = false;
  let inkAlert = 0;        // timer that keeps the screen message in step with the tank levels

  // Follows the live tank levels: 2 or more empty tanks say "Insufficient inks", otherwise the one empty colour.
  function updateInkAlert() {
    const { names, isEmpty } = C.parts.inkPanel;
    const empty = names.filter((_, i) => isEmpty(i));
    audio.setAlert('ink', empty.length > 1 ? 'Insufficient inks'
      : empty.length ? 'Insufficient ' + INK_NAMES[empty[0]] + ', refill the cartridge' : null);
    if (!empty.length) audio.setInkWarning(false, true);   // every tank is above 5% again, so the warning ends (levels stay)
  }

  // keepLevels: turn off without refilling the tanks (used when the levels themselves ended the warning).
  audio.setInkWarning = (on, keepLevels) => {
    if (on && !inkEl) {
      inkEl = recordings.loop(INK_FILE, INK_LEVEL);
    } else if (!on && inkEl) {
      inkEl.pause();
      inkEl = null;
      clearInterval(inkAlert);
      inkAlert = 0;
      audio.setAlert('ink', null);
      audio.playComplete();
    }
    inkWarn = on;
    C.parts.inkPanel.setWarning(on);
    audio.onInkWarningChange(on, keepLevels);
    if (on && !inkAlert) inkAlert = setInterval(updateInkAlert, 200);
    if (on) updateInkAlert();
  };
  audio.isInkWarning = () => inkWarn;

  // Paper jam: the recording starts at 7s and loops 7-10s. After the first loop the warning beeps start (over the
  // recording, repeating) and the screen asks for paper.
  const JAM_FILE = '../../audio/paperjam.mp3';
  const JAM = { start: 7, from: 7, to: 10, fade: 0.6 };
  let jam = null;

  audio.setPaperJam = on => {
    if (on && !jam && typeof Audio !== 'undefined') {
      jam = recordings.crossfadeLoop(JAM_FILE, Object.assign({
        onLoop() {
          audio.setBeeping('jam', true);
          audio.setAlert('jam', 'Please insert paper');
        }
      }, JAM));
      jam.play();
    } else if (!on && jam) {
      jam.stop();
      jam = null;
      audio.playComplete();
    }
    if (!jam) {
      audio.setBeeping('jam', false);
      audio.setAlert('jam', null);
    }
    audio.onPaperJamChange(!!jam);
  };
  audio.isPaperJam = () => !!jam;
})(window.Cetak);
