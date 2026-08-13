# -*- coding: utf-8 -*-
"""Doğrulama: JSON geçerliliği, şema uyumu, eksik çeviri, kırık bağlantılar."""

import os
import re

TEXT_TYPES = {"text", "textarea", "color", "date", "select", "icon", "url", "password"}


def validate(content, path, schema, root):
    errors = []
    if not isinstance(content, (dict, list)):
        errors.append("JSON kökü bir nesne veya dizi olmalı.")
        return errors
    if schema:
        validate_schema(content, schema, errors, "$")
    check_translations(content, errors, "$")
    check_links(content, root, errors, "$")
    return errors


def validate_schema(node, schema, errors, loc):
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
                        if not isinstance(item, dict):
                            errors.append("%s: her öğe nesne olmalı." % iloc)
                        else:
                            validate_schema(item, {"fields": f["itemFields"], "required": f.get("itemRequired", [])}, errors, iloc)
                elif f.get("components"):
                    for i, item in enumerate(value):
                        validate_component(item, f["components"], errors, "%s[%d]" % (child, i))
        elif ftype == "lang":
            if not isinstance(value, dict):
                errors.append("%s: çoklu dil alanı (TR/EN) olmalı." % child)
        elif ftype == "number":
            if not isinstance(value, (int, float)) or isinstance(value, bool):
                errors.append("%s: sayı olmalı." % child)
        elif ftype == "boolean":
            if not isinstance(value, bool):
                errors.append("%s: doğru/yanlış olmalı." % child)
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
