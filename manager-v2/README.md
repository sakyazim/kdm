# Kütüphane İçerik Yönetim Aracı v2 (`manager-v2/`)

Sitenin JSON içeriklerini **tarayıcıdan düzenleyip git'e kaydetmeye** yarayan
lokal yönetim aracının **gelişmiş sürümü**. Site dosyalarına (HTML/JS/CSS)
dokunmaz; yalnızca `data/` altındaki JSON dosyalarını okur ve yazar.

> v1 (`manager/`) çalışır durumda yedeklenmiştir (git commit `bf521f3` + `v1` tag).
> v2 aynı altyapı üzerine modern arayüz ve yeni araçlar ekler.

## Çalıştırma

```bash
MANAGER_PORT=8124 python manager-v2/server.py
```

- Arayüz:  http://127.0.0.1:8124/manager/
- Önizleme: http://127.0.0.1:8124/  (sitenin kendisi)

Bağımlılık: Python 3.8+ (yalnızca standart kütüphane) + sistemde `git`.

## v2'de yeni olanlar

- **Komut paleti (Ctrl+K / ⌘):** dosya aç, alan ara, doğrula, kaydet,
  geçmiş, tema, önizleme, yayımla — hepsi tek kutudan. `field:` ile form
  alanında arama, `/` ile dosya arama, `>` ile yalnızca komutlar.
- **Klavye kısayolları:** Ctrl+S kaydet, Ctrl+F alan ara, Ctrl+B önizleme,
  Ctrl+Shift+D tema, Ctrl+E ham JSON görünümü.
- **Sekmeler:** birden çok dosya aynı anda açık; kirli (değiştirilmiş)
  sekmeler nokta ile işaretlenir.
- **Koyu / aydınlık tema:** tercih hatırlanır (sistem temasını da okur).
- **Inline doğrulama:** yazarken hata anında alanın altında gösterilir,
  üstte hata sayacı çıkar; hatalı veri kaydedilemez.
- **Kaydedilmemiş değişiklik özeti:** üst barda "değişiklik var" göstergesi
  ve `/api/diff` ile çalışma ağacı vs HEAD farkı.
- **Önizleme TR/EN anahtarı:** önizleme sayfası TR/EN arasında değiştirilir.
- **Gezinti:** "Sayfayı Aç ↗" / "Sitede Aç ↗" bağlantıları.

## Temel akış (v1 ile aynı)

- **Dosya ağacı** solda; şeması olan dosyalar yeşil nokta ile gösterilir
  (elle şema + otomatik şema çıkarımı, 48 dosyanın tamamı formda düzenlenir).
- **Şema tabanlı editör:** alanlar şemaya göre form olarak çizilir
  (TR/EN çiftleri, diziler, bileşen tipleri). "Ham JSON" geçişi her dosyada var.
- **Doğrula:** JSON geçerliliği + şema uyumu + eksik çeviri + kırık bağlantı
  kontrolü. Hata varsa kayıt engellenir.
- **Kaydet ve Commit Et:** dosyayı diske yazar ve otomatik git commit'i atar.
  Her kayıt geçmişte kalır → her şey geri alınabilir.
- **Önizleme:** sağdaki iframe, düzenlenen veriyi **kaydetmeden** gösterir
  (sunucu belleği + oturum çerezi ile; diske yazmaz, scroll korunur).

## Yapı

```
manager-v2/
├── server.py          # Lokal HTTP sunucu (site servis + API + diff)
├── gitops.py          # Git işlemleri (repo güvencesi, commit, durum, diff)
├── validation.py      # Doğrulama (şema, çeviri, bağlantılar)
├── publish.py         # ZIP dışa aktarma + SFTP yayımlama (yedekli)
├── config.json        # Uzak repo / SFTP bilgileri (elle doldurulur)
├── schemas/           # Dosya başına şema tanımları (.json)
│   ├── _components.json  # Ortak bileşen kayıt defteri
│   ├── header.json / footer.json / iletisim.json
└── ui/                # Tarayıcı arayüzü (HTML/CSS/JS)
```

## Şema formatı

Her şema, `data/` içindeki bir dosyayı hedefler ve `fields` listesi içerir.
Alan tipleri: `text`, `textarea`, `lang` (TR/EN), `object`, `array`,
`components` (tip kayıtlarıyla dinamik bileşenler), `raw` (ham JSON),
`number`, `boolean`, `color`, `date`, `select`, `icon`, `url`.
Şeması olmayan dosyalar için sunucu içerikten **otomatik şema çıkarır**.

## Güvenlik

- Yazma yalnızca `data/` altındaki `.json` dosyalarına açıktır; yol
  dışına çıkış engellenir.
- Sunucu yalnızca `127.0.0.1` üzerinde dinler.
- **Bu araç uzak sunucuya yüklenmemelidir** — lokal yönetim içindir.

## Sıradaki adımlar

Detaylı, öncelik sıralı plan: **[ROADMAP.md](ROADMAP.md)**
