(function () {
  var player = document.getElementById('player');
  var audio = document.getElementById('audio');
  var playBtn = document.getElementById('play-main');
  var title = document.getElementById('now-title');
  var seek = document.getElementById('seek');
  var cur = document.getElementById('t-cur');
  var dur = document.getElementById('t-dur');
  var items = Array.prototype.slice.call(document.querySelectorAll('#tracks button'));
  var index = 0;
  var seeking = false;

  function label(kind) {
    var en = document.documentElement.lang === 'en';
    if (kind === 'pause') return en ? 'Pause' : 'Pause';
    return en ? 'Play' : 'Afspil';
  }
  document.addEventListener('langchange', function () {
    playBtn.setAttribute('aria-label', label(audio.paused ? 'play' : 'pause'));
  });

  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function load(i) {
    index = i;
    items.forEach(function (b, j) { b.classList.toggle('active', j === i); });
    audio.src = items[i].dataset.src;
    title.textContent = items[i].querySelector('b').textContent;
    dur.textContent = items[i].querySelector('.t-len').textContent;
    seek.value = 0;
    cur.textContent = '0:00';
  }

  function toggle() {
    if (!audio.getAttribute('src')) load(index);
    if (audio.paused) audio.play(); else audio.pause();
  }

  items.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (i === index && audio.getAttribute('src')) { toggle(); return; }
      load(i);
      audio.play();
    });
  });

  playBtn.addEventListener('click', toggle);

  audio.addEventListener('play', function () {
    player.classList.add('is-playing');
    playBtn.setAttribute('aria-label', label('pause'));
  });
  audio.addEventListener('pause', function () {
    player.classList.remove('is-playing');
    playBtn.setAttribute('aria-label', label('play'));
  });
  audio.addEventListener('loadedmetadata', function () { dur.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function () {
    if (seeking || !audio.duration) return;
    seek.value = (audio.currentTime / audio.duration) * 100;
    cur.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('ended', function () {
    if (index < items.length - 1) { load(index + 1); audio.play(); }
  });

  seek.addEventListener('input', function () {
    seeking = true;
    if (audio.duration) cur.textContent = fmt(seek.value / 100 * audio.duration);
  });
  seek.addEventListener('change', function () {
    if (audio.duration) audio.currentTime = seek.value / 100 * audio.duration;
    seeking = false;
  });
})();
