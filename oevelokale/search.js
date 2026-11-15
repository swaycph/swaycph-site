(function () {
  var OPTS = '&color=%2393a9d3&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false';
  var albums = Array.prototype.slice.call(document.querySelectorAll('.album'));
  var input = document.getElementById('q');
  var status = document.getElementById('s-status');
  var list = document.getElementById('results');
  var apiPromise = null;
  var index = null;
  var indexing = null;

  function playerSrc(el) {
    // SoundCloud's own player link (from the embed code) is used exactly as given; a share link is wrapped.
    var raw = el.dataset.sc;
    return raw.indexOf('w.soundcloud.com/player') !== -1
      ? raw.split('&')[0] + OPTS
      : 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(raw.split('?')[0]) + OPTS;
  }

  function loadApi() {
    if (!apiPromise) apiPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js';
      s.onload = function () { resolve(window.SC); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return apiPromise;
  }

  // Creates the album's player (once) and resolves with its SoundCloud widget when ready.
  function widgetFor(el) {
    if (el._widget) return el._widget;
    var f = document.createElement('iframe');
    f.src = playerSrc(el);
    f.title = el.querySelector('.a-title').textContent;
    f.allow = 'autoplay; encrypted-media';
    el.querySelector('.a-player').appendChild(f);
    el._widget = loadApi().then(function (SC) {
      return new Promise(function (resolve) {
        var w = SC.Widget(f);
        w.bind(SC.Widget.Events.READY, function () { resolve(w); });
      });
    });
    return el._widget;
  }

  function setOpen(el, open) {
    el.classList.toggle('open', open);
    el.querySelector('.a-head').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) widgetFor(el);
  }

  albums.forEach(function (el) {
    el.querySelector('.a-head').addEventListener('click', function () {
      setOpen(el, !el.classList.contains('open'));
    });
  });

  // Playlists may first report later tracks without titles; ask again a few times.
  function soundsOf(w) {
    return new Promise(function (resolve) {
      var tries = 0;
      (function ask() {
        w.getSounds(function (sounds) {
          var missing = sounds.some(function (x) { return !x || !x.title; });
          if (missing && tries++ < 8) setTimeout(ask, 700); else resolve(sounds || []);
        });
      })();
    });
  }

  function buildIndex() {
    if (indexing) return indexing;
    status.textContent = 'Henter numre fra SoundCloud…';
    indexing = Promise.all(albums.map(function (el) {
      return widgetFor(el).then(soundsOf).then(function (sounds) {
        return sounds.map(function (x, i) {
          return {
            title: (x && x.title) || ('Nummer ' + (i + 1)),
            ms: x && x.duration,
            album: el.querySelector('.a-title').textContent,
            date: el.querySelector('.a-date').textContent,
            el: el,
            i: i
          };
        });
      }, function () { return []; });
    })).then(function (lists) {
      index = [].concat.apply([], lists);
      status.textContent = index.length ? index.length + ' numre i ' + albums.length + ' album' : 'Kunne ikke hente numrene fra SoundCloud.';
      return index;
    });
    return indexing;
  }

  function norm(t) {
    return (t || '').toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function dist(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  // Higher is better; 0 means no match. Whole phrase beats all words, which beats near-misses (typos).
  function score(title, q) {
    var t = norm(title), words = t.split(' '), qs = q.split(' ');
    if (t.indexOf(q) === 0) return 100;
    if (t.indexOf(q) !== -1) return 80;
    var total = 0;
    for (var k = 0; k < qs.length; k++) {
      var w = qs[k], best = 0;
      for (var j = 0; j < words.length; j++) {
        var tw = words[j];
        if (tw.indexOf(w) === 0) { best = Math.max(best, 10); continue; }
        if (w.length >= 4) {
          var d = dist(w, tw.slice(0, w.length + 1));
          if (d <= (w.length >= 7 ? 2 : 1)) best = Math.max(best, 5);
        }
      }
      if (!best) return 0;
      total += best;
    }
    return total;
  }

  function fmt(ms) {
    if (!ms) return '';
    var s = Math.round(ms / 1000);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function render() {
    var q = norm(input.value);
    list.innerHTML = '';
    if (!index) return;
    if (!q) { status.textContent = index.length + ' numre i ' + albums.length + ' album'; return; }
    var hits = index.map(function (r, n) { return { r: r, s: score(r.title, q), n: n }; })
      .filter(function (h) { return h.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.n - b.n; });
    status.textContent = hits.length ? hits.length + (hits.length === 1 ? ' nummer' : ' numre') : 'Ingen numre matcher "' + input.value + '"';
    hits.forEach(function (h) {
      var r = h.r, li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span class="r-play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg></span>' +
        '<span class="r-info"><b></b><span></span></span><span class="r-len"></span>';
      b.querySelector('b').textContent = r.title;
      b.querySelector('.r-info span').textContent = r.album + ' · ' + r.date;
      b.querySelector('.r-len').textContent = fmt(r.ms);
      b.setAttribute('aria-label', 'Afspil ' + r.title + ' fra ' + r.album);
      b.addEventListener('click', function () { play(r); });
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function play(r) {
    setOpen(r.el, true);
    widgetFor(r.el).then(function (w) {
      w.skip(r.i);
      w.play();
    });
    r.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  input.addEventListener('focus', buildIndex);
  input.addEventListener('input', function () { buildIndex().then(render); });
})();
