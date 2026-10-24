// First-person hands overlay: six poses from the art file (idle, hover, reach, press, pull-cable, plug-in).
(function (O) {
  const box = document.getElementById('hands');
  box.innerHTML = window.OFFLINE_HANDS;
  const svg = box.querySelector('svg');
  let base = 'idle', timer = 0;

  function apply(pose) { svg.setAttribute('data-hands', pose); }
  O.hands = {
    // The resting pose (what the hands do when nothing else is happening).
    rest(pose) { base = pose; if (!timer) apply(base); },
    // A short gesture, then back to the resting pose.
    flash(pose, ms) {
      clearTimeout(timer); apply(pose);
      timer = setTimeout(() => { timer = 0; apply(base); }, ms || 350);
    },
    lower(on) { box.classList.toggle('low', !!on); }
  };
})(window.Offline);
