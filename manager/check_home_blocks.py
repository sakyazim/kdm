# -*- coding: utf-8 -*-
"""Ana sayfa dinamik blok (home.json sections.*) bütünlük testi.

Her sections.* bloğu için:
  - enabled varsayılan açık;
  - dataSource dosyası mevcut ve JSON parse edilebiliyor;
  - beklenen veri alanı (dataKey veya bölüm şekli) dolu.

Kullanım: python manager/check_home_blocks.py
Çıkış: blokların durumu + genel SONUÇ (hata varsa exit 1).
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# expected structure per section: (key-name in source JSON or None for top-level list, min items)
STRUCT = {
    "collections": (None, 1),          # top-level list
    "services": ("services", 1),
    "news": ("newsItems", 1),
    "announcements": ("announcementItems", 1),
    "arrivals": ("arrivals", 1),       # arrivals.arrivals (eski format: top-level list)
}


def load_json(relpath):
    with open(os.path.join(ROOT, relpath.replace("/", os.sep)), encoding="utf-8") as f:
        return json.load(f)


def main():
    try:
        home = load_json("data/pages/home.json")
    except Exception as e:
        print("home.json okunamadı: %s" % e)
        return 1

    sections = home.get("sections") or {}
    failures = 0
    for key, (data_key, min_items) in STRUCT.items():
        sec = sections.get(key) or {}
        if sec.get("enabled") is False:
            print("[skip] %s (enabled=false)" % key)
            continue
        ds = sec.get("dataSource")
        if not ds:
            print("[FAIL] %s: dataSource tanımlı değil" % key)
            failures += 1
            continue
        if not os.path.isfile(os.path.join(ROOT, ds.replace("/", os.sep))):
            print("[FAIL] %s: veri kaynağı bulunamadı -> %s" % (key, ds))
            failures += 1
            continue
        try:
            data = load_json(ds)
        except Exception as e:
            print("[FAIL] %s: veri kaynağı JSON parse edilemedi (%s) -> %s" % (key, e, ds))
            failures += 1
            continue

        # Veri alanını çöz: dataKey override → seçilen alan → bölüm şekli
        dk = sec.get("dataKey")
        if not dk and data_key:
            dk = data_key
        items = None
        if dk:
            if isinstance(data, dict):
                items = data.get(dk)
        elif isinstance(data, list):
            items = data
        elif isinstance(data, dict) and data_key and data_key in data:
            items = data.get(data_key)
        else:
            items = data.get(dk or data_key) if data_key else None

        if not isinstance(items, list) or len(items) == 0:
            print("[FAIL] %s: '%s' alanı boş veya liste değil (%s -> %s)" % (
                key, dk or "(listeye üst seviye)", ds, data_key or "?"))
            failures += 1
            continue

        extra = ""
        if sec.get("maxItems"):
            extra = " (maxItems=%s, mevcut=%d)" % (sec["maxItems"], len(items))
        print("[ OK ] %s: %d öğe%s <- %s" % (key, len(items), extra, ds))

    print()
    print("SONUÇ: %s" % ("TEMİZ" if failures == 0 else "%d blokta hata" % failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())