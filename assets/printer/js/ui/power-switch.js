// The printer's own on/off switch plus the wall plug: the screens are on only while it is plugged in AND switched on.
// LED: green on, red switched off, dark unplugged.
// Exposes: Cetak.ui.powerSwitch = { isOn(), toggle(), onChange(fn(on)) }
(function (C) {
  const { power, display, powerButton, inkPanel } = C.parts;

  const LED = { on: 0x3ddc84, off: 0xe53935, unplugged: 0x2a2d33 };
  let switchedOn = true;
  const listeners = [];

  function apply() {
    const plugged = power.isPlugged();
    const on = plugged && switchedOn;
    display.setPower(on);
    inkPanel.setPower(on);
    powerButton.setLed(!plugged ? LED.unplugged : switchedOn ? LED.on : LED.off);
  }

  C.ui.powerSwitch = {
    isOn: () => switchedOn,
    onChange: fn => listeners.push(fn),
    toggle() {
      switchedOn = !switchedOn;
      powerButton.press();
      apply();
      listeners.forEach(fn => fn(switchedOn));
      C.ui.toast(switchedOn ? 'Printer switched on.' : 'Printer switched off.');
    }
  };

  power.onChange(plugged => {
    apply();
    C.ui.toast(plugged
      ? 'Plugged back in. Printer rebooting...'
      : 'Unplugged. The screens are off. Pick the plug up and drag it back into the socket.');
  });
})(window.Cetak);
