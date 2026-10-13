# Черновик сайта (staging-*.html) = копия боевых страниц (13.10.2026).
#
#   python make_staging.py
#
# Берёт боевые RU/LV-страницы и юр. страницы, переводит внутренние ссылки на черновые
# (staging-…), ставит метку «Черновик» в углу и noindex. Дальше правки пробуются на
# staging-страницах, а после ОК переносятся на боевые.
# ВНИМАНИЕ: скрипт ПЕРЕЗАПИСЫВАЕТ staging-страницы. Если в черновике есть несогласованные
# правки — сначала перенесите их на боевые (или не запускайте).
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SLUGS = [(2, 'tarify'), (3, 'kak-eto-rabotaet'), (4, 'dlya-kogo'), (5, 'sayty'), (6, 'otzyvy-faq'), (7, 'kontakty')]

PAGES = {'ru.html': 'staging.html', 'index.html': 'staging-lv.html',
         'terms.html': 'staging-terms.html', 'privacy.html': 'staging-privacy.html',
         'atteikums.html': 'staging-atteikums.html'}
for n, slug in SLUGS:
    PAGES[f'ru-multi-{n}-{slug}.html'] = f'staging-{slug}.html'
    PAGES[f'lv-multi-{n}-{slug}.html'] = f'staging-lv-{slug}.html'

BADGE = ('<div id="stagingBadge" style="position:fixed;left:50%;top:0;transform:translateX(-50%);z-index:2147483646;'
         'background:#DC2626;color:#fff;font:700 11px/1 -apple-system,Segoe UI,sans-serif;'
         'letter-spacing:.5px;padding:3px 9px;border-radius:0 0 6px 6px;opacity:.85;pointer-events:none">'
         'ЧЕРНОВИК · STAGING</div>')


# Что пробуем на черновике до переноса на боевые (сейчас — компактная плашка cookies,
# 13.10.2026). Вставляется сразу после скрипта Cookiebot. Перенесли на боевые — убрать отсюда.
STAGING_ONLY_HEAD = '<script src="/cookie-banner.js" data-cookieconsent="ignore"></script>'


def add_head_extra(s):
    if not STAGING_ONLY_HEAD or STAGING_ONLY_HEAD in s:
        return s
    # обычные страницы: <script id="Cookiebot" …></script>; юр. страницы: Cookiebot вставляется скриптом
    m = re.search(r'<script id="Cookiebot"[^>]*></script>', s) or re.search(r'<script>[^\n]*?Cookiebot[^\n]*</script>', s)
    if m:
        return s[:m.end()] + '\n' + STAGING_ONLY_HEAD + s[m.end():]
    return s.replace('</head>', STAGING_ONLY_HEAD + '\n</head>', 1)


def relink(s):
    # href="ru.html", href="lv-multi-3-….html#x", href="terms.html?lang=ru" → черновые
    def rep(m):
        name, tail = m.group(2), m.group(3)
        return m.group(1) + PAGES.get(name, name) + tail
    s = re.sub(r'(href=")([\w.-]+\.html)((?:[?#][^"]*)?")', rep, s)
    s = re.sub(r"(location\.href\s*=\s*')([\w.-]+\.html)(['?#])", rep, s)
    return s


def main():
    for src, dst in PAGES.items():
        s = open(os.path.join(HERE, src), encoding='utf-8', newline='').read()
        s = relink(s)
        s = add_head_extra(s)
        if '<meta name="robots"' not in s:
            s = re.sub(r'(<meta charset="UTF-8">)', r'\1\n<meta name="robots" content="noindex,nofollow">', s, count=1, flags=re.I)
        s = s.replace('</body>', BADGE + '\n</body>', 1)
        open(os.path.join(HERE, dst), 'w', encoding='utf-8', newline='').write(s)
        print(f'  {src:36} → {dst}')


if __name__ == '__main__':
    main()
