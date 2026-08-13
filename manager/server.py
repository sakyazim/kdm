#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Anadolu Üniversitesi Kütüphane — İçerik Yönetim Aracı (lokal sunucu).

Çalıştırma:
    python manager/server.py
    → Arayüz:  http://127.0.0.1:8123/manager/
    → Site:    http://127.0.0.1:8123/  (canlı önizleme)

Bağımlılık: yalnızca Python standart kütüphanesi + sistemde git.
Bu araç site dosyalarını değiştirmez; yalnızca data/ altındaki JSON
dosyalarını okur/yazar ve her kaydı git commit'i olarak saklar.
"""

import json
import mimetypes
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANAGER = os.path.dirname(os.path.abspath(__file__))
UI_DIR = os.path.join(MANAGER, "ui")
DATA_DIR = os.path.join(ROOT, "data")
SCHEMAS_DIR = os.path.join(MANAGER, "schemas")
HOST = os.environ.get("MANAGER_HOST", "127.0.0.1")
PORT = int(os.environ.get("MANAGER_PORT", "8123"))

sys.path.insert(0, MANAGER)
import gitops      # noqa: E402
import validation  # noqa: E402


def load_schemas():
    schemas = {}
    if os.path.isdir(SCHEMAS_DIR):
        for fn in sorted(os.listdir(SCHEMAS_DIR)):
            if fn.endswith(".json"):
                try:
                    with open(os.path.join(SCHEMAS_DIR, fn), encoding="utf-8") as f:
                        s = json.load(f)
                    if s.get("file"):
                        schemas[s["file"]] = s
                except Exception as e:
                    print("Şema okunamadı: %s (%s)" % (fn, e))
    return schemas


SCHEMAS = load_schemas()


def _safe_site_path(url_path):
    """URL yolunu site kökü içinde güvenli bir dosya yoluna çevirir."""
    decoded = urllib.parse.unquote(url_path)
    full = os.path.realpath(os.path.join(ROOT, decoded.lstrip("/")))
    if full != ROOT and not full.startswith(ROOT + os.sep):
        return None
    return full


def _write_target(relpath):
    """Yazma izni: yalnızca data/ altındaki .json dosyaları."""
    if not relpath or not relpath.endswith(".json"):
        return None
    full = os.path.realpath(os.path.join(ROOT, relpath.replace("\\", "/")))
    data_real = os.path.realpath(DATA_DIR)
    if not full.startswith(data_real + os.sep):
        return None
    return full


# ---------- API işlevleri ----------

def api_files():
    labels = {
        "pages": "Sayfalar",
        "global": "Genel Ayarlar",
        "content": "Ana Sayfa İçeriği",
        "agreements": "Anlaşmalar / Modal'lar",
    }
    out = []
    if os.path.isdir(DATA_DIR):
        for dirname in sorted(os.listdir(DATA_DIR)):
            d = os.path.join(DATA_DIR, dirname)
            if not os.path.isdir(d) or dirname.startswith("_"):
                continue
            files = []
            for fn in sorted(os.listdir(d)):
                if fn.endswith(".json") and not fn.startswith("."):
                    rel = "data/%s/%s" % (dirname, fn)
                    files.append({"path": rel, "name": fn, "hasSchema": rel in SCHEMAS})
            if files:
                out.append({"key": dirname, "label": labels.get(dirname, dirname), "files": files})
    return {"ok": True, "categories": out, "git": gitops.status()}


def api_get_file(relpath):
    full = _write_target(relpath)
    if full is None:
        return {"ok": False, "error": "Geçersiz dosya yolu (data/ altında .json olmalı)."}
    if not os.path.isfile(full):
        return {"ok": False, "error": "Dosya bulunamadı: %s" % relpath}
    with open(full, encoding="utf-8") as f:
        content = json.load(f)
    return {
        "ok": True,
        "path": relpath,
        "content": content,
        "schema": SCHEMAS.get(relpath),
        "git": gitops.status(),
    }


def api_validate(payload):
    relpath = payload.get("path", "")
    content = payload.get("content")
    if _write_target(relpath) is None:
        return 400, {"ok": False, "errors": ["Geçersiz dosya yolu."]}
    errors = validation.validate(content, relpath, SCHEMAS.get(relpath), ROOT)
    return 200, {"ok": not errors, "errors": errors}


def api_save_file(payload):
    relpath = payload.get("path", "")
    content = payload.get("content")
    message = payload.get("message", "")
    full = _write_target(relpath)
    if full is None:
        return 400, {"ok": False, "errors": ["Geçersiz dosya yolu (data/ altında .json olmalı)."]}
    if not isinstance(content, (dict, list)):
        return 400, {"ok": False, "errors": ["İçerik bir JSON nesnesi veya dizisi olmalı."]}
    errors = validation.validate(content, relpath, SCHEMAS.get(relpath), ROOT)
    if errors:
        return 400, {"ok": False, "validated": False, "errors": errors}
    try:
        blob = json.dumps(content, ensure_ascii=False, indent=2) + "\n"
        with open(full, "w", encoding="utf-8") as f:
            f.write(blob)
    except OSError as e:
        return 500, {"ok": False, "errors": ["Dosya yazılamadı: %s" % e]}
    ok, note = gitops.commit(relpath, message)
    return 200, {
        "ok": True,
        "validated": True,
        "commit": note,
        "git": gitops.status(),
        "message": "Kaydedildi ve commit edildi." if ok else note,
    }


# ---------- HTTP sunucu ----------

class Handler(BaseHTTPRequestHandler):
    server_version = "IcerikYonetim/0.1"

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _json(self, code, obj):
        self._send(code, json.dumps(obj, ensure_ascii=False))

    def _serve_static(self, url_path):
        if url_path.startswith("/manager/"):
            rel = url_path[len("/manager/"):]
            full = os.path.realpath(os.path.join(UI_DIR, rel))
            if not full.startswith(os.path.realpath(UI_DIR) + os.sep):
                return self._send(403, "Yasak", "text/plain; charset=utf-8")
        else:
            full = _safe_site_path(url_path)
        if full is None or not os.path.isfile(full):
            return self._send(404, "Bulunamadı", "text/plain; charset=utf-8")
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype == "application/javascript":
            ctype += "; charset=utf-8"
        with open(full, "rb") as f:
            self._send(200, f.read(), ctype)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path == "/api/files":
            return self._json(200, api_files())
        if path == "/api/git/status":
            return self._json(200, gitops.status())
        if path == "/api/file":
            qs = urllib.parse.parse_qs(parsed.query)
            return self._json(200, api_get_file(qs.get("path", [""])[0]))
        if path.startswith("/api/"):
            return self._json(404, {"ok": False, "error": "Bilinmeyen API."})
        if path in ("/manager", "/manager/"):
            return self._serve_static("/manager/index.html")
        if path.startswith("/manager/"):
            return self._serve_static(path)
        if path in ("/", ""):
            return self._serve_static("/index.html")
        return self._serve_static(path)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            return self._json(400, {"ok": False, "errors": ["JSON gövde okunamadı."]})
        if parsed.path == "/api/file":
            return self._json(*api_save_file(payload))
        if parsed.path == "/api/validate":
            return self._json(*api_validate(payload))
        return self._json(404, {"ok": False, "errors": ["Bilinmeyen API."]})

    def log_message(self, fmt, *args):
        msg = fmt % args
        if self.path.startswith("/api/") or "Traceback" in msg:
            sys.stderr.write("[%s] %s\n" % (self.address_string(), msg))


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    gitops.ensure_ready()
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as e:
        print("Sunucu başlatılamadı: %s" % e)
        print("Başka bir port için: MANAGER_PORT=8124 python manager/server.py")
        sys.exit(1)
    print("=" * 60)
    print("Kütüphane İçerik Yönetimi — lokal sunucu")
    print("Arayüz : http://%s:%d/manager/" % (HOST, PORT))
    print("Önizleme: http://%s:%d/  (site)" % (HOST, PORT))
    print("Git durumu: %s" % gitops.status())
    print("Kapatmak için Ctrl+C")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nKapatılıyor…")


if __name__ == "__main__":
    main()
