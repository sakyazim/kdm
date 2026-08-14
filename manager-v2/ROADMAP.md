# Yol Haritası — v2 (`manager-v2/`)

> v1 (`manager/`, commit `bf521f3` + `v1` tag) yedeklendi. v2, v1'in tüm
> özelliklerini koruyup modernize edilmiş arayüz ve yeni araçlarla devam eder.
> Bu belge kesintiye karşı çalışma notu olarak tutulur.

## Kalıcı kararlar (değişmez)

- **Siteye dokunulmaz** — HTML/JS/CSS ve JSON formatı aynen kalır; araç
  bağımsız bir katmandır (`data/` yazar, site aynı formatı okur).
- **Her kayıt = git commit** — kaydedilen her sürüm geçmişte kalır, geri alınır.
- **Local-only** — sunucu yalnızca 127.0.0.1'de dinler; uzak sunucuya yüklenmez.
- Eski panel `admin-v3/`'de arşivlidir (karşılaştırma/parça alma için).
- **Yayımlama yedekli** — önce sunucudaki eski dosya yedeklenir, sonra yeni
  yüklenir; yükleme sonrası karşılaştırmayla teyit edilir.

## v2 durumu (tamamlananlar)

| Bölüm | Durum |
|---|---|
| Komut paleti (Ctrl+K, `field:` alan arama, `/` dosya, `>` komut) | ✅ |
| Klavye kısayolları (Ctrl+S/B/F, Ctrl+Shift+D, Ctrl+E) | ✅ |
| Sekmeler (çoklu dosya, kirli nokta işareti) | ✅ |
| Koyu/aydınlık tema (sistem teması + tercih hatırlama) | ✅ |
| Inline doğrulama (alan altında hata, hata sayacı) | ✅ |
| Kaydedilmemiş değişiklik özeti + `/api/diff` | ✅ |
| Önizleme TR/EN anahtarı | ✅ |
| "Sayfayı Aç / Sitede Aç" bağlantıları | ✅ |
| v1 tüm özellikleri (şema editör, canlı önizleme, ikon galerisi,
  alan→önizleme senkronu, drag&drop, geçmiş, ZIP/SFTP yayımla) | ✅ |

## Sıradaki adımlar (öncelik sırasıyla)

1. **v2'yi gerçek kullanıma alma:** iletisim dışındaki dosyalar için elle
   şema yazımı (header/footer yazıldı; pages/ kalan dosyalar otomatik
   şemayla çalışıyor).
2. **3 kullanıcı senkronu:** ortak merkez repo kararı (GitHub özel repo mu
   kendi sunucu mu) → `config.json` içine `remote` girilince
   "Senkronize Et" aktifleşir.
3. **SFTP yayımlama:** `pip install paramiko` + `manager-v2/config.json`
   içine SFTP bilgileri → "Yayımla" gerçek yükleme moduna geçer
   (yedekle → yükle → doğrula → geri dön).
4. **Yayım öncesi diff ekranı:** yayımlanacak dosyaların değişiklik
   özetini gösteren onay ekranı.
5. **Önizlemede drag&drop sıralama:** site tarafı bileşen işaretleyicileri
   gerektirir (🔶 orta maliyet) — önce form içi sıralama yeterli.
6. **Paketleme:** PyInstaller ile çift tıklanabilir .exe (pywebview
   kabuğuyla masaüstü hissi).

## Açık kararlar

- Merkez repo: GitHub özel repo mu, kendi sunucunuzda mı?
- SFTP bilgileri (sunucu, kullanıcı, hedef dizin)
- Paketleme gerekli mi, yoksa `baslat.bat` yeterli mi?

## Kısayol

Kök dizindeki **`baslat.bat`** (v1 için): çift tıklayınca v1 sunucusunu
başlatır ve tarayıcıyı açar. v2 için benzer bir `baslat-v2.bat` oluşturulabilir:

```bat
@echo off
start "" http://127.0.0.1:8124/manager/
set MANAGER_PORT=8124
python manager-v2/server.py
```

Masaüstüne kısayol: `baslat.bat` → sağ tık → Kısayol oluştur → masaüstüne taşı.
