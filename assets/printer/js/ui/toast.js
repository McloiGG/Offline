// Small message bar at the top of the screen. Cetak.ui.toast(text) shows it for 2.5 s.
(function (C) {
  const el = document.getElementById('plugmsg');
  let timer = null;

  C.ui.toast = function (text) {
    el.textContent = text;
    el.style.display = 'block';
    clearTimeout(timer);
    timer = setTimeout(() => { el.style.display = 'none'; }, 2500);
  };
})(window.Cetak);
