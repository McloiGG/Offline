// Wires up every button in the bar. Camera buttons carry data-view="<preset name>".
(function (C) {
  const { VIEWS } = C.config;
  const { controls, stack } = C.scene;
  const views = C.ui.views;
  const { extras, SHIFT } = C.parts.cassettes;
  const { printing, airflow } = C.anim;

  const labelled = (btn, name, on) => { btn.textContent = name + (on ? 'on' : 'off'); };

  // Camera preset buttons (bottom bar + the five state buttons on the right).
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.onclick = () => views.goTo(btn.dataset.view);
  });

  document.getElementById('spin').onclick = views.toggleSpin;

  // Cassettes: show/hide C3 + C4 and lift the stack so the extra drawers fit underneath.
  const cassBtn = document.getElementById('cass');
  cassBtn.onclick = () => {
    const four = !extras.visible;
    extras.visible = four;
    C.state.shift = four ? SHIFT : 0;
    stack.position.y = C.state.shift;
    cassBtn.textContent = 'Cassettes: ' + (four ? 4 : 2);
    controls.target.y = VIEWS.three.t[1] + C.state.shift;
  };

  const airBtn = document.getElementById('air');
  airBtn.onclick = () => labelled(airBtn, 'Airflow: ', airflow.toggle());

  // Print: toggles the looping animation and zooms to the output tray when switching on.
  const printBtn = document.getElementById('print');
  printBtn.onclick = () => {
    if (printing.isOn()) printing.stop(); else printing.start();
    const on = printing.isOn();
    labelled(printBtn, 'Print: ', on);
    printBtn.classList.toggle('on', on);
    if (on) views.goTo('print');
  };
})(window.Cetak);
