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
import secrets
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
import publish     # noqa: E402
import validation  # noqa: E402

CONFIG_PATH = os.path.join(MANAGER, "config.json")


def load_config():
    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


CONFIG = load_config()


GLOBAL_COMPONENTS = {}


def load_schemas():
    global GLOBAL_COMPONENTS
    comp_path = os.path.join(SCHEMAS_DIR, "_components.json")
    if os.path.isfile(comp_path):
        try:
            with open(comp_path, encoding="utf-8") as f:
                GLOBAL_COMPONENTS = (json.load(f) or {}).get("components", {}) or {}
        except Exception as e:
            print("Bileşen kayıt defteri okunamadı: %s" % e)
    schemas = {}
    if os.path.isdir(SCHEMAS_DIR):
        for fn in sorted(os.listdir(SCHEMAS_DIR)):
            if fn.startswith("_") or not fn.endswith(".json"):
                continue
            try:
                with open(os.path.join(SCHEMAS_DIR, fn), encoding="utf-8") as f:
                    s = json.load(f)
                if s.get("file"):
                    _resolve_registry(s.get("fields", []))
                    schemas[s["file"]] = s
            except Exception as e:
                print("Şema okunamadı: %s (%s)" % (fn, e))
    return schemas


def _resolve_registry(fields):
    """'registry' referanslarını ortak bileşen kayıt defteriyle doldurur."""
    for f in fields or []:
        t = f.get("type")
        if t == "components" and f.get("registry") == "components" and GLOBAL_COMPONENTS:
            f["components"] = GLOBAL_COMPONENTS
            f.pop("registry", None)
        elif t == "object" and f.get("fields"):
            _resolve_registry(f["fields"])
        elif t == "array" and f.get("itemFields"):
            _resolve_registry(f["itemFields"])


def _pretty_key(key):
    return str(key).replace("-", " ").replace("_", " ").capitalize()


def _infer_field(key, value, depth=0):
    """Değerin yapısından şema alanı çıkarır (dinamik şema)."""
    if isinstance(value, dict):
        if "tr" in value or "en" in value:
            return {"key": key, "label": _pretty_key(key), "type": "lang"}
        if depth < 2 and all(isinstance(v, (dict, list, str, int, float, bool)) for v in value.values()):
            return {
                "key": key,
                "label": _pretty_key(key),
                "type": "object",
                "fields": [_infer_field(k, v, depth + 1) for k, v in value.items()],
            }
        return {"key": key, "label": _pretty_key(key), "type": "raw"}
    if isinstance(value, list):
        if not value:
            return {"key": key, "label": _pretty_key(key), "type": "array"}
        if all(isinstance(v, dict) for v in value):
            if (all("type" in v for v in value) and any("data" in v for v in value)
                    and all(v.get("type") in GLOBAL_COMPONENTS for v in value)):
                return {"key": key, "label": _pretty_key(key), "type": "components", "registry": "components"}
            keys = []
            for v in value:
                for k in v:
                    if k not in keys:
                        keys.append(k)
            fields = [_infer_field(k, value[0].get(k), depth + 1) for k in keys]
            for fld in fields:
                if fld["key"] == "data":
                    fld["type"] = "raw"
            return {"key": key, "label": _pretty_key(key), "type": "array", "itemLabel": "Öğe", "itemFields": fields}
        if all(isinstance(v, (str, int, float, bool)) for v in value):
            it = "number" if all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in value) else "text"
            return {"key": key, "label": _pretty_key(key), "type": "array", "itemType": it}
        return {"key": key, "label": _pretty_key(key), "type": "raw"}
    if isinstance(value, bool):
        return {"key": key, "label": _pretty_key(key), "type": "boolean"}
    if isinstance(value, (int, float)):
        return {"key": key, "label": _pretty_key(key), "type": "number"}
    return {"key": key, "label": _pretty_key(key), "type": "text"}


def dynamic_schema(content):
    """İçerik yapısından otomatik şema üretir (elle şeması olmayan dosyalar için)."""
    if not isinstance(content, dict):
        return None
    fields = [_infer_field(k, v) for k, v in content.items()]
    if not fields:
        return None
    schema = {"file": "dynamic", "label": "Otomatik Şema", "dynamic": True, "fields": fields}
    _resolve_registry(fields)
    return schema


def get_schema(relpath, content):
    s = SCHEMAS.get(relpath)
    return s if s else dynamic_schema(content)


SCHEMAS = load_schemas()

# Canlı önizleme: oturum (sid) -> {dosya yolu: {"content": ..., "errors": [...], "valid": bool}}
PREVIEW_STORE = {}


def _cookie_value(headers, name):
    cookie = headers.get("Cookie", "")
    for part in cookie.split(";"):
        part = part.strip()
        if part.startswith(name + "="):
            val = part[len(name) + 1:].strip()
            return val or None
    return None


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
    # Sayfalar ilk sırada, sonra diğerleri
    order = ["pages", "global", "content", "agreements"]
    dirs = [d for d in order if os.path.isdir(os.path.join(DATA_DIR, d))]
    dirs += sorted(
        d for d in os.listdir(DATA_DIR)
        if os.path.isdir(os.path.join(DATA_DIR, d)) and not d.startswith("_") and d not in order
    )
    out = []
    dirty = set(gitops.dirty_paths())
    for dirname in dirs:
        d = os.path.join(DATA_DIR, dirname)
        files = []
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".json") and not fn.startswith("."):
                rel = "data/%s/%s" % (dirname, fn)
                files.append({"path": rel, "name": fn, "hasSchema": True, "explicit": rel in SCHEMAS, "dirty": rel in dirty})
        if files:
            out.append({"key": dirname, "label": labels.get(dirname, dirname), "files": files})
    return {"ok": True, "categories": out, "git": gitops.status(), "dirty": sorted(dirty)}


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
        "schema": get_schema(relpath, content),
        "git": gitops.status(),
    }


def api_validate(payload):
    relpath = payload.get("path", "")
    content = payload.get("content")
    if _write_target(relpath) is None:
        return 400, {"ok": False, "errors": ["Geçersiz dosya yolu."]}
    errors = validation.validate(content, relpath, get_schema(relpath, content), ROOT)
    return 200, {"ok": not errors, "errors": errors}


def api_history(relpath):
    return {"ok": True, "path": relpath, "commits": gitops.log_for_path(relpath)}


def api_diff(relpath):
    """Çalışma ağacı vs HEAD farkı (kaydedilmemiş değişiklik özeti için)."""
    if _write_target(relpath) is None:
        return {"ok": False, "error": "Geçersiz dosya yolu."}
    return {"ok": True, "path": relpath, "diff": gitops.diff(relpath, "HEAD", "")}


def api_history_diff(payload):
    relpath = payload.get("path", "")
    from_c = payload.get("from", "HEAD")
    to_c = payload.get("to", "HEAD")
    return 200, {"ok": True, "diff": gitops.diff(relpath, from_c, to_c)}


def api_history_restore(payload):
    relpath = payload.get("path", "")
    commit = payload.get("commit", "")
    if _write_target(relpath) is None:
        return 400, {"ok": False, "errors": ["Geçersiz dosya yolu."]}
    raw = gitops.file_at_commit(relpath, commit)
    if raw is None:
        return 400, {"ok": False, "errors": ["Commit'te dosya bulunamadı."]}
    try:
        content = json.loads(raw)
    except Exception:
        return 400, {"ok": False, "errors": ["O sürüm geçerli bir JSON değil."]}
    errors = validation.validate(content, relpath, get_schema(relpath, content), ROOT)
    if errors:
        return 400, {"ok": False, "errors": errors}
    try:
        with open(_write_target(relpath), "w", encoding="utf-8") as f:
            f.write(json.dumps(content, ensure_ascii=False, indent=2) + "\n")
    except OSError as e:
        return 500, {"ok": False, "errors": ["Dosya yazılamadı: %s" % e]}
    ok, note = gitops.commit(relpath, "Sürüm geri alındı (%s)" % commit[:7])
    return 200, {"ok": True, "message": note, "git": gitops.status()}


def api_git_sync():
    ok, msg = gitops.sync(CONFIG.get("remote") or "")
    return (200 if ok else 400), {"ok": ok, "message": msg, "git": gitops.status()}


def api_publish_info():
    dirty = set(gitops.dirty_paths())
    files = []
    if os.path.isdir(DATA_DIR):
        for dirpath, _dirs, fns in os.walk(DATA_DIR):
            for fn in sorted(fns):
                if fn.endswith(".json") and not fn.startswith("."):
                    rel = os.path.relpath(os.path.join(dirpath, fn), ROOT).replace("\\", "/")
                    files.append({"path": rel, "dirty": rel in dirty})
    return {"ok": True, "files": files, "sftpConfigured": publish.sftp_configured(CONFIG)}


def api_publish(payload):
    paths = payload.get("paths") or []
    if not paths:
        return 400, {"ok": False, "errors": ["Yayımlanacak dosya seçilmedi."]}
    if not publish.sftp_configured(CONFIG):
        return 400, {"ok": False, "errors": ["SFTP tanımlı değil (manager/config.json içine girin)."]}
    ok, out = publish.sftp_publish(CONFIG, paths)
    if ok:
        return 200, {"ok": True, "message": "Yayımlandı:\n" + "\n".join(out)}
    return 500, {"ok": False, "errors": out}


def api_icons():
    """Projede kullanılan FontAwesome ikonlarını veriden tarar."""
    import re as _re
    pat_fa = _re.compile(r"\bfa[srb]?\s+fa-[a-z0-9-]+")
    pat_bi = _re.compile(r"\bbi-[a-z0-9-]+")
    icons = set()
    if os.path.isdir(DATA_DIR):
        for dirpath, _dirs, files in os.walk(DATA_DIR):
            for fn in files:
                if not fn.endswith(".json"):
                    continue
                try:
                    with open(os.path.join(dirpath, fn), encoding="utf-8") as f:
                        txt = f.read()
                except Exception:
                    continue
                for m in pat_fa.finditer(txt):
                    icons.add(m.group(0).strip())
                for m in pat_bi.finditer(txt):
                    icons.add(m.group(0))
    return {"ok": True, "icons": sorted(icons)}


def api_preview_set(payload):
    """Canlı önizleme: düzenlenen veriyi sunucu belleğine koy (diske yazmaz)."""
    sid = payload.get("session", "")
    relpath = payload.get("path", "")
    content = payload.get("content")
    if not sid or _write_target(relpath) is None:
        return 400, {"ok": False, "error": "Geçersiz oturum veya dosya yolu."}
    errors, valid = [], True
    if not isinstance(content, (dict, list)):
        errors = ["İçerik bir JSON nesnesi veya dizisi olmalı."]
        valid = False
    else:
        errors = validation.validate(content, relpath, get_schema(relpath, content), ROOT)
        valid = not errors
    PREVIEW_STORE.setdefault(sid, {})[relpath] = {"content": content, "errors": errors, "valid": valid}
    return 200, {"ok": True, "valid": valid, "errors": errors}


def api_save_file(payload):
    relpath = payload.get("path", "")
    content = payload.get("content")
    message = payload.get("message", "")
    sid = payload.get("session", "")
    full = _write_target(relpath)
    if full is None:
        return 400, {"ok": False, "errors": ["Geçersiz dosya yolu (data/ altında .json olmalı)."]}
    if not isinstance(content, (dict, list)):
        return 400, {"ok": False, "errors": ["İçerik bir JSON nesnesi veya dizisi olmalı."]}
    errors = validation.validate(content, relpath, get_schema(relpath, content), ROOT)
    if errors:
        return 400, {"ok": False, "validated": False, "errors": errors}
    try:
        blob = json.dumps(content, ensure_ascii=False, indent=2) + "\n"
        with open(full, "w", encoding="utf-8") as f:
            f.write(blob)
    except OSError as e:
        return 500, {"ok": False, "errors": ["Dosya yazılamadı: %s" % e]}
    ok, note = gitops.commit(relpath, message)
    if sid and sid in PREVIEW_STORE:
        PREVIEW_STORE[sid][relpath] = {"content": content, "errors": [], "valid": True}
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

    def _send(self, code, body, ctype="application/json; charset=utf-8", extra=None):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or []):
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def _json(self, code, obj):
        self._send(code, json.dumps(obj, ensure_ascii=False))

    def _send_zip(self):
        import time as _time
        data = publish.zip_data()
        fname = "data-%s.zip" % _time.strftime("%Y%m%d_%H%M%S")
        self._send(200, data, "application/zip",
                   [("Content-Disposition", 'attachment; filename="%s"' % fname)])

    def _serve_static(self, url_path, extra=None):
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
            self._send(200, f.read(), ctype, extra)

    def _serve_manager(self, url_path):
        extra = None
        if not _cookie_value(self.headers, "preview_session"):
            extra = [("Set-Cookie", "preview_session=%s; Path=/; SameSite=Lax" % secrets.token_hex(16))]
        return self._serve_static(url_path, extra)

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
        if path == "/api/icons":
            return self._json(200, api_icons())
        if path == "/api/history":
            qs = urllib.parse.parse_qs(parsed.query)
            return self._json(200, api_history(qs.get("path", [""])[0]))
        if path == "/api/diff":
            qs = urllib.parse.parse_qs(parsed.query)
            return self._json(200, api_diff(qs.get("path", [""])[0]))
        if path == "/api/export":
            return self._send_zip()
        if path == "/api/publish/info":
            return self._json(200, api_publish_info())
        if path.startswith("/api/"):
            return self._json(404, {"ok": False, "error": "Bilinmeyen API."})
        if path in ("/manager", "/manager/"):
            return self._serve_manager("/manager/index.html")
        if path.startswith("/manager/"):
            return self._serve_manager(path)
        if path.startswith("/data/") and path.endswith(".json"):
            sid = _cookie_value(self.headers, "preview_session")
            entry = PREVIEW_STORE.get(sid, {}).get(path.lstrip("/"))
            if entry:
                body = json.dumps(entry["content"], ensure_ascii=False, indent=2) + "\n"
                return self._send(200, body, "application/json; charset=utf-8")
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
        if parsed.path == "/api/preview/set":
            return self._json(*api_preview_set(payload))
        if parsed.path == "/api/history/diff":
            return self._json(*api_history_diff(payload))
        if parsed.path == "/api/history/restore":
            return self._json(*api_history_restore(payload))
        if parsed.path == "/api/git/sync":
            return self._json(*api_git_sync())
        if parsed.path == "/api/publish":
            return self._json(*api_publish(payload))
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
