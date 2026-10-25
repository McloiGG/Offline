// Wires the sounds to the game: master volume, the tray, the print animation and the power plug,
// and keeps the ink panel logo blinking.
(function (C) {
  const { audio, engine } = C.office;
  audio.setVolume = engine.setVolume;

  const { cassettes, inkPanel, power } = C.parts;
  const { printing } = C.anim;

  const toggleTray = cassettes.toggleTray;
  cassettes.toggleTray = function () {
    const open = toggleTray();
    audio.play(open ? 'trayOpen' : 'trayClose');
    return open;
  };

  const start = printing.start, stop = printing.stop;
  printing.start = function () { start(); audio.startPrinting(); };
  printing.stop = function () { stop(); audio.stopPrinting(); };

  C.ui.powerSwitch.onChange(on => audio.play(on ? 'switchOn' : 'switchOff'));
  power.onChange(plugged => audio.play(plugged ? 'plugIn' : 'unplug'));
  power.onLand(() => audio.play('plugDrop'));

  // Offline state: its own repeating sound (not the warning beeps) while the screen is lit, plus the touchscreen sounds.
  const OFFLINE_EVERY = 3000;
  let offlineTimer = 0;
  const offlineSound = () => { if (C.parts.display.isOn()) audio.play('offline'); };
  C.parts.wifi.on(type => {
    if (type === 'offline') {
      offlineSound();
      offlineTimer = setInterval(offlineSound, OFFLINE_EVERY);
    } else if (type === 'online') {
      clearInterval(offlineTimer);
      offlineTimer = 0;
    } else if (type === 'connected') audio.play('connected');
    else audio.play(type === 'wrong' ? 'wrong' : 'tap');
  });

  C.office.updaters.push(t => inkPanel.update(t));
})(window.Cetak);
