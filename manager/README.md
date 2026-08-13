# Kütüphane İçerik Yönetim Aracı (`manager/`)

Sitenin JSON içeriklerini **tarayıcıdan düzenleyip git'e kaydetmeye** yarayan
lokal yönetim aracı. Site dosyalarına (HTML/JS/CSS) dokunmaz; yalnızca
`data/` altındaki JSON dosyalarını okur ve yazar.

## Çalıştırma

```bash
python manager/server.py
```

- Arayüz:  http://127.0.0.1:8123/manager/
- Önizleme: http://127.0.0.1:8123/  (sitenin kendisi)

Bağımlılık: Python 3.8+ (yalnızca standart kütüphane) + sistemde `git`.

## Nasıl çalışıyor

- **Dosya ağacı** solda; şeması olan dosyalar yeşil nokta ile gösterilir.
- **Şema tabanlı editör**: alanlar şemaya göre form olarak çizilir
  (TR/EN çiftleri, diziler, bileşen tipleri). Şeması olmayan dosyalar ham
  JSON editörüyle düzenlenir.
- **Doğrula**: JSON geçerliliği + şema uyumu + eksik çeviri + kırık bağlantı
  kontrolü. Hata varsa kayıt engellenir.
- **Kaydet ve Commit Et**: dosyayı diske yazar ve otomatik git commit'i atar.
  Her kayıt geçmişte kalır → her şey geri alınabilir.
- **Önizleme**: sağdaki iframe, kaydedilen değişikliği anında gösterir
  (site aynı sunucudan servis edildiği için gerçek önizlemedir).

## Yapı

```
manager/
├── server.py          # Lokal HTTP sunucu (site servis + API)
├── gitops.py          # Git işlemleri (repo güvencesi, commit, durum)
├── validation.py      # Doğrulama (şema, çeviri, bağlantılar)
├── schemas/           # Dosya başına şema tanımları (.json)
│   └── iletisim.json  # Örnek: İletişim sayfası şeması
└── ui/                # Tarayıcı arayüzü (HTML/CSS/JS)
```

## Şema formatı

Her şema, `data/` içindeki bir dosyayı hedefler ve `fields` listesi içerir.
Alan tipleri: `text`, `textarea`, `lang` (TR/EN), `object`, `array`,
`components` (tip kayıtlarıyla dinamik bileşenler), `raw` (ham JSON),
`number`, `boolean`, `color`, `date`, `select`, `icon`, `url`.

## Güvenlik

- Yazma yalnızca `data/` altındaki `.json` dosyalarına açıktır; yol
  dışına çıkış engellenir.
- Sunucu yalnızca `127.0.0.1` üzerinde dinler.
- **Bu araç uzak sunucuya yüklenmemelidir** — lokal yönetim içindir.

## Sıradaki adımlar (yol haritası)

1. Tüm dosyalar için şema tanımları (yapıldıkça yeşil nokta artacak).
2. Sürüm geçmişi görünümü: dosya bazında geçmiş + fark + geri alma.
3. 3 kullanıcı için merkez repo senkronizasyonu ("Senkronize Et").
4. SFTP ile "Yayımla" (yedekli yükleme + doğrulama + geri alma).
