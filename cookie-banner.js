/* Компактная плашка cookies внизу экрана вместо большого окна Cookiebot (13.10.2026).
 *
 * Большое окно Cookiebot на весь экран отталкивало людей при входе. Согласие по-прежнему
 * хранит и применяет Cookiebot (блокировка скриптов, режим согласия GTM) — плашка только
 * спрашивает и передаёт ответ в его API (Cookiebot.submitCustomConsent):
 *   «Принять все»        → (true, true, true)
 *   «Только необходимые» → (false, false, false)
 *   «Настроить»          → три переключателя прямо в плашке → «Сохранить выбор»
 * Всё — на языке страницы (lang у <html> или ?lang= на юр. страницах): полное окно
 * Cookiebot показывалось по-английски, русского и латышского в кабинете Cookiebot нет,
 * поэтому его не показываем вовсе.
 * Плашка появляется, когда Cookiebot сам собирался спросить (новый посетитель или истёк
 * срок согласия). Ссылка в подвале «Настройки cookies» → window.mdnaCookieSettings().
 * Подключение — сразу после скрипта Cookiebot в <head>:
 *   <script src="/cookie-banner.js" data-cookieconsent="ignore"></script>
 */
(function () {
  var root = document.documentElement;

  var css = document.createElement('style');
  css.textContent =
    '#CybotCookiebotDialog,#CybotCookiebotDialogBodyUnderlay{display:none!important}' +
    '#mdnaCookie{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483645;max-width:720px;margin:0 auto;' +
    'background:#fff;color:#374151;border:1px solid #E5E7EB;border-radius:14px;box-shadow:0 8px 30px rgba(17,24,39,.14);' +
    'padding:14px 16px;font:13.5px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;' +
    'flex-wrap:wrap;align-items:center;gap:10px 16px;text-align:left}' +
    '#mdnaCookie p{margin:0;flex:1 1 300px;color:#374151}' +
    '#mdnaCookie a{color:#7C3AED;text-decoration:underline}' +
    '#mdnaCookie .b{display:flex;gap:8px;flex-wrap:wrap}' +
    '#mdnaCookie button{font-family:inherit;font-size:13px;font-weight:600;line-height:1;padding:10px 14px;border-radius:9px;' +
    'cursor:pointer;border:1px solid #7C3AED;background:#fff;color:#5B21B6}' +
    '#mdnaCookie button.y{background:#7C3AED;color:#fff}' +
    '#mdnaCookie button.s{border-color:transparent;color:#6B7280;text-decoration:underline;padding:10px 6px}' +
    '#mdnaCookie .h{flex:1 1 100%;margin:0;font-weight:700;color:#1E1B4B;font-size:14.5px}' +
    '#mdnaCookie .o{flex:1 1 100%;display:grid;gap:8px}' +
    '#mdnaCookie label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;color:#374151}' +
    '#mdnaCookie label input{margin-top:3px;width:16px;height:16px;accent-color:#7C3AED;flex:none}' +
    '#mdnaCookie label b{color:#1E1B4B}' +
    '@media(max-width:520px){#mdnaCookie{left:8px;right:8px;bottom:8px;padding:12px}#mdnaCookie .b{width:100%}' +
    '#mdnaCookie button.y,#mdnaCookie button.n{flex:1}}';
  (document.head || root).appendChild(css);

  var lang = (root.lang || 'ru').slice(0, 2).toLowerCase();
  var q = (location.search.match(/[?&]lang=(ru|lv|en)/) || [])[1];
  if (q) lang = q;
  var ALL = {
    ru: { text: 'Мы используем cookies, чтобы сайт работал, и чтобы понимать, что людям на нём интересно.',
          more: 'Подробнее', yes: 'Принять все', no: 'Только необходимые', set: 'Настроить', save: 'Сохранить выбор',
          title: 'Настройки cookies', nec: 'Необходимые', necD: 'нужны для работы сайта, всегда включены',
          pre: 'Предпочтения', preD: 'запоминают ваш выбор, например язык',
          sta: 'Статистика', staD: 'помогают понять, как пользуются сайтом',
          mar: 'Маркетинг', marD: 'позволяют показывать подходящую рекламу в соцсетях' },
    lv: { text: 'Šī vietne izmanto sīkdatnes, lai tā darbotos un lai mēs saprastu, kas apmeklētājiem ir interesanti.',
          more: 'Vairāk', yes: 'Pieņemt visas', no: 'Tikai nepieciešamās', set: 'Iestatījumi', save: 'Saglabāt izvēli',
          title: 'Sīkdatņu iestatījumi', nec: 'Nepieciešamās', necD: 'vajadzīgas vietnes darbībai, vienmēr ieslēgtas',
          pre: 'Preferenču', preD: 'atceras jūsu izvēles, piemēram, valodu',
          sta: 'Statistikas', staD: 'palīdz saprast, kā vietne tiek lietota',
          mar: 'Mārketinga', marD: 'ļauj rādīt atbilstošu reklāmu sociālajos tīklos' },
    en: { text: 'We use cookies to make the site work and to understand what people find interesting here.',
          more: 'Learn more', yes: 'Accept all', no: 'Necessary only', set: 'Settings', save: 'Save choices',
          title: 'Cookie settings', nec: 'Necessary', necD: 'needed for the site to work, always on',
          pre: 'Preferences', preD: 'remember your choices, such as language',
          sta: 'Statistics', staD: 'help us understand how the site is used',
          mar: 'Marketing', marD: 'let us show relevant ads on social media' }
  };
  var T = ALL[lang] || ALL.en;
  var policy = (location.pathname.indexOf('staging') >= 0 ? 'staging-privacy.html' : 'privacy.html') + '?lang=' + lang;

  var bar = null;
  function cb() { return window.Cookiebot; }
  function hide() { if (bar) { bar.remove(); bar = null; } }
  function submit(p, s, m) { hide(); try { cb().submitCustomConsent(p, s, m); } catch (e) {} }
  function box() {
    hide();
    bar = document.createElement('div');
    bar.id = 'mdnaCookie';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookies');
    (document.body || root).appendChild(bar);
    return bar;
  }

  function showShort() {
    var c = cb();
    if (bar || !c || c.hasResponse) return;
    box().innerHTML = '<p>' + T.text + ' <a href="' + policy + '">' + T.more + '</a></p>' +
      '<div class="b"><button type="button" class="n">' + T.no + '</button>' +
      '<button type="button" class="y">' + T.yes + '</button>' +
      '<button type="button" class="s">' + T.set + '</button></div>';
    bar.querySelector('.y').onclick = function () { submit(true, true, true); };
    bar.querySelector('.n').onclick = function () { submit(false, false, false); };
    bar.querySelector('.s').onclick = showSettings;
  }

  function showSettings() {
    var c = (cb() && cb().consent) || {};
    var row = function (id, name, desc, on, fixed) {
      return '<label><input type="checkbox" id="mdnaC_' + id + '"' + (on ? ' checked' : '') + (fixed ? ' disabled' : '') +
        '><span><b>' + name + '</b> — ' + desc + '</span></label>';
    };
    box().innerHTML = '<p class="h">' + T.title + '</p><div class="o">' +
      row('nec', T.nec, T.necD, true, true) +
      row('pre', T.pre, T.preD, !!c.preferences) +
      row('sta', T.sta, T.staD, !!c.statistics) +
      row('mar', T.mar, T.marD, !!c.marketing) +
      '</div><div class="b"><button type="button" class="n">' + T.save + '</button>' +
      '<button type="button" class="y">' + T.yes + '</button></div>';
    bar.querySelector('.y').onclick = function () { submit(true, true, true); };
    bar.querySelector('.n').onclick = function () {
      var v = function (id) { return !!document.getElementById('mdnaC_' + id).checked; };
      submit(v('pre'), v('sta'), v('mar'));
    };
  }

  // Ссылка «Настройки cookies» в подвале
  window.mdnaCookieSettings = function () { showSettings(); };

  // Cookiebot сам решает, нужно ли спрашивать: показываем плашку там же, где он показал бы окно
  window.addEventListener('CookiebotOnDialogDisplay', showShort);
  window.addEventListener('CookiebotOnLoad', function () { if (cb() && !cb().hasResponse) showShort(); });
  window.addEventListener('CookiebotOnAccept', hide);
  window.addEventListener('CookiebotOnDecline', hide);
})();
