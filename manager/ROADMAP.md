# Yönetim Aracı — Yol Haritası (ROADMAP)

> Bu dosya, planlama kararlarımızın kalıcı kaydıdır. Kesinti olursa buradan
> devam ederiz. Güncellemeler bu dosyaya işlenir.
> ✅ = tamamlandı ve doğrulandı · ⬜ = sırada · 🔶 = dış karara bağlı

## 1. Genel kararlar (değişmez ilkeler)

- **Site dosyalarına dokunulmaz** (HTML/JS/CSS); JSON formatı aynen korunur.
- Yönetim aracı `manager/` bağımsız bir katmandır; istenirse kaldırılır, site
  eskisi gibi çalışır.
- **Her kayıt = git commit.** Geçmiş silinmez, her şey geri alınabilir
  ("son dosyayı sakla" isteğinin karşılığı).
- Araç **local-only** (`127.0.0.1`); uzak sunucuya yüklenmez.
- Eski admin paneli `admin-v3/`'de arşivlidir — kıyas ve parça alma için duruyor.
- Kullanıcılar: sahibi + 2 teknik arkadaş → 3 makineye aynı kurulum.

## 2. Sol bar düzeni (karar)

- Kategoriler **açılır/kapanır** (accordion); açık/kapalı durum hatırlanır.
- **Sayfalar ilk sırada ve varsayılan açık.** Diğer kategoriler (Genel Ayarlar,
  Ana Sayfa İçeriği, Anlaşmalar/Modal'lar) varsayılan kapalı.
- Kategori ayrımı korunur: header, footer, modal, quickactions gibi sayfa gövdesinde
  yer almayanlar ayrı bölümlerde durur, ancak **düzenleme deneyimi aynıdır**.
- **Yeni eleman ekleme** = ilgili dosyanın formundaki "+ Öğe Ekle" butonu.

## 3. Durum — Part'lar

### Part 1 — Kullanışlılık çekirdeği ✅
1. ✅ Sol panel: seçim sonrası otomatik daralma + üst barda ☰ butonu + tercih hatırlama;
   kategori accordion'ları (Sayfalar ilk/açık, diğerleri kapalı).
2. ✅ Önizleme toggle'ı üst barda — gizlenince her zaman geri açılabilir.
3. ✅ Form bölümleri akordeon: varsayılan kapalı, başlıkta öğe sayısı,
   "tümünü aç/kapat", mini içerik listesi (TOC) → tıklayınca bölüme kayar.

### Part 2 — Canlı önizleme ✅
4. ✅ Düzenlenen veri sunucu belleğine itilir (diske yazmaz); önizleme iframe'i
   o bellekten beslenir. Debounce ile yeniden yükleme + scroll koruması +
   "kaydedilmemiş" rozeti. Kaydet hâlâ diske yazar + commit atar.

### Part 3 — Senkron ve seçiciler ✅
5. ✅ Alan → önizleme senkronu: forma odaklanınca önizlemede o metin bulunur,
   kaydırılır ve vurgulanır (2 sn).
6. ✅ Görsel ikon seçici: projedeki FontAwesome (fas/far/fab) + Bootstrap Icons
   (bi-*) veriden taranır; arama + ızgara + serbest yazma alanı.

### Part 4 — Sürükle & bırak ✅ (kısmen)
7. ✅ Form içinde listeler sürüklenerek sıralanır (↑↓ butonları da duruyor).
8. 🔶 Önizlemede düzenleme modu (MVP): önizlemede bir öğeye tıklayınca formdaki
   ilgili alan bulunur ve vurgulanır. **Gerçek DOM sürüklemesi** site tarafında
   bileşen işaretleyicileri gerektirir — ileride, sitenin render katmanıyla
   birlikte değerlendirilir.

### Part 5 — Global şemalar ve esneklik ✅
9. ✅ Global şemalar: `header.json` + `footer.json` elle yazıldı; diğer tüm
   dosyalar **dinamik şema çıkarımı** ile formda düzenlenebilir (48/48 yeşil).
10. ✅ Ortak bileşen kayıt defteri (`schemas/_components.json`): bileşen tipleri
    tek yerde; sayfa şemaları `"registry": "components"` ile referans verir.
11. ✅ Dinamik şema: içerik yapısından otomatik alan çıkarımı (lang/object/array/
    components/raw). Mevcut veri asla bozulmaz (varsayılanlar yalnızca yeni
    öğelere eklenir). Her dosyada "Ham JSON" görünümüne geçiş butonu da var.

### Part 6 — Yayımlama ve ekip ✅ (SFTP harici test)
12. ✅ Sürüm geçmişi görünümü: dosya bazında commit listesi + fark + "Bu Sürüme Dön"
    (doğrulamadan geçerse yazar + yeni commit atar).
13. 🔶 3 kullanıcı senkronu: "Senkronize Et" hazır (fetch → pull --ff-only → push).
    **Uzak repo kararı gerekiyor** (GitHub özel repo vs kendi sunucu bare repo) —
    `manager/config.json` içine `"remote"` yazılınca çalışır.
14. 🔶 SFTP "Yayımla": ZIP indirme ✅ + SFTP yükleme hazır (yedekle → yükle →
    geri indirip karşılaştır → uyuşmazsa yedeğe dön). `pip install paramiko`
    gerekir; kimlik bilgileri `manager/config.json` içinde. **Gerçek sunucuyla
    test için SFTP bilgileri gerekiyor.**

## 4. Ek fikirler (beklemede)

- TR/EN önizleme anahtarı: önizleme çubuğuna dil butonu.
- "Ne değişti?" özeti: kaydetmeden önce git diff tabanlı değişen alanlar listesi.
- Form içinde alan arama (Ctrl+F tarzı).
- Çift yönlü senkron: önizlemede bileşene gelince form bölümünü vurgula (kısmen
  Part 4 madde 8'de var).

## 5. Açık kararlar

- **Merkez repo:** GitHub özel repo mu, kendi sunucumuzda bare repo mu?
- **Yayımlama:** SFTP bilgileri (host/port/kullanıcı/şifre veya key + uzak yol).
- **Kurulum:** 3 makineye Python kurulumu yeterli mi, çift tıklanabilir paket
  (PyInstaller / pywebview) gerekli mi? (Arayüz web tabanlı kalmaya devam eder.)

## 6. Nasıl çalıştırılır — Kısayol ile (tıklama)

Kök dizindeki **`baslat.bat`** dosyasına çift tıklayın:

- Sunucuyu arka planda başlatır ve tarayıcıyı arayüze açar:
  http://127.0.0.1:8123/manager/
- Kapatmak için: `baslat.bat`'in açtığı pencereyi kapatın (veya Ctrl+C).
- Sunucu zaten çalışıyorsa pencere kendiliğinden kapanır, tarayıcı mevcut
  sunucuya açılır — ikinci örneği engellemeye gerek yok.

### Masaüstüne kısayol koyma

1. `baslat.bat` üzerine sağ tıklayın → **Kısayol oluştur**.
2. Kısayolu masaüstüne taşıyın (isterseniz adını "Kütüphane İçerik Yönetimi" yapın).
3. Artık çift tıklayarak açabilirsiniz.

### Komut satırından (alternatif)

```bash
python manager/server.py
```

Bağımlılık: Python 3.8+ (sadece standart kütüphane) + git. SFTP için ayrıca
`pip install paramiko`.
