# -*- coding: utf-8 -*-
"""Doğrulama: JSON geçerliliği, şema uyumu, eksik çeviri, kırık bağlantılar, bozuk karakterler."""

import json
import os
import re

TEXT_TYPES = {"text", "textarea", "color", "date", "time", "select", "icon", "url", "password"}

# Mojibake (çift kodlama) tespiti: Türkçe/özel karakterlerin UTF-8 baytları
# cp1252 gibi tek baytlık kodlamayla okunup tekrar UTF-8 yazılması sonucu oluşan
# desenler. Her desen → olması gereken doğru karakter.
MOJIBAKE_MAP = {
    "Ã¶": "ö", "Ã¼": "ü", "Ã§": "ç", "Ã–": "Ö", "Ãœ": "Ü", "Ã‡": "Ç",
    "Ä±": "ı", "ÅŸ": "ş", "ÄŸ": "ğ", "Ä°": "İ", "Äž": "Ğ",
    "Ã±": "ñ", "Ã¡": "á", "Ã©": "é", "Ã¨": "è", "Ã®": "î", "Ã¯": "ï",
    "Ã´": "ô", "Ã¹": "ù", "Ã»": "û", "Ãº": "ú", "Ã³": "ó", "Ã¦": "æ",
    "Ã¸": "ø", "Ã¥": "å", "Ã¤": "ä", "Ã¶": "ö",
    "â€™": "'", "â€œ": "\"", "â€\u009d": "\"", "â€“": "–", "â€”": "—",
    "â€¦": "…", "â€¢": "•", "â€š": ",",
    "Â°": "°", "Â»": "»", "Â«": "«", "Â±": "±",
}
_MOJIBAKE_PATTERN = re.compile("|".join(re.escape(p) for p in sorted(MOJIBAKE_MAP, key=len, reverse=True)))


def validate(content, path, schema, root):
    errors = []
    if not isinstance(content, (dict, list)):
        errors.append("JSON kökü bir nesne veya dizi olmalı.")
        return errors
    if schema:
        validate_schema(content, schema, errors, "$")
    check_translations(content, errors, "$")
    check_links(content, root, errors, "$")
    check_mojibake(content, errors, "$")
    check_modal_refs(content, root, errors, "$")
    return errors


def check_modal_refs(node, root, errors, loc):
    """modalId referanslarını genel modal kütüphanesiyle doğrula (data/global/modals.json)."""
    if isinstance(node, dict):
        mid = node.get("modalId")
        if isinstance(mid, str) and mid and node.get("type") == "modal":
            ids = _modal_library_ids(root)
            if mid not in ids:
                errors.append("%s: '%s' modalı genel modal kütüphanesinde bulunamadı (data/global/modals.json)." % (loc, mid))
        for k, v in node.items():
            check_modal_refs(v, root, errors, "%s.%s" % (loc, k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            check_modal_refs(v, root, errors, "%s[%d]" % (loc, i))


def _modal_library_ids(root):
    try:
        with open(os.path.join(root, "data", "global", "modals.json"), encoding="utf-8") as f:
            lib = json.load(f)
        return set(m.get("id") for m in (lib.get("modals") or []) if isinstance(m, dict))
    except Exception:
        return set()


def check_mojibake(node, errors, loc):
    """Tüm metin değerlerinde bozuk karakter kodlaması (mojibake) ara."""
    if isinstance(node, dict):
        for k, v in node.items():
            check_mojibake(v, errors, "%s.%s" % (loc, k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            check_mojibake(v, errors, "%s[%d]" % (loc, i))
    elif isinstance(node, str):
        m = _MOJIBAKE_PATTERN.search(node)
        if m:
            bad = m.group(0)
            good = MOJIBAKE_MAP.get(bad, "?")
            snippet = node[max(0, m.start() - 12):m.end() + 12].replace("\n", " ")
            errors.append(
                "%s: bozuk karakter kodlaması (mojibake) — '%s' yerine '%s' olması gerekiyor. "
                "Metin: …%s… (Dosya UTF-8 olarak kaydedilmeli.)" % (loc, bad, good, snippet))


def validate_schema(node, schema, errors, loc):
    # Kök dizi şeması (root: "array" — örn. collections.json)
    if schema.get("root") == "array":
        if not isinstance(node, list):
            errors.append("%s: dizi olmalı." % loc)
            return
        item_fields = schema.get("itemFields") or []
        for i, item in enumerate(node):
            iloc = "%s[%d]" % (loc, i)
            if not isinstance(item, dict):
                errors.append("%s: her öğe nesne olmalı." % iloc)
            elif item_fields:
                validate_schema(item, {"fields": item_fields, "required": schema.get("itemRequired", [])}, errors, iloc)
        return
    fields = schema.get("fields") or []
    if not isinstance(node, dict):
        return
    for f in fields:
        key = f.get("key")
        if not key:
            continue
        if key not in node:
            if f.get("required"):
                errors.append("%s: '%s' zorunlu alan eksik." % (loc, key))
            continue
        value = node[key]
        ftype = f.get("type", "text")
        child = "%s.%s" % (loc, key)
        if ftype == "object":
            if not isinstance(value, dict):
                errors.append("%s: nesne olmalı." % child)
            elif f.get("fields"):
                validate_schema(value, {"fields": f["fields"], "required": f.get("required", [])}, errors, child)
        elif ftype in ("array", "components"):
            if not isinstance(value, list):
                errors.append("%s: dizi olmalı." % child)
            else:
                if f.get("itemType"):
                    for i, item in enumerate(value):
                        iloc = "%s[%d]" % (child, i)
                        if f["itemType"] == "number" and not isinstance(item, (int, float)):
                            errors.append("%s: sayı olmalı." % iloc)
                        elif f["itemType"] == "text" and not isinstance(item, str):
                            errors.append("%s: metin olmalı." % iloc)
                elif f.get("itemFields"):
                    for i, item in enumerate(value):
                        iloc = "%s[%d]" % (child, i)
                        if isinstance(item, list):
                            # Dizi öğesi (iç içe dizi — örn. karşılaştırma tablosu satırı): itemFields sırayla hücrelerle eşleşir
                            for j, cell in enumerate(item):
                                if j >= len(f["itemFields"]):
                                    continue
                                sf = f["itemFields"][j]
                                vloc = "%s[%d]" % (iloc, j)
                                st = sf.get("type", "text")
                                if st == "lang":
                                    if not isinstance(cell, (dict, str)):
                                        errors.append("%s: çoklu dil alanı (TR/EN) veya metin olmalı." % vloc)
                                elif st == "number":
                                    if not isinstance(cell, (int, float)) or isinstance(cell, bool):
                                        errors.append("%s: sayı olmalı." % vloc)
                                elif st == "boolean":
                                    if not isinstance(cell, bool):
                                        errors.append("%s: doğru/yanlış olmalı." % vloc)
                                elif st in TEXT_TYPES:
                                    if not isinstance(cell, str):
                                        errors.append("%s: metin olmalı." % vloc)
                        elif not isinstance(item, dict):
                            errors.append("%s: her öğe nesne olmalı." % iloc)
                        else:
                            validate_schema(item, {"fields": f["itemFields"], "required": f.get("itemRequired", [])}, errors, iloc)
                elif f.get("components"):
                    for i, item in enumerate(value):
                        validate_component(item, f["components"], errors, "%s[%d]" % (child, i))
        elif ftype == "lang":
            if not isinstance(value, (dict, str)):
                errors.append("%s: çoklu dil alanı (TR/EN) veya metin olmalı." % child)
        elif ftype == "number":
            if not isinstance(value, (int, float)) or isinstance(value, bool):
                errors.append("%s: sayı olmalı." % child)
        elif ftype == "boolean":
            if not isinstance(value, bool):
                errors.append("%s: doğru/yanlış olmalı." % child)
        elif ftype == "day-multiselect":
            if (not isinstance(value, list)
                    or not all(isinstance(n, int) and not isinstance(n, bool) and 0 <= n <= 6 for n in value)):
                errors.append("%s: gün listesi olmalı (0-6 arası sayılar)." % child)
        elif ftype in TEXT_TYPES:
            if not isinstance(value, str):
                errors.append("%s: metin olmalı." % child)
        # raw / any → serbest (içerik yapılandırılmış halde geldiği için)


def validate_component(item, registry, errors, loc):
    if not isinstance(item, dict):
        errors.append("%s: bileşen nesne olmalı." % loc)
        return
    ctype = item.get("type")
    if ctype not in registry:
        errors.append("%s: bilinmeyen bileşen tipi '%s'." % (loc, ctype))
        return
    comp = registry[ctype]
    data = item.get("data")
    if comp.get("fields"):
        if not isinstance(data, dict):
            errors.append("%s: '%s' bileşeninin verisi nesne olmalı." % (loc, ctype))
        else:
            validate_schema(data, {"fields": comp["fields"], "required": comp.get("required", [])}, errors, "%s.data" % loc)


def check_translations(node, errors, loc):
    if isinstance(node, dict):
        keys = set(node.keys())
        if "tr" in keys or "en" in keys:
            for lang in ("tr", "en"):
                if lang not in keys:
                    errors.append("%s: '%s' çevirisi eksik." % (loc, lang))
        for k, v in node.items():
            check_translations(v, errors, "%s.%s" % (loc, k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            check_translations(v, errors, "%s[%d]" % (loc, i))


_HTML_LINK_RE = re.compile(r"\b([A-Za-z0-9_./-]+\.html)\b")
_PATH_RE = re.compile(r"\b(data|assets)/[A-Za-z0-9_./-]+")


def check_links(node, root, errors, loc):
    if isinstance(node, dict):
        for k, v in node.items():
            check_links(v, root, errors, "%s.%s" % (loc, k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            check_links(v, root, errors, "%s[%d]" % (loc, i))
    elif isinstance(node, str):
        s = node
        if "//" in s or s.startswith(("http:", "https:", "mailto:", "tel:", "#", "data:")):
            return
        for m in _HTML_LINK_RE.finditer(s):
            target = m.group(1)
            if not os.path.isfile(os.path.join(root, target)):
                errors.append("%s: '%s' sayfası bulunamadı." % (loc, target))
        for m in _PATH_RE.finditer(s):
            target = m.group(0)
            rel = target.replace("/", os.sep)
            if not os.path.isfile(os.path.join(root, rel)):
                errors.append("%s: '%s' dosyası bulunamadı." % (loc, target))
