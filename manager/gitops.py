# -*- coding: utf-8 -*-
"""Git işlemleri: repo güvencesi, commit ve durum bilgisi."""

import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _run(args):
    try:
        r = subprocess.run(
            args, cwd=ROOT, capture_output=True, text=True,
            timeout=30, encoding="utf-8", errors="replace",
        )
        return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()
    except FileNotFoundError:
        return -1, "", "git bulunamadı (git PATH'te olmalı)"
    except subprocess.TimeoutExpired:
        return -1, "", "git komutu zaman aşımına uğradı"


def is_repo():
    return os.path.isdir(os.path.join(ROOT, ".git"))


def ensure_ready():
    """Repo yoksa oluştur; kullanıcı ayarı yoksa yerel (lokal) değer ata."""
    if not is_repo():
        _run(["git", "init", "-b", "main"])
        _run(["git", "add", "-A"])
        _run(["git", "commit", "-m", "Başlangıç durumu (yönetim aracı tarafından oluşturuldu)"])
    code, out, _ = _run(["git", "config", "user.name"])
    if code != 0 or not out:
        _run(["git", "config", "user.name", "İçerik Yöneticisi"])
        _run(["git", "config", "user.email", "yonetici@local"])


def status():
    if not is_repo():
        return {"isRepo": False, "branch": "-", "lastCommit": "-", "dirty": False}
    code, out, _ = _run(["git", "status", "--porcelain=v1", "--branch"])
    branch = "-"
    dirty = False
    for line in out.splitlines():
        if line.startswith("## "):
            branch = line[3:].split("...")[0]
        elif line.strip():
            dirty = True
    _, last, _ = _run(["git", "log", "-1", "--format=%h %s"])
    return {
        "isRepo": True,
        "branch": branch,
        "lastCommit": last or "-",
        "dirty": dirty,
    }


def commit(path, message=None):
    rel = path.replace("\\", "/")
    msg = (message or "").strip() or ("İçerik güncellemesi: %s" % rel)
    _run(["git", "add", "--", rel])
    code, out, err = _run(["git", "commit", "-m", msg])
    if code == 0:
        return True, "Commit: " + (out.splitlines()[0] if out else "ok")
    combined = (out + " " + err).lower()
    if "nothing to commit" in combined:
        return True, "Değişiklik yok — commit gerekmedi"
    return False, err or out


def dirty_paths():
    """Değişmiş/eklenmiş dosyaların listesi (git status'tan)."""
    code, out, _ = _run(["git", "status", "--porcelain=v1"])
    paths = []
    for line in out.splitlines():
        if len(line) > 3:
            p = line[3:].strip().strip('"')
            if p and not p.endswith("/"):
                paths.append(p.replace("\\", "/"))
    return paths


def log_for_path(path, limit=80):
    rel = path.replace("\\", "/")
    code, out, _ = _run(["git", "log", "--format=%H|%h|%ad|%s", "--date=short", "-%d" % limit, "--", rel])
    items = []
    for line in out.splitlines():
        parts = line.split("|", 3)
        if len(parts) == 4:
            items.append({"hash": parts[0], "short": parts[1], "date": parts[2], "message": parts[3]})
    return items


def file_at_commit(path, commit):
    rel = path.replace("\\", "/")
    code, out, err = _run(["git", "show", "%s:%s" % (commit, rel)])
    return out if code == 0 else None


def diff(path, from_c, to_c):
    rel = path.replace("\\", "/")
    args = ["git", "diff", from_c]
    if to_c:
        args.append(to_c)
    args += ["--", rel]
    code, out, err = _run(args)
    return out if code == 0 else (err or out)


def remote_url():
    code, out, _ = _run(["git", "config", "remote.origin.url"])
    return out if code == 0 and out else ""


def sync(remote):
    """Uzak repodan çek + gönder. Git komutları görünür olmadan senkronizasyon."""
    if not remote:
        return False, "Uzak repo tanımlı değil (manager/config.json içine \"remote\" ekleyin)."
    logs = []
    c1, o1, e1 = _run(["git", "fetch", "origin"])
    logs.append(o1 or e1 or "fetch: ok")
    if c1 != 0:
        return False, "fetch hatası:\n" + (e1 or o1)
    c2, o2, e2 = _run(["git", "pull", "--ff-only", "origin", "main"])
    combined2 = (o2 + " " + e2).lower()
    if c2 != 0 and "up to date" not in combined2 and "already up" not in combined2:
        return False, "pull hatası:\n" + (e2 or o2)
    logs.append(o2 or e2 or "pull: ok")
    c3, o3, e3 = _run(["git", "push", "origin", "main"])
    combined3 = (o3 + " " + e3).lower()
    if c3 != 0 and "everything up-to-date" not in combined3:
        return False, "push hatası:\n" + (e3 or o3)
    logs.append(o3 or e3 or "push: ok")
    return True, "\n".join(l for l in logs if l.strip())
