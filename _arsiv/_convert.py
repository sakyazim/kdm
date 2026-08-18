# -*- coding: utf-8 -*-
"""
HTML → Yapılandırılmış Veri Dönüştürücü
- sss.json answer → ComponentRenderer blok dizisi
- diğer alanlar → markdown benzeri hafif işaretleme
Kullanım: python _convert.py <file.json> [--dry]
"""
import json, os, re, sys, html as html_mod
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ---------------------------------------------------------------- inline HTML → markdown
def inline_to_md(html):
    """Satır içi HTML'i markdown'a çevirir: strong/a/em/code/br/i(ikon)/span."""
    if not html:
        return ''
    # <br> → \n
    s = re.sub(r'<br\s*/?>', '\n', html, flags=re.I)
    # <strong>/<b> → **
    s = re.sub(r'<(strong|b)\b[^>]*>(.*?)</\1>', lambda m: '**' + m.group(2) + '**', s, flags=re.I | re.S)
    # İkon <i class="fa ...">...</i> → içeriği koru (ikon etiketi düşer)
    s = re.sub(r'<i\b[^>]*class=["\'][^"\']*["\'][^>]*>(.*?)</i>', lambda m: inline_to_md(m.group(1)), s, flags=re.I | re.S)
    # <em>/<i> (içerik amaçlı, ikon değilse) → *
    s = re.sub(r'<(em|i)\b[^>]*>(.*?)</\1>', lambda m: '*' + m.group(2) + '*', s, flags=re.I | re.S)
    # <a href="u">x</a> → [x](u)
    s = re.sub(
        r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        lambda m: '[{}]({})'.format(inline_to_md(m.group(2)), m.group(1)),
        s, flags=re.I | re.S)
    # <code> → `kod`
    s = re.sub(r'<code\b[^>]*>(.*?)</code>', lambda m: '`' + m.group(1) + '`', s, flags=re.I | re.S)
    # <span>...</span> → içeriği
    s = re.sub(r'<span\b[^>]*>(.*?)</span>', lambda m: inline_to_md(m.group(1)), s, flags=re.I | re.S)
    # Diğer etiketleri aç/kapa → içerik
    s = re.sub(r'</?(?:u|s|mark|sub|sup|small)\b[^>]*>', '', s, flags=re.I)
    # Entity decode (nbsp vb.)
    s = html_mod.unescape(s)
    return s

# ---------------------------------------------------------------- blok seviyesi
def strip_tags(html):
    """Etiketleri kaldırıp düz metin döndürür (başlık, açıklama vs. için)."""
    if not html:
        return ''
    # ikonları at, geri kalanı düz metne çevir
    s = re.sub(r'<i\b[^>]*class=["\'][^"\']*["\'][^>]*>\s*</i>', '', html, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    return html_mod.unescape(s).strip()

VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
BLOCK_TAGS = {'div', 'p', 'ul', 'ol', 'li', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'blockquote'}

class BlockParser(HTMLParser):
    """HTML'i derinlik takibiyle üst düzey bloklara böler.
    Her blok: {'tag', 'attrs', 'html'} — html, bloğun TAM ham HTML'ini içerir."""
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.depth = 0
        self.blocks = []
        self.current = None   # {'tag','attrs','html': []}

    def handle_starttag(self, tag, attrs):
        if self.current is None and tag in BLOCK_TAGS:
            self.current = {'tag': tag, 'attrs': dict(attrs), 'html': []}
        if self.current:
            self.current['html'].append(self.get_starttag_text())
        if tag not in VOID_TAGS:
            self.depth += 1

    def handle_startendtag(self, tag, attrs):
        if self.current:
            self.current['html'].append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            if self.current:
                self.current['html'].append('</{}>'.format(tag))
            return
        if self.current:
            self.current['html'].append('</{}>'.format(tag))
        self.depth -= 1
        if self.depth == 0 and self.current:
            self.blocks.append(self.current)
            self.current = None

    def handle_data(self, data):
        if self.current:
            self.current['html'].append(data)

    def handle_entityref(self, name):
        if self.current:
            self.current['html'].append('&{};'.format(name))

    def handle_charref(self, name):
        if self.current:
            self.current['html'].append('&#{};'.format(name))

    def handle_comment(self, data):
        if self.current:
            self.current['html'].append('<!--{}-->'.format(data))

def split_components(html):
    """HTML'i üst düzey parçalara böler. Her parça: dict {tag, attrs, inner}."""
    if not html or not html.strip():
        return []
    p = BlockParser()
    try:
        p.feed(html)
    except Exception:
        pass
    parts = []
    for b in p.blocks:
        html_str = ''.join(b['html'])
        inner = html_str
        # kendi açılış etiketini çıkar
        m = re.match(r'<[^>]*>', html_str)
        if m:
            inner = html_str[m.end():]
        # kendi kapanış etiketini çıkar (en sondaki)
        end = '</{}>'.format(b['tag'])
        if inner.endswith(end):
            inner = inner[:-len(end)]
        parts.append({'tag': b['tag'], 'attrs': b['attrs'], 'html': html_str, 'inner': inner})
    return parts

# ---------------------------------------------------------------- bileşen çevirici
def attr_dict(attrs_str):
    d = {}
    for k, v in re.findall(r'([\w-]+)\s*=\s*["\']([^"\']*)["\']', attrs_str):
        d[k] = v
    return d

def parse_icon(html):
    m = re.search(r'<i\b[^>]*class=["\']([^"\']+)["\']', html)
    return m.group(1).strip() if m else ''

def parse_alert(attrs, inner):
    variant = attrs.get('class', 'component-alert').replace('component-alert', '').strip() or 'info'
    icon = parse_icon(inner)
    # <strong>...</strong> ilk başlık
    title = ''
    m = re.search(r'<strong\b[^>]*>(.*?)</strong>', inner, re.S)
    if m:
        title = inline_to_md(m.group(1))
    # içerik: <p>...</p> blokları
    ps = re.findall(r'<p\b[^>]*>(.*?)</p>', inner, re.S)
    content = '\n\n'.join(inline_to_md(p) for p in ps)
    # liste içerik (style=list)
    items = []
    ul = re.search(r'<ul\b[^>]*>(.*?)</ul>', inner, re.S)
    if ul:
        items = [inline_to_md(x) for x in re.findall(r'<li\b[^>]*>(.*?)</li>', ul.group(1), re.S)]
    # link
    link = linkText = linkIcon = ''
    m = re.search(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', inner, re.S)
    if m:
        link = m.group(1)
        linkText = inline_to_md(m.group(2))
        linkIcon = parse_icon(m.group(2))
    data = {}
    if icon: data['icon'] = icon
    if title: data['title'] = title
    if items:
        data['items'] = items
    if content: data['content'] = content
    if link and linkText:
        data['link'] = link
        data['linkText'] = linkText
        if linkIcon: data['linkIcon'] = linkIcon
    return {'type': 'alert', 'variant': variant, 'data': data}

def parse_info_box(attrs, inner):
    icon = parse_icon(inner)
    # info-title içindeki span = başlık
    title = ''
    m = re.search(r'info-title.*?<span[^>]*>(.*?)</span>', inner, re.S)
    if m:
        title = inline_to_md(m.group(1))
    # info-content içindeki p'ler
    content = ''
    mc = re.search(r'info-content\b[^>]*>(.*?)</div>', inner, re.S)
    if mc:
        ps = re.findall(r'<p\b[^>]*>(.*?)</p>', mc.group(1), re.S)
        content = '\n\n'.join(inline_to_md(p) for p in ps) if ps else inline_to_md(mc.group(1))
    data = {}
    if icon: data['titleIcon'] = icon
    if title: data['title'] = title
    if content: data['content'] = content
    return {'type': 'info-box', 'data': data}

def parse_icon_list(attrs, inner):
    title = ''
    titleIcon = ''
    m = re.search(r'list-title\b[^>]*>(.*?)</div>', inner, re.S)
    if m:
        titleHtml = m.group(1)
        titleIcon = parse_icon(titleHtml)
        title = inline_to_md(re.sub(r'<i\b[^>]*>.*?</i>', '', titleHtml, flags=re.S)).strip()
    items = []
    for li in re.finditer(r'<div class=["\']list-item["\'][^>]*>(.*?)</div>', inner, re.S):
        item_html = li.group(1)
        icon = parse_icon(item_html)
        # <strong>Başlık</strong><br>Açıklama
        sm = re.search(r'<strong\b[^>]*>(.*?)</strong>', item_html, re.S)
        strong = inline_to_md(sm.group(1)) if sm else ''
        # açıklama: strong sonrası (br ayıklanmış)
        rest = re.sub(r'<strong\b[^>]*>.*?</strong>', '', item_html, flags=re.S)
        rest = inline_to_md(rest).strip()
        it = {}
        if icon: it['icon'] = icon
        if strong: it['title'] = strong
        elif rest: it['title'] = rest
        if rest and strong:
            it['description'] = rest
        if it:
            items.append(it)
    data = {}
    if title:
        data['title'] = title
        if titleIcon: data['titleIcon'] = titleIcon
    data['items'] = items
    return {'type': 'icon-list', 'data': data}

def parse_table(attrs, inner):
    headers = []
    for th in re.finditer(r'<th\b[^>]*>(.*?)</th>', inner, re.S):
        headers.append(inline_to_md(th.group(1)))
    rows = []
    for tr in re.finditer(r'<tr\b[^>]*>(.*?)</tr>', inner, re.S):
        tds = re.findall(r'<td\b[^>]*>(.*?)</td>', tr.group(1), re.S)
        if not tds:
            continue
        icon = parse_icon(tds[0])
        cells = [inline_to_md(td) for td in tds]
        row = {'cells': cells}
        if icon:
            row['icon'] = icon
        rows.append(row)
    data = {'headers': headers, 'rows': rows}
    return {'type': 'table', 'data': data}

def html_to_blocks(html):
    """sss.json answer dönüşümü: HTML → ComponentRenderer blok dizisi."""
    blocks = []
    for part in split_components(html):
        tag = part['tag']
        attrs = attr_dict(part['attrs']) if isinstance(part['attrs'], str) else part['attrs']
        inner = part['inner']
        cls = attrs.get('class', '')
        if tag == 'div' and 'component-alert' in cls:
            blocks.append(parse_alert(attrs, inner))
        elif tag == 'div' and 'component-info-box' in cls:
            blocks.append(parse_info_box(attrs, inner))
        elif tag == 'div' and 'component-icon-list' in cls:
            blocks.append(parse_icon_list(attrs, inner))
        elif tag == 'div' and ('component-table' in cls or 'table-responsive' in cls):
            blocks.append(parse_table(attrs, inner))
        elif tag == 'div' and 'table-responsive' in cls:
            blocks.append(parse_table(attrs, inner))
        else:
            # basit içerik → content bloğu (markdown)
            md = block_to_md(part)
            if md:
                blocks.append({'type': 'content', 'data': {'content': md}})
    return blocks

def block_to_md(part):
    tag = part['tag']
    inner = part['inner']
    if tag == 'p':
        return inline_to_md(inner)
    if tag == 'ul':
        return '\n'.join('- ' + inline_to_md(x) for x in re.findall(r'<li\b[^>]*>(.*?)</li>', inner, re.S))
    if tag == 'ol':
        return '\n'.join('{}. '.format(i + 1) + inline_to_md(x) for i, x in enumerate(re.findall(r'<li\b[^>]*>(.*?)</li>', inner, re.S)))
    if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
        return '**' + inline_to_md(inner) + '**'
    if tag == 'table':
        return parse_table({}, inner)  # nadir
    if tag == 'text':
        return inline_to_md(inner)
    return inline_to_md(inner)

# ---------------------------------------------------------------- markdown dönüşümü (Aile A)
def html_to_markdown(html):
    """Genel içerik alanları: HTML → markdown string."""
    parts = split_components(html)
    if not parts:
        # blok etiketi yok → tamamı satır içi (örn. sadece <strong>/<i> içeren hücre)
        return inline_to_md(html).strip()
    blocks = []
    for part in parts:
        md = block_to_md(part)
        if md:
            blocks.append(md)
    return '\n\n'.join(b for b in blocks if b.strip())

# ---------------------------------------------------------------- ana
def process_file(path, dry=False):
    data = json.load(open(path, encoding='utf-8'))
    changed = []
    def walk(node, path_str):
        if isinstance(node, dict):
            for k, v in list(node.items()):
                if isinstance(v, str) and '<' in v and '>' in v and re.search(r'<(p|div|ul|ol|li|table|strong|a|br|span|i|em|code)\b', v):
                    if 'component-' in v:
                        new = html_to_blocks(v)
                        node[k] = new
                        changed.append((path_str + '/' + k, 'blocks', len(v)))
                    else:
                        new = html_to_markdown(v)
                        node[k] = new
                        changed.append((path_str + '/' + k, 'md', len(v)))
                else:
                    walk(v, path_str + '/' + k)
        elif isinstance(node, list):
            for i, item in enumerate(node):
                if isinstance(item, str) and '<' in item and '>' in item and re.search(r'<(p|div|ul|ol|li|table|strong|a|br|span|i|em|code)\b', item):
                    # liste içinde doğrudan string (örn. table rows hücreleri)
                    new = html_to_markdown(item)
                    node[i] = new
                    changed.append(('{}[{}]'.format(path_str, i) + '/<hücre>', 'md', len(item)))
                else:
                    walk(item, '{}[{}]'.format(path_str, i))
    walk(data, '')
    if not dry:
        json.dump(data, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('{}: {} alan dönüştürüldü'.format(os.path.basename(path), len(changed)))
    for p, kind, ln in changed[:8]:
        print('  [{}] {} ({} ch)'.format(kind, p, ln))
    if len(changed) > 8:
        print('  ... ve {} daha'.format(len(changed) - 8))

if __name__ == '__main__':
    dry = '--dry' in sys.argv
    for f in sys.argv[1:]:
        if f == '--dry':
            continue
        process_file(f, dry=dry)
