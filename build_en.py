# Английская версия сайта (07.10.2026): en.html и en-multi-*.html собираются из русских
# страниц и перевода i18n/en.tsv (русская фраза <TAB> английский).
#
#   python build_en.py            — пересобрать английские страницы
#
# Русские страницы — источник: правите текст в ru.html / ru-multi-*.html, затем запускаете
# этот скрипт. Если в русском тексте появилась новая фраза, скрипт остановится и покажет её —
# её нужно перевести в i18n/en.tsv. Тот же en.tsv берёт дубайский сайт (marketingdna-dubai,
# make_tr.py), поэтому фразу достаточно перевести один раз.
import os
import re
import sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = {  # русская страница → (английская, латышская)
    'ru.html': ('en.html', 'index.html'),
    'ru-multi-2-tarify.html': ('en-multi-2-tarify.html', 'lv-multi-2-tarify.html'),
    'ru-multi-3-kak-eto-rabotaet.html': ('en-multi-3-kak-eto-rabotaet.html', 'lv-multi-3-kak-eto-rabotaet.html'),
    'ru-multi-4-dlya-kogo.html': ('en-multi-4-dlya-kogo.html', 'lv-multi-4-dlya-kogo.html'),
    'ru-multi-5-sayty.html': ('en-multi-5-sayty.html', 'lv-multi-5-sayty.html'),
    'ru-multi-6-otzyvy-faq.html': ('en-multi-6-otzyvy-faq.html', 'lv-multi-6-otzyvy-faq.html'),
    'ru-multi-7-kontakty.html': ('en-multi-7-kontakty.html', 'lv-multi-7-kontakty.html'),
}
CYR = re.compile('[А-Яа-яЁё]')
# Макет трёх телефонов в блоке «контент на трёх языках»: русский телефон и должен быть русским
KEEP_RU = {'Маркетинг', 'Тело просит паузу?', 'Массаж для тела, души и настроения.',
           'Ваш бизнес растёт. Мы берём контент на себя. #маркетинг #бизнес'}
ATTRS = ('placeholder', 'aria-label', 'alt', 'title', 'content')


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


class Phrases(HTMLParser):
    """Русские фразы страницы — так же, как их выписывает marketingdna-dubai/extract.py."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.out, self.tag = [], None

    def handle_starttag(self, t, a):
        self.tag = t
        for k, v in a:
            if k in ATTRS and v and CYR.search(v):
                self.out.append(norm(v))
            # строки в обработчиках: onclick="openSitePreview('…','Эксперт - Lena Kalnina')"
            if k.startswith('on') and v:
                self.out += [norm(m) for m in re.findall(r"'([^']*)'", v) if CYR.search(m)]

    def handle_startendtag(self, t, a):
        self.handle_starttag(t, a)
        self.tag = None

    def handle_data(self, d):
        if self.tag == 'style':
            return
        if self.tag == 'script':
            for m in re.finditer(r'>([^<>]*)<', d):
                if CYR.search(m.group(1)):
                    self.out.append(norm(m.group(1)))
            for m in re.finditer(r"'([^'<>\n]*)'|\"([^\"<>\n]*)\"", d):
                lit = m.group(1) or m.group(2) or ''
                if CYR.search(lit):
                    self.out.append(norm(lit))
            return
        t = norm(d)
        if t and CYR.search(t):
            self.out.append(t)

    def handle_endtag(self, t):
        self.tag = None


def load_en():
    d = {}
    for line in open(os.path.join(HERE, 'i18n', 'en.tsv'), encoding='utf-8').read().split('\n'):
        if line and not line.startswith('#'):
            ru, en = line.split('\t', 1)
            d[ru] = en.replace("'", '’')  # прямой апостроф сломал бы JS-строки
    return d


def ws(s):
    # пробелы/переносы в исходнике могут отличаться от нормализованной фразы
    return r'\s+'.join(re.escape(p) for p in s.split(' '))


def translate(s, pairs):
    for ru, t in pairs:
        if ru == t:
            continue
        pat = ws(ru)
        # текстовый узел может быть ограничен тегом или &nbsp;
        s = re.sub(r'(>\s*|&nbsp;\s*)' + pat + r'(\s*<|\s*&nbsp;)', lambda m: m.group(1) + t + m.group(2), s)
        s = re.sub(r'(="\s*)' + pat + r'(\s*")', lambda m: m.group(1) + t.replace('"', '&quot;') + m.group(2), s)
        # JS-строки, в том числе с пробелом у кавычки ('Мой сайт или Instagram: ' + v)
        s = re.sub(r"(' ?)" + pat + r"( ?')", lambda m: m.group(1) + t.replace("'", "\\'") + m.group(2), s)
    return s


def localize(s, ru_name):
    en_name, lv_name = PAGES[ru_name]
    s = s.replace('<html lang="ru">', '<html lang="en">', 1)
    s = s.replace('localStorage.setItem("mdna_lang","ru")', 'localStorage.setItem("mdna_lang","en")')

    # ссылки между страницами — на английские (до переключателя: в нём ссылка на RU остаётся)
    s = re.sub(r'href="ru\.html', 'href="en.html', s)
    s = re.sub(r'href="ru-multi-', 'href="en-multi-', s)

    # переключатель языков: LV и RU — ссылки, EN — текущий
    sw = ('<div class="lang-switcher">\n'
          f'      <a href="{lv_name}" class="lang-btn" onclick="try{{localStorage.setItem(\'mdna_lang\',\'lv\')}}catch(e){{}}">LV</a>\n'
          f'      <a href="{ru_name}" class="lang-btn" onclick="try{{localStorage.setItem(\'mdna_lang\',\'ru\')}}catch(e){{}}">RU</a>\n'
          '      <span class="lang-btn active">EN</span>\n'
          '    </div>')
    s, n = re.subn(r'<div class="lang-switcher">.*?</div>', sw, s, count=1, flags=re.S)
    assert n == 1, ru_name + ': нет переключателя языков'

    # условия, политика, отказ от договора — английский раздел
    s = re.sub(r'href="(terms|privacy|atteikums)\.html\?lang=ru', r'href="\1.html?lang=en', s)

    # бот: английский интерфейс (префикс en_ в параметре start)
    s = re.sub(r'\?start=(?!en_)(pkg_\w+|steps|website)', r'?start=en_\1', s)
    s = s.replace("'?start=steps'", "'?start=en_steps'")
    # ссылка клиента, зашитая в кнопку Telegram: en_L_<base64>. Лимит Telegram на
    # параметр — 64 символа: 'en_L_' (5) + до 59.
    s = s.replace("'?start=L_'", "'?start=en_L_'")
    s = s.replace('if (enc && enc.length <= 62)', 'if (enc && enc.length <= 59)')
    # оплата: те же ссылки Stripe (цены в евро те же), язык — меткой в client_reference_id.
    # Бот по ней показывает страницу после оплаты (/paid-start) на английском.
    s = re.sub(r'(client_reference_id=web--pkg_\w+)"', r'\1--en"', s)
    # заявки и клики — с языком en
    s = re.sub(r"lang: *'ru'", "lang: 'en'", s)
    s = s.replace("'ru_footer'", "'en_footer'")
    return s


def main():
    tr = load_en()
    pairs = sorted(tr.items(), key=lambda p: -len(p[0]))
    missing, left = [], {}
    for ru_name in PAGES:
        html = open(os.path.join(HERE, ru_name), encoding='utf-8').read()
        x = Phrases()
        x.feed(html)
        missing += [p for p in dict.fromkeys(x.out) if p not in tr and p not in missing]
    if missing:
        print(f'Нет перевода для {len(missing)} фраз — добавьте их в i18n/en.tsv:')
        for p in missing:
            print('   ', p)
        sys.exit(1)
    for ru_name, (en_name, _) in PAGES.items():
        html = open(os.path.join(HERE, ru_name), encoding='utf-8').read()
        out = localize(translate(html, pairs), ru_name)
        out = out.replace('<html lang="en">', '<html lang="en">\n<!-- Сгенерировано build_en.py из ' + ru_name
                          + ' — не правьте руками: правьте русскую страницу или i18n/en.tsv -->', 1)
        x = Phrases()
        x.feed(out)
        rest = [p for p in x.out if p not in KEEP_RU]
        if rest:
            left[en_name] = rest
        open(os.path.join(HERE, en_name), 'w', encoding='utf-8', newline='\n').write(out)
        print('  ', en_name)
    for k, v in left.items():
        print('ОСТАЛСЯ РУССКИЙ ТЕКСТ', k, v[:8])


if __name__ == '__main__':
    main()
