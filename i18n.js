(function () {
  var META = {
    da: {
      title: 'Sway CPH — Soul, funk & jazz fra København',
      description: 'Sway er et københavnsk band, der spiller jazzstandards med soul, funk og groove til firmaarrangementer, vinsmagninger, receptioner og private fester.'
    },
    en: {
      title: 'Sway CPH — Soul, Funk & Jazz from Copenhagen',
      description: 'Sway is a Copenhagen band playing jazz standards with soul, funk and groove for corporate events, wine tastings, receptions and private celebrations.'
    }
  };

  function swap(el, attr, daKey, enKey, lang) {
    if (!(daKey in el.dataset)) el.dataset[daKey] = attr ? el.getAttribute(attr) : el.innerHTML;
    var value = lang === 'en' ? el.dataset[enKey] : el.dataset[daKey];
    if (attr) el.setAttribute(attr, value); else el.innerHTML = value;
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-en]').forEach(function (el) { swap(el, null, 'da', 'en', lang); });
    document.querySelectorAll('[data-en-alt]').forEach(function (el) { swap(el, 'alt', 'daAlt', 'enAlt', lang); });
    document.querySelectorAll('[data-en-label]').forEach(function (el) { swap(el, 'aria-label', 'daLabel', 'enLabel', lang); });
    document.title = META[lang].title;
    var d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute('content', META[lang].description);
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  function stored() {
    try { return localStorage.getItem('sway-lang'); } catch (e) { return null; }
  }
  function store(lang) {
    try { localStorage.setItem('sway-lang', lang); } catch (e) {}
  }

  var param = new URLSearchParams(location.search).get('lang');
  var lang = param === 'en' || param === 'da' ? param : (stored() === 'en' ? 'en' : 'da');
  if (lang === 'en') apply('en');

  var btn = document.getElementById('lang-toggle');
  if (btn) btn.addEventListener('click', function () {
    lang = lang === 'en' ? 'da' : 'en';
    apply(lang);
    store(lang);
  });
})();
