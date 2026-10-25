// Shared by the ink, paper jam and overheat warnings: one error box on the printer screen and one repeating beep.
// Adds to Cetak.office.audio: setAlert(source, text), setBeeping(source, on)
(function (C) {
  const { audio } = C.office;

  // ---- error box: one alert at a time; when several are active the first source in this list wins ----
  const ALERT_PRIORITY = ['overheat', 'jam', 'ink'];
  const alerts = {};

  audio.setAlert = (source, text) => {
    alerts[source] = text;
    const top = ALERT_PRIORITY.find(s => alerts[s]);
    C.parts.display.setMessage(top ? alerts[top] : null);
  };

  // ---- beeps: repeat for as long as any source is beeping (one beep lasts about a second) ----
  const BEEP_EVERY = 1200;
  const beepers = new Set();
  let beepTimer = 0;

  audio.setBeeping = (source, on) => {
    if (on) beepers.add(source); else beepers.delete(source);
    if (beepers.size && !beepTimer) {
      audio.play('warning');
      beepTimer = setInterval(() => audio.play('warning'), BEEP_EVERY);
    } else if (!beepers.size && beepTimer) {
      clearInterval(beepTimer);
      beepTimer = 0;
    }
  };
})(window.Cetak);
