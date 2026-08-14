# Sayfa Denetim İlerleme Takibi

Her sayfa iki aşamada denetlenir: **(1) Önyüz → JSON → render kodu** uyuşmazlık analizi, **(2) Bulguları düzeltme + canlı doğrulama**. Bu dosya ilerlemeyi ve anasayfadan çıkarılan dersleri tutar — yeni sayfaya geçerken **önce "İlk Bakışta Kontrol Listesi"ni** uygula, tekrar tekrar aynı hataları arama.

---

## İlerleme Durumu

| Sayfa (JSON) | HTML | Durum | Tarih | Notlar |
|---|---|---|---|---|
| home | index.html | ✅ Tamam | 2026-08-14 | 16 bulgu düzeltildi + SEO motoru + tüm dataSource linkleri |
| **SEO (global)** | tüm sayfalar | ✅ Tamam | 2026-08-14 | seo.js, JSON-LD, robots, sitemap, OG görseli, meta doldurma |
| duyurular | duyurular.html | ⏳ Bekliyor | — | |
| guncel-haberler | guncel-haberler.html | ⏳ Bekliyor | — | |
| veritabanlari | veritabanlari.html | ⏳ Bekliyor | — | |
| databases | (veritabanlari besler) | ⏳ Bekliyor | — | |
| iletisim | iletisim.html | ⏳ Bekliyor | — | |
| sss | sss.html | ⏳ Bekliyor | — | |
| ill | ill.html | ⏳ Bekliyor | — | |
| egitim-programlari | egitim-programlari.html | ⏳ Bekliyor | — | |
| kutuphane-kullanim-klavuzu | kutuphane-kullanim-klavuzu.html | ⏳ Bekliyor | — | |
| kurallar (kutuphane-kurallari) | kurallar.html | ⏳ Bekliyor | — | |
| sure-uzatma | sure-uzatma.html | ⏳ Bekliyor | — | 2 eksik ekran görüntüsü (raporlandı) |
| uzaktan-erisim | uzaktan-erisim.html | ⏳ Bekliyor | — | 10 eksik ekran görüntüsü (raporlandı) |
| uyelik-odunc | uyelik-odunc-islemleri.html | ⏳ Bekliyor | — | |
| mendeley | mendeley-referans-yonetim-araci.html | ⏳ Bekliyor | — | |
| makale-islem-ucretleri | makale-islem-ucretleri.html | ⏳ Bekliyor | — | |
| anadolu-arastirma | anadolu-universitesi-arastirma-birimleri.html | ⏳ Bekliyor | — | |
| calisma-saatleri | calisma-saatleri.html | ⏳ Bekliyor | — | |
| arastirmaci-profili | arastirmaci-profili-olusturma.html | ⏳ Bekliyor | — | |
| kutuphane-binalari | ? | ⏳ Bekliyor | — | |

**Global dosyalar:** header / footer / accessibility / quickactions / modal / services / arrivals / collections → ⏳ ayrıca denetlenecek

---

## İlk Bakışta Kontrol Listesi (her sayfada uygula)

Anasayfada çıkan sorunların tekrarını önlemek için her sayfaya geçerken şunlara bak:

### 1. Veri / içerik
- [ ] `---` öneki, kopya " - Copy" kalıntısı, `---` ile biten metin var mı? (grep: `---`)
- [ ] Türkçe yazım hataları (`Satleri`→`Saatleri`, `Klavuzu`→`Kılavuzu`)
- [ ] HTML/richtext sızıntısı: alanlar markdown'a dönüştürüldü; ham `<...>`/`style=` kalmış mı?
- [ ] Tarihler: geçmiş/uygunsuz tarih var mı? Liste tarihe göre sıralı mı?
- [ ] `actionType` + `url` çifti her kayıtta var mı? (Eksikse linkler ölü: modal açılır, sayfa değil)
- [ ] Görsel referansları diskte var mı? (`python` ile toplu tarama)
- [ ] `featured`/`active`/`enabled` bayrakları kodda gerçekten okunuyor mu?

### 2. Kod bağlantısı (ayar → davranış)
- [ ] JSON'daki ayar (maxItems, itemsPerPage, dataSource, sliderSettings) kodda **hardcoded** değil mi?
- [ ] `config.js`'de ölü dosya adı var mı? (`dataFiles` girişleri gerçek dosyayla eşleşiyor mu?)
- [ ] Aynı JSON 2 kez fetch ediliyor mu? (konsol loglarını izle)
- [ ] `enabled: false` yapınca section gerçekten gizleniyor mu? (home.js `applySectionVisibility` örneği)

### 3. Manager / şema
- [ ] Dosyanın elle şeması var mı? (`manager-v2/schemas/`) — yoksa otomatik şemaya düşer, etiketler İngilizce kalır
- [ ] `{tr,en}` içeren karma nesneler (`viewAllButton` gibi) yapılandırılmış alanlara açılıyor mu? (derinlik >2 olanlar `raw`'a düşebilir)
- [ ] `lastModified` alanı varsa kayıtta otomatik güncelleniyor mu? (Türkiye saati 24s)
- [ ] Bileşen tipleri şema kayıt defterinde tanımlı mı? (step-guide, collapsible-section, icon-list-grid, contact-buttons, note → **eksik, bilinen hata**)

### 4. Özel durumlar
- [ ] Dosya adı ≠ HTML adı mı? (`kutuphane-kurallari` → `kurallar.html`, `databases` → `veritabanlari.html`)
- [ ] Sayfa ComponentRenderer kullanıyor mu? Kullanmıyorsa zengin alanları `Utils.mdToHtml` ile sarmala
- [ ] Modal tarihleri gelecekte mi? (Geçmişse otomatik modal hiç görünmez)

---

## Anasayfa Dersleri (uygulanan düzeltmeler)

1. **`---` veriye sızmış** → slider başlığında görünüyordu. Kopya dosya kalıntıları veriye de girmiş; grep ile tara.
2. **`actionType` unutulunca linkler sessizce ölüyor** → veriye eksik 3 kayıt eklendi + renderer'lara güvenlik ağı: `actionType` yoksa gerçek `url` kullanılır.
3. **Aynı JSON 2 kez fetch** → `app.js` `showInSlider` filtresi hiç eşleşmiyordu (`featured` vardı); bozuk yükleyici kaldırıldı.
4. **home.json ayarları ölüydü** → `maxItems`, `dataSource`, `sliderSettings` (autoPlay, duration, showProgressBar, **pauseOnHover**), `itemsPerPage` koda bağlandı.
5. **`collections.enabled` hiç kontrol edilmiyordu** → koleksiyonlar home.js'te hardcoded. `applySectionVisibility()` eklendi; tüm section'lar artık `sections.*.enabled` ile gizlenir.
6. **Ölü veri** → `content/announcements.json` (3 kopya kayıt) silindi; `config.js`'teki ölü `news.json` girişi temizlendi.
7. **Eksik görseller** → modal görselleri placeholder ile dolduruldu; `modal-new-semester.jpg.jpg` çift uzantılı artık silindi.
8. **Sıralama** → duyurular + haber slider'ı tarihe göre yeniden eskiye sıralanıyor.
9. **Modal tarihleri geçmişti** → otomatik modal görünmüyordu; 2026 tarihleri atandı (demo).
10. **Klavuzu yazımı** → görünen metinler düzeltildi (dosya adı/URL değişmedi — link güvenliği).

---

## Manager İyileştirmeleri (v2)

- **Otomatik şema derinlik sınırı** `2 → 6` çıkarıldı → sığ ayar nesneleri (`viewAllButton` gibi) artık `raw` textarea'ya düşmüyor.
- **camelCase etiket bölme** → "StartDate" → "Start date" (tüm dinamik dosyalar).
- **home.json elle şeması** → Türkçe etiketler, ipuçları, yapılandırılmış `viewAllButton`.
- **`readonly` alan tipi** → `pageId`, `pageType`, `lastModified` kilitli/pasif gösterim.
- **`jsonfile` alan tipi** → `dataSource` kilitli link; tıklayınca o JSON editörde açılır, ✏️ ile kilit açılıp düzenlenebilir.
- **lastModified Türkiye saati (UTC+3), 24 saat** → `%Y-%m-%d %H:%M` formatı, kayıtta otomatik.
- **Şema otomatik yenileme** → `schemas/` altındaki dosyalar mtime ile izlenir; sunucuyu yeniden başlatmadan şema düzenlemesi yansır.
- **Tüm bölümlerde `dataSource` bağlandı** → koleksiyon/hizmetler/yeni gelenler de artık home.json `sections.*.dataSource`'undan yükleniyor (app.js `loadContentData`), config fallback korunur. Böylece manager'dan bu JSON'lara linkle erişim var.

---

## SEO Çalışması (✅ tamamlandı — 2026-08-14)

**Öncesi:** Yalnızca 2/36 JSON'da meta vardı ve o bile siteye uygulanmıyordu (ölü ayar). OG/Twitter/canonical/JSON-LD yoktu; hreflang tek URL'ye işaret ediyordu.

**Yapılanlar:**
1. **`assets/js/core/seo.js` (MetaManager)** — sayfa JSON `meta`'sını okuyup head'e yazar: title (+ site soneki), description, keywords, canonical, robots, Open Graph (title/description/url/image 1200×630/locale/locale:alternate/updated_time), Twitter Cards, geo (TR-26/Eskişehir), marka etiketleri (theme-color, apple-mobile-web-app), JSON-LD.
2. **JSON-LD üreticileri:**
   - Ana sayfa: **WebSite + SearchAction** (katalog araması, `meta.searchUrlTemplate`) + **Library** şeması (adres, geo, sameAs, **openingHoursSpecification**)
   - İç sayfalar: **BreadcrumbList** (JSON `hero.breadcrumb`'dan; yoksa meta.title fallback)
   - sss: **FAQPage** (accordion items → soru/cevap; tablo + icon-list blokları metne çevrilir; 18 soru)
3. **JSON meta şeması genişletildi** (home.json): keywords, ogImage, ogType, section, author, publishedTime, tags, searchUrlTemplate, logo, openingHours. Manager'da Türkçe etiketlerle yapılandırılmış form.
4. **34 sayfanın meta'sı dolduruldu** — HTML'deki mevcut statik title/description script ile JSON'a taşındı (EN boş — çeviri kararı bekliyor).
5. **Tüm sayfalara `lastModified` eklendi** → og:updated_time / article:modified_time otomatik.
6. **`robots.txt` + `sitemap.xml`** (33 gerçek sayfa, https://kdm.anadolu.edu.tr).
7. **OG görseli** `assets/images/og/library-og.png` (1200×630, saf Python PNG üreteci).
8. JSON-LD tekilleştirme (`data-seo`) — çift uygulamada çoğalmaz. Dil değişince sayfa yeniden yüklenir ve tüm meta TR/EN güncellenir.

**Bilinen karar:** EN meta çevirileri boş — site EN'de statik TR değerlere düşüyor. İstersen çeviri yapılır.

**Öğretici:** İç sayfa sınıfları JSON'ları `app.loadPageData` yerine **doğrudan fetch** ediyor — global kanca routePage'de `currentPage.pageData` üzerinden uygulanmalı (loadPageData'ya koymak yetmez).

---

## Bilinen Açık Sorunlar (henüz çözülmedi)

| # | Sorun | Yer | Etki |
|---|---|---|---|
| 1 | Şema kayıt defterinde eksik bileşen tipleri | `step-guide`, `collapsible-section`, `icon-list-grid`, `contact-buttons` | Manager doğrulaması "hata" gösterir (veri sorunu değil) |
| 2 | `note` alanı şemada tanımsız | databases.json | Doğrulama hatası (HEAD'de de vardı) |
| 3 | `steps` şemada dizi olarak tanımlı değil | arastirmaci-profili | 15 doğrulama hatası (HEAD'de de vardı) |
| 4 | 12 eksik ekran görüntüsü | sure-uzatma (2), uzaktan-erisim (10) | Kırık görsel; gerçek ekran görüntüsü gerekir |
| 5 | `kutuphane-kullanim-klavuzu` dosya adı typo | tüm site tutarlı | Görünen metin düzeldi; URL taşınmadı (SEO) |

---

## Sayfa Denetim İş Akışı

1. **Önyüz**: sayfayı canlı aç, konsol hatalarını ve eksikleri not et
2. **JSON**: veri yapısını oku; yukarıdaki kontrol listesini uygula
3. **Render kodu**: sayfanın JS'ini bul, JSON alanlarının her birinin kullanılıp kullanılmadığını eşleştir
4. **Manager**: şema var mı? yoksa elle şema yaz (Türkçe etiketlerle)
5. **Bulguları kullanıcıyla paylaş** → onaydan sonra düzelt
6. **Doğrula**: syntax + canlı önizleme + `enabled: false` davranışı
7. **Bu tabloyu güncelle** (durum, tarih, notlar)
