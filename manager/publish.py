# -*- coding: utf-8 -*-
"""Yayımlama: ZIP dışa aktarma + (opsiyonel) SFTP yükleme.

SFTP için 'paramiko' paketi gerekir (pip install paramiko). Kurulu değilse
yalnızca ZIP akışı kullanılabilir; mevcut FTP iş akışı korunur.
"""

import hashlib
import io
import os
import time
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")


def zip_data():
    """data/ içindeki tüm JSON dosyalarını tek bir ZIP olarak üretir."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        if os.path.isdir(DATA_DIR):
            for dirpath, _dirs, files in os.walk(DATA_DIR):
                for fn in sorted(files):
                    if fn.endswith(".json") and not fn.startswith("."):
                        full = os.path.join(dirpath, fn)
                        rel = os.path.relpath(full, ROOT).replace("\\", "/")
                        zf.write(full, rel)
    return buf.getvalue()


def sftp_configured(cfg):
    return bool((cfg.get("sftp") or {}).get("host"))


def sftp_publish(cfg, paths):
    """SFTP ile yedekli yükleme: sunucudaki eski dosyayı yedekle → yükle →
    geri indirip karşılaştır → uyuşmazsa sunucu yedeğine geri dön."""
    try:
        import paramiko  # opsiyonel bağımlılık
    except ImportError:
        return False, ["paramiko kurulu değil: pip install paramiko"]

    s = cfg["sftp"]
    remote_root = (s.get("remotePath") or "/").rstrip("/")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    kw = {
        "hostname": s["host"],
        "port": int(s.get("port") or 22),
        "username": s["user"],
        "timeout": 20,
    }
    if s.get("password"):
        kw["password"] = s["password"]
    elif s.get("key"):
        kw["key_filename"] = s["key"]
    else:
        return False, ["SFTP kimlik bilgisi eksik (password veya key)."]

    log = []
    try:
        ssh.connect(**kw)
        sftp = ssh.open_sftp()
        stamp = time.strftime("%Y%m%d_%H%M%S")
        for rel in paths:
            rel = rel.replace("\\", "/")
            local = os.path.join(ROOT, rel)
            if not os.path.isfile(local):
                log.append("atlandı (yok): %s" % rel)
                continue
            remote = remote_root + "/" + rel
            backup = remote + ".bak-" + stamp
            # 1) sunucudaki mevcut dosyayı yedekle
            try:
                sftp.stat(remote)
                sftp.rename(remote, backup)
                log.append("yedek: %s" % backup)
            except FileNotFoundError:
                pass
            except OSError as e:
                return False, log + ["sunucu dosyasına erişilemedi: %s (%s)" % (remote, e)]
            # 2) yükle
            sftp.put(local, remote)
            # 3) geri indir + karşılaştır
            buf = io.BytesIO()
            sftp.getfo(remote, buf)
            h1 = hashlib.sha256(open(local, "rb").read()).hexdigest()
            h2 = hashlib.sha256(buf.getvalue()).hexdigest()
            if h1 != h2:
                try:
                    sftp.rename(backup, remote)
                except OSError:
                    pass
                return False, log + ["doğrulama BAŞARISIZ: %s (sunucu yedeğine dönüldü)" % remote]
            log.append("yüklendi + doğrulandı: %s" % remote)
        sftp.close()
        ssh.close()
        return True, log
    except Exception as e:  # noqa: BLE001
        try:
            ssh.close()
        except Exception:  # noqa: BLE001
            pass
        return False, log + ["SFTP hatası: %s" % e]
