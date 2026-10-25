// Loads first. Creates the game namespace and makes the office audio's '../../audio/x.mp3' paths
// resolve from the root index.html (the office page lived two folders deep).
(function () {
  window.Offline = window.Offline || {};
  const Native = window.Audio;
  function GameAudio(src) {
    return new Native(typeof src === 'string' ? src.replace(/^(?:\.\.\/)+audio\//, 'audio/') : src);
  }
  GameAudio.prototype = Native.prototype;
  window.Audio = GameAudio;
})();
