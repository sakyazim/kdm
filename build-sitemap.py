#!/usr/bin/env python3
"""Kök dizindeki *.html dosyalarından sitemap.xml üretir."""
import datetime
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
BASE = "https://kdm.anadolu.edu.tr"
OUT = ROOT / "sitemap.xml"

PRIORITY = {"index.html": "1.0"}
CHANGEFREQ = {"index.html": "daily"}


def lastmod(path: pathlib.Path) -> str:
    mtime = datetime.datetime.fromtimestamp(path.stat().st_mtime, datetime.timezone.utc)
    return mtime.date().isoformat()


def main() -> None:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        raise SystemExit("HTML dosyası bulunamadı")

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for page in pages:
        name = page.name
        lines.append("  <url>")
        lines.append(f"    <loc>{BASE}/{name}</loc>")
        lines.append(f"    <lastmod>{lastmod(page)}</lastmod>")
        lines.append(f"    <changefreq>{CHANGEFREQ.get(name, 'monthly')}</changefreq>")
        lines.append(f"    <priority>{PRIORITY.get(name, '0.8')}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"sitemap.xml güncellendi: {len(pages)} sayfa")


if __name__ == "__main__":
    main()