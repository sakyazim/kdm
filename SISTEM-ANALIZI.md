# Sistem Tutarlılık Analizi — JSON ↔ Site ↔ Manager (v2)

Tarih: 2026-08-14 · Durum: **sadece analiz — hiçbir değişiklik yapılmadı**
Kapsam: `data/` (48 JSON), `assets/js/` (site kodu), kök HTML'ler, manager v1/v2.

---

## 1. ÖZET TABLO

| # | Bulgu | Etki | Önerilen yön |
|---|-------|------|--------------|
| 1.1 | **11 veritabanı kategori filtresinden ulaşılamıyor** (Müzik ×3, Referans ×8) | Kategori butonu yok → bu db'ler yalnızca "Tümü"/arama ile bulunur | Tek kaynak kategori listesi + formda select |
| 1.2 | **`dergipark` çift kayıt** (databases.json #16 ve #66) | Sitede aynı db iki kart | Tek kayda birleştir |
| 1.3 | **HTML-in-JSON**: 2 aile (bilinçli zengin metin ~238 + sızıntı ~12) | Manager'da çıplak HTML görünüyor; stil/şablon veriye sızmış | Manager'a `richtext` alan tipi; sızıntıları yapılandır |
| 1.4 | **Ölü / yinelenen dosyalar** (announcements.json, news.json, erisebilirlik.js ikizi, component-showcase.old, kök HTML kalıntıları, _notes) | Gereksiz yük, kafa karışıklığı, latent kırık yol | Temizlik listesi (ayrı karar) |
| 1.5 | **İki dosyalı sayfalar** (veritabanlari, home, anadolu-*4, agreement'lı sayfalar) | Manager tek dosya düzenliyor → "sayfa nelerden oluşur" görünmez | Manager'a sayfa→dosya haritası |
| 1.6 | Erişilebilirlik sayfası **çalışıyor** (düzeltilmiş); typo ikizi ölü | — | sadece temizlik |
| 1.7 | Veritabanı veri kalitesi **temiz** (75/75 eksiksiz, logolar diskte, alanlar kullanılıyor) | — | — |

---

## 2. KATEGORİ SİSTEMİ (asıl soru: "kategoriler eşleşiyor mu?")

### Veri nerede duruyor
- **Filtre tanımı:** `data/pages/veritabanlari.json` → `content[0].components[0].data.categories`
  Yapı: `{ id, label:{tr,en}, icon }` — **`id` = Türkçe etiket metni** (örn. `"İnsani Bilimler"`).
  Listede: `all` (özel, "Tümü") + 9 gerçek kategori.
- **Db etiketleri:** `data/pages/databases.json` → her kaydın `categories[]`
  Yapı: `{ tr, en }` (ikinci ekrandaki gibi `id/label/icon` DEĞİL — db tarafı sadece metin).

### Eşleşme nasıl çalışıyor (site kodu, `veritabanlari.js`)
```js
// Filtre butonu: data-category="Genel"  (id = TR metin)
// Eşleştirme:  cat.tr === currentCategory   (SADECE Türkçe metin)
```
Yani **join anahtarı: filtre `id` == db `categories[].tr`** (Türkçe metin). `en` eşleşmede hiç kullanılmıyor.

### Sonuç: 2 kategori eşleşmiyor
| Kategori | db sayısı | Filtrede? |
|---|---|---|
| Müzik | 3 (medici-tv, naxos-music-library, oxford-music-online) | ❌ YOK |
| Referans | 8 (dergipark, e-osmanlica, intihal-net, kelime-kilavuzu, mendeley, mildata, turcademy, wikilala) | ❌ YOK |

Bu 11 db'nin kategorisi tıklanamıyor — yalnızca arama ya da "Tümü" ile bulunuyorlar. Filtrede tanımlı tüm kategoriler db'lerde kullanılıyor (tersi sorun yok).

### Kırılganlık (derin sorun)
- Kategorinin Türkçe adı **hem filtre `id`'si hem db etiketi** olduğu için yeniden adlandırma = 2 dosyada, N kayıtta elle güncelleme. Bir yerde yanlış yazım → sessizce filtresiz kategori (şu anki Müzik/Referans durumu böyle oluşmuş).
- `en` etiketleri ayrı ve doğrulanmıyor (db'de "General" ↔ filtrede "General" yazımı bozuksa görsel tutarsızlık ama sessiz).
- `dergipark` çift kaydı bunun kanıtı: #16 (Genel+Referans) filtresiz kalınca, muhtemelen #66 (Ücretsiz+Genel) eklenerek "Ücretsiz Veritabanları"nda görünmesi sağlanmış → şimdi sitede **iki DergiPark kartı** var.

### Önerilen yön (karar verilecek)
1. Kategori listesini **tek kaynak** yap (filtre listesi zaten o; belki ayrı `data/global/categories.json`'a taşı).
2. Db formunda kategorileri **select (çoklu, listeden)** + "Yeni kategori ekle" (eklerken filtre listesine de yazsın) yap.
3. Doğrulama: db'de filtrede olmayan kategori → kayıt öncesi uyarı.
4. `Müzik` ve `Referans`'ı filtreye eklemek ya da db etiketlerini değiştirmek — içerik kararı, sizin.

---

## 3. HTML-in-JSON (250 bulgu, 2 aile)

### Aile A — Bilinçli "zengin metin" alanları (~238)
Site bu alanları `innerHTML` ile basıyor; JSON'da HTML **olması gereken**:
`content`, `answer`, `steps[].content`, `steps[].description`, `items[].text`, `sections[].content`, `infoBoxes[].text`, `warnings[].text`, `notes`, `translations.*.resultsCount`…

Dosya bazlı dağılım:
```
44  arastirmaci-profili-olusturma.json
36  sss.json
30  kutuphane-kullanim-klavuzu.json
28  ill.json
22  sure-uzatma.json
20  kutuphane-kurallari.json
18  egitim-programlari.json + uzaktan-erisim.json
8   uyelik-odunc-islemleri.json
6   calisma-saatleri.json, component-showcase.old.json, iletisim.json
4   mendeley-referans-yonetim-araci.json
2   global/accessibility.json, veritabanlari.json
```
Manager etkisi: bu alanların **HTML olduğu bilinmeli** → yeni alan tipi `richtext` (mini araç çubuğu veya en azından HTML önizlemeli textarea). Şu an düz textarea'da çıplak etiketler görünüyor.

### Aile B — Sızıntı (yapılandırılmamış olması gerekenler) (~12)
| Yer | Sorun |
|---|---|
| `global/accessibility.json` `features[2].iconHtml`, `features[6].iconHtml` | İnline stil span'lar (`style="font-size:1.2em"`) — görünüm veriye sızmış; ayrıca `icon` alanı da var, ikisi çakışıyor |
| `calisma-saatleri.json` `content[0]...content.tr/en` | `style='color: var(--primary-color)'` — renk veriye sızmış (tema değişince kırılmaz ama veri içinde stil = kötü kokusu) |
| `sss.json` `items[].answer` (36 alan) | **Komple site bileşeni HTML'i** gömülü: `component-alert`, `component-table-container`, `component-icon-list`, `component-info-box` → şablon veriye gömülmüş; bileşen olarak modellenmemiş. Bileşen şeması değişirse 36 cevap da elle güncellenmeli |
| `veritabanlari.json` `translations.*.resultsCount` | Çeviri içinde `<strong>{count}</strong>` — küçük, kabul edilebilir |
| `egitim-programlari/iletisim/ill` `items[].text` | `<strong>Başlık</strong><br><a href=...>...` — yapılandırılmamış birleşik metin (başlık + değer + link tek string) |

Entity (`&nbsp;` vb.) bulgusu: **0** — temiz.

---

## 4. İKİ DOSYALI SAYFALAR (ayar + içerik ayrımı)

Kullanıcının tespiti doğru ve başka örnekleri var:

| Sayfa | Dosya(lar) |
|---|---|
| `veritabanlari.html` | `veritabanlari.json` (hero+filtre+ayarlar) **+** `databases.json` (içerik) ← örnek |
| `index.html` (ana sayfa) | `home.json` **+** `duyurular.json` (slider) **+** `guncel-haberler.json` (haberler) **+** `content/{collections,services,arrivals,modal}.json` |
| `anadolu-universitesi-arastirma-*` (4 sayfa) | tek `anadolu-arastirma.json` (section anahtarıyla: `arastirma_birimleri`, `arastirma_mevzuati`, `arastirma_duyurulari`, `arastirmalardan_haberler`) |
| `veritabanlari.html` + `uzaktan-erisim.html` | ayrıca `data-requires-agreement` → `agreements/{veritabanlari,uzaktan-erisim}-kullanim-sartlari.json` + `content/modal.json` |
| **her sayfa** | `global/{header,footer,settings,quickactions,accessibility}.json` |

Manager etkisi: sol barda "Sayfalar" altında her sayfanın **hangi dosyalardan oluştuğu** görünmeli; önizleme zaten tümünü gösteriyor (cookie override), ama "şu dosya şu bölümü kontrol ediyor" bağlantısı eksik. `databases.json` gibi bir "içerik" dosyası ayrıca `component-showcase.old` gibi sayfasız görünmemeli.

---

## 5. ÖLÜ / YİNELENEN DOSYALAR

| Dosya | Durum |
|---|---|
| `data/content/announcements.json` | Hiçbir kod yüklemiyor (sadece `config.js`'te adı var; ana sayfa duyuruları `duyurular.json`'dan alıyor) |
| `config.js` `news: 'news.json'` | Dosya yok; gerçek kaynak `guncel-haberler.json` (ölü config anahtarı) |
| `assets/js/pages/erisebilirlik.js` | Typo ikizi (`Erisebilirlik`); `assets/data/erisebilirlik.json` (mevcut değil) çekiyor; hiçbir sayfa referans vermiyor. `assets/data/` dizini boş duruyor |
| `data/pages/component-showcase.old.json` | Eski showcase; sayfası yok (manager'da "Önizleme Yok") |
| Kök HTML kalıntıları | `admin-panel.html`, `admin-mockup.html`, `admin-mockup-v2.html`, `admin-mockup-v3-final.html`, `admin-panel-test.html`, `json-editor.html`, `test-agreement-modal.html`, `off-kampus.html`, `demo-*.html` (5) — eski/geliştirme sayfaları |
| `_notes/` (dwsync.xml) | Dreamweaver senkron kalıntısı, birçok klasörde |

Not: `kurallar.html` ↔ `kutuphane-kurallari.json` isim farkı **sorun değil** — `data-page-name="kutuphane-kurallari"` ile eşleşiyor (tek sayfa).

---

## 6. VERİTABANI VERİ KALİTESİ (temiz ✓)

- 75 kaydın tamamında `title`, `logo`, `url`, `description`, `accessType` **eksiksiz**.
- 75 logonun tamamı diskte mevcut (kırık görsel yok).
- Kullanılan tüm alanlar site kodunda işleniyor (ölü alan yok). Seyrek doldurulmuş alanlar: `apcSupport` (15), `userGuide` (3), `videoTutorials` (3), `note` (2), `bookList`/`contentList`/`journalList` (1'er).
- `accessType`: 74 remote + 1 campus (sadece 1 db kampüs — içerik doğruluğu sizden teyit ister).

---

## 7. KARAR VERİLECEKLER (birlikte)

1. **Kategoriler:** (a) Müzik+Referans'ı filtreye ekleyelim mi, yoksa db etiketlerini mi değiştirelim? (b) Manager'da select + "yeni kategori ekle" modeline geçelim mi?
2. **dergipark çifti:** hangi kayıt kalsın (#16 Genel+Referans mı, #66 Ücretsiz+Genel mi), diğeri silinsin mi?
3. **HTML sızıntıları:** sss.json cevaplarındaki bileşen HTML'lerini yapılandırılmış bileşenlere çevirmek (büyük iş) vs olduğu gibi bırakıp manager'da `richtext` alan tipiyle yönetmek?
4. **Manager:** sayfa→dosya haritası, `richtext` alan tipi, kategori select'i — v2'ye mi, sıradaki sürüme mi?
5. **Temizlik:** Bölüm 5'teki ölü dosyaları silmek (v1 yedeğimiz var, güvenli) — hepsi mi, hangileri?
