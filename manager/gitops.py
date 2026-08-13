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
