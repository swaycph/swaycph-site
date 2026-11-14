(function () {
  // Turns the plain song list into two rows that drift in opposite directions.
  // Without JavaScript, or for visitors who prefer reduced motion, the plain list stays.
  var rows = document.getElementById('rep-rows');
  var list = document.getElementById('rep-songs');
  if (!rows || !list) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var titles = Array.prototype.map.call(list.children, function (li) { return li.textContent; });
  var half = Math.ceil(titles.length / 2);
  var groups = [titles.slice(0, half), titles.slice(half)];

  function makeRow(group, reverse) {
    var row = document.createElement('div');
    row.className = 'rep-row' + (reverse ? ' reverse' : '');
    // Repeat the titles so one copy is always wider than the screen, then double it for a seamless loop.
    var copy = [];
    while (copy.length < 12) copy = copy.concat(group);
    for (var k = 0; k < 2; k++) {
      var ul = document.createElement('ul');
      if (k === 1) ul.setAttribute('aria-hidden', 'true');
      copy.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
      row.appendChild(ul);
    }
    return row;
  }

  list.setAttribute('hidden', '');
  rows.classList.add('is-moving');
  rows.appendChild(makeRow(groups[0], false));
  rows.appendChild(makeRow(groups[1], true));
})();
