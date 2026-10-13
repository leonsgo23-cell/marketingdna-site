/* Компактная плашка cookies внизу экрана вместо большого окна Cookiebot (13.10.2026).
 *
 * Большое окно Cookiebot на весь экран отталкивало людей при входе. Согласие по-прежнему
 * хранит и применяет Cookiebot (блокировка скриптов, режим согласия GTM) — эта плашка
 * только спрашивает и передаёт ответ в его API:
 *   «Принять все»        → Cookiebot.submitCustomConsent(true, true, true)
 *   «Только необходимые» → Cookiebot.submitCustomConsent(false, false, false)
 *   «Настроить»          → открывает полное окно Cookiebot с переключателями
 * Плашка появляется только тогда, когда Cookiebot сам собирался показать окно (новый
 * посетитель или истёк срок согласия). Подключение — сразу после скрипта Cookiebot в <head>:
 *   <script src="/cookie-banner.js" data-cookieconsent="ignore"></script>
 */
(function () {
  var FULL = 'mdna-cb-full';
  var root = document.documentElement;

  // Большое окно Cookiebot прячем, пока человек сам не нажал «Настроить»
  var css = document.createElement('style');
  css.textContent =
    'html:not(.' + FULL + ') #CybotCookiebotDialog,html:not(.' + FULL + ') #CybotCookiebotDialogBodyUnderlay{display:none!important}' +
    '#mdnaCookie{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483645;max-width:720px;margin:0 auto;' +
    'background:#fff;color:#374151;border:1px solid #E5E7EB;border-radius:14px;box-shadow:0 8px 30px rgba(17,24,39,.14);' +
    'padding:14px 16px;font:13.5px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;' +
    'flex-wrap:wrap;align-items:center;gap:10px 16px}' +
    '#mdnaCookie p{margin:0;flex:1 1 300px}' +
    '#mdnaCookie a{color:#7C3AED;text-decoration:underline}' +
    '#mdnaCookie .b{display:flex;gap:8px;flex-wrap:wrap}' +
    '#mdnaCookie button{font-family:inherit;font-size:13px;font-weight:600;line-height:1;padding:10px 14px;border-radius:9px;cursor:pointer;' +
    'border:1px solid #7C3AED;background:#fff;color:#5B21B6}' +
    '#mdnaCookie button.y{background:#7C3AED;color:#fff}' +
    '#mdnaCookie button.s{border-color:transparent;color:#6B7280;text-decoration:underline;padding:10px 6px}' +
    '@media(max-width:520px){#mdnaCookie{left:8px;right:8px;bottom:8px;padding:12px}#mdnaCookie .b{width:100%}' +
    '#mdnaCookie button.y,#mdnaCookie button.n{flex:1}}';
  (document.head || root).appendChild(css);

  var lang = (root.lang || 'ru').slice(0, 2).toLowerCase();
  var q = (location.search.match(/[?&]lang=(ru|lv|en)/) || [])[1];
  if (q) lang = q;
  var T = {
    ru: { text: 'Мы используем cookies, чтобы сайт работал, и чтобы понимать, что людям на нём интересно.',
          more: 'Подробнее', yes: 'Принять все', no: 'Только необходимые', set: 'Настроить' },
    lv: { text: 'Šī vietne izmanto sīkdatnes, lai tā darbotos un lai mēs saprastu, kas apmeklētājiem ir interesanti.',
          more: 'Vairāk', yes: 'Pieņemt visas', no: 'Tikai nepieciešamās', set: 'Iestatījumi' },
    en: { text: 'We use cookies to make the site work and to understand what people find interesting here.',
          more: 'Learn more', yes: 'Accept all', no: 'Necessary only', set: 'Settings' }
  }[lang] || null;
  if (!T) T = { text: 'We use cookies to make the site work and to understand what people find interesting here.', more: 'Learn more', yes: 'Accept all', no: 'Necessary only', set: 'Settings' };
  var policy = (location.pathname.indexOf('staging') >= 0 ? 'staging-privacy.html' : 'privacy.html') + '?lang=' + lang;

  var bar = null;
  function hide() { if (bar) { bar.remove(); bar = null; } }
  function cb() { return window.Cookiebot; }
  function show() {
    if (bar || root.classList.contains(FULL)) return;
    var c = cb();
    if (!c || c.hasResponse) return;
    bar = document.createElement('div');
    bar.id = 'mdnaCookie';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookies');
    bar.innerHTML = '<p>' + T.text + ' <a href="' + policy + '">' + T.more + '</a></p>' +
      '<div class="b"><button type="button" class="n">' + T.no + '</button>' +
      '<button type="button" class="y">' + T.yes + '</button>' +
      '<button type="button" class="s">' + T.set + '</button></div>';
    bar.querySelector('.y').onclick = function () { hide(); try { cb().submitCustomConsent(true, true, true); } catch (e) {} };
    bar.querySelector('.n').onclick = function () { hide(); try { cb().submitCustomConsent(false, false, false); } catch (e) {} };
    bar.querySelector('.s').onclick = function () {
      hide(); root.classList.add(FULL);
      try { cb().show(); } catch (e) {}
    };
    (document.body || root).appendChild(bar);
  }
  // Cookiebot сам решает, нужно ли спрашивать: показываем плашку там же, где он показал бы окно
  window.addEventListener('CookiebotOnDialogDisplay', function () { if (!root.classList.contains(FULL)) show(); });
  window.addEventListener('CookiebotOnLoad', function () { if (cb() && !cb().hasResponse) show(); });
  function done() { hide(); root.classList.remove(FULL); }
  window.addEventListener('CookiebotOnAccept', done);
  window.addEventListener('CookiebotOnDecline', done);
})();
