// Main cabinet: lower body (door "A" + right bay), USB port, and the engine section
// (black output-tray cavity, blue stripe with the "A working Printer" text).
(function (C) {
  const { D, ZF } = C.config;
  const { rect, label } = C.helpers;
  const { white, door, seam, grey, black, black2, blue } = C.mat;

  const LABEL_COLOR = '#7b8088';

  // ---- lower body ----
  rect(366, 230, 634, 415, ZF, D, white);
  rect(366, 232, 500, 413, ZF + 0.35, 0.35, door);          // door A
  rect(499, 230, 501, 415, ZF + 0.2, 1, seam);              // door A edge
  rect(501, 367, 633.7, 369, ZF + 0.2, 1, seam);            // right-bay split
  rect(369, 338, 374, 386, ZF + 0.6, 0.3, grey);            // door A handle
  label('A', 395, 347, 2.2, 1.6, ZF + 0.75, LABEL_COLOR, 'normal');
  rect(588, 228, 598, 234, ZF + 0.15, 0.3, black2);         // USB port
  label('USB', 610, 231, 3.2, 1.4, ZF + 0.2, LABEL_COLOR, 'normal');

  // ---- engine ----
  rect(530, 100, 633.8, 230, ZF, D - 0.2, white);           // right pillar
  rect(366.2, 100, 530, 230, ZF, D - 0.2, black);           // output-tray cavity
  rect(374, 132, 520, 170, ZF + 0.2, 0.3, black2);          // recess behind the tray
  rect(378, 121, 512, 131, ZF + 0.45, 0.3, blue);           // blue stripe
  label('A working Printer', 445, 126, 22, 2.2, ZF + 0.65, '#ffffff', 'bold');
})(window.Cetak);
