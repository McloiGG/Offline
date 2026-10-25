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

  C.office.updaters.push(t => inkPanel.update(t));
})(window.Cetak);
