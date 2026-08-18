# Sayfa Denetim İlerleme Takibi

Her sayfa iki aşamada denetlenir: **(1) Önyüz → JSON → render kodu** uyuşmazlık analizi, **(2) Bulguları düzeltme + canlı doğrulama**. Bu dosya ilerlemeyi ve anasayfadan çıkarılan dersleri tutar — yeni sayfaya geçerken **önce "İlk Bakışta Kontrol Listesi"ni** uygula, tekrar tekrar aynı hataları arama.

---

## İlerleme Durumu

| Sayfa (JSON) | HTML | Durum | Tarih | Notlar |
|---|---|---|---|---|
| home | index.html | ✅ Tamam | 2026-08-14 | 16 bulgu düzeltildi + SEO motoru + tüm dataSource linkleri |
| **SEO (global)** | tüm sayfalar | ✅ Tamam | 2026-08-14 | seo.js, JSON-LD, robots, sitemap, OG görseli, meta doldurma |
| duyurular | duyurular.html | ✅ Tamam | 2026-08-15 | actionType tutarlılığı + çevirilebilir butonlar + elle şema + search-with-controls bileşeni |
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
| mendeley | mendeley-referans-yonetim-araci.html | ✅ Tamamlandı (2026-08-15) | — | |
| makale-islem-ucretleri | makale-islem-ucretleri.html | ✅ Tamamlandı (2026-08-15) | — | |
| anadolu-arastirma | anadolu-universitesi-arastirma-birimleri.html | ⏳ Bekliyor | — | |
| calisma-saatleri | calisma-saatleri.html | ⏳ Bekliyor | — | |
| arastirmaci-profili | arastirmaci-profili-olusturma.html | ✅ Tamamlandı (2026-08-15) | — | |
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
- [ ] Dosyanın elle şeması var mı? (`manager/schemas/`) — yoksa otomatik şemaya düşer, etiketler İngilizce kalır
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
- **Kök dizi şema desteği** → `root: "array"` şemaları (collections.json gibi) artık formda render ediliyor; validation da destekliyor.
- **`code` alan tipi** → büyük monospace textarea + **HTML etiket dengesi uyarısı** (kaydetmeden önce dengesiz kod görünür).
- **collections.json elle şeması** → yapılandırılmış alanlar (ad/ikon/etkin/adres/parametre/gizli alanlar) + `customCode` hazır widget yapıştırma alanı. **Bilgi:** Bu dosya servis sağlayıcı kodları taşır ve **yıllık değişebilir**; katalog (libra) sabittir → home.json `searchUrlTemplate` kilitlendi (🔒).
- **services.json elle şeması** → hizmet kartları yapılandırılmış: **İkon Galeri butonu** (auto-şema text olarak gösteriyordu, galeri yoktu), `id` **kilitli** (ekip bozmasın), url/active alanları. `services.title` alanı kullanılmıyor (başlık home.json'dan) — şemada not düşüldü.
- **home.json services.maxItems bağlandı** → loadServices artık config yerine JSON ayarını kullanıyor.
- **arrivals.maxItems bağlandı** → loadArrivals da artık home.json `sections.arrivals.maxItems`'ı kullanıyor (önceden `config.maxArrivals` sabiti kullanılıyordu, manager ayarı ölüydü). Grid masaüstünde 5 sütun — 5'ten fazlası ikinci satıra taşar (kırılmaz).
- **Ana kilit sistemi (dosya kilidi)** → `data/global/_locks.json` ile riskli dosyalar kilitlenir; **sunucu kaydı engeller** (kilitliyken 400), ağaçta 🔒 rozeti, editörde "Kilitle/Kilidi Aç" butonu (onaylı). Git ile ekip geneline yayılır. **collections.json şu an kilitli.**
- **Açılır-kapanır kartlar** → dizilerde 3+ öğe varsa kartlar **kapalı gelir**, başlığa tıklayınca açılır (▸ oku). collections.json (5 koleksiyon) artık karışık görünmüyor.
- **`showTitle` ayarı (koleksiyon/hizmetler)** → home.json `sections.*.showTitle` açılırsa bölüm başlığı ana sayfada görünür (altı çizili `section-title` stiliyle); varsayılan **gizli**. index.html'e `#collections-title` eklendi, services başlığı `section-title` sınıfı aldı.

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

**Bilinen karar:** EN meta çevirileri boş — site EN'de statik TR değerlere düşüyor. İstersen çeviri yapılır.**Öğretici:** İç sayfa sınıfları JSON'ları `app.loadPageData` yerine **doğrudan fetch** ediyor — global kanca routePage'de `currentPage.pageData` üzerinden uygulanmalı (loadPageData'ya koymak yetmez).

---

## Modal / Anlaşmalar Denetimi (✅ tamamlandı — 2026-08-14)

**modal.json elden geçirme:**
- **`activeModal` alanı kaldırıldı** (veri + kod + şema) — çift mekanizma karışıklık yaratıyordu. Tek mekanizma: `active: true` olan modal gösterilir.
- **`category` alanı kaldırıldı** — kod hiç kullanmıyordu (ölü alan). home.js'teki `modal-category-*` sınıf kodu da temizlendi.
- **`_comment` kısaltıldı** — artık tek cümlelik kullanım notu (eskiden iki mekanizmayı anlatıyordu).
- **`buttonUrl` düzeltildi** — `#new-semester-info` / `#maintenance-info` ölü linklerdi → `duyurular.html`. **Yeni davranış:** link boş veya `#` ise modal butonu gizlenir (tıklanmaz buton çıkmaz).

**Modal → Duyuru köprüsü (bağlantı + aktarma + arşivleme):**
- **Bağlantı:** modal'a `announcementId` alanı — aktarınca otomatik yazılır, şemada 🔒 kilitli gösterilir ("Bağlı Duyuru").
- **Aktarma:** manager'da her modal kartında **"📤 Duyuruya Aktar"** butonu → kategori seçimli onay diyaloğu → sunucu `/api/modal/transfer`. Alan eşlemesi: title→title, description→summary+content, image.tr→image, buttonUrl→url+actionType (http→external, .html→page, #→modal), date=bugün (TR), featured=false. Aktarınca modal **pasifleşir** (active:false, silinmez) ve bağlanır. Duyurular: `data/pages/duyurular.json`.
- **Arşivleme:** kart başlığına durum rozetleri — **⏰ Süresi doldu** (endDate geçmişse), **Aktif/Pasif** (boolean alandan). Dizilerde 3+ öğede kartlar kapalı gelir.
- **Kart durum rozetleri genel** — `endDate` + `active` alanı olan her dizi şemasında otomatik çalışır.

**Test edildi:** şema formu (4 kart, rozetler, aktarma butonu), UI üzerinden holiday-notice → duyuru #11 aktarımı (kategori Tatil/Kapanış, tarih bugün, actionType page), site ana sayfasında new-database modalının açılması + buton linki ✓. Test artefaktı temizlendi (veri 10 duyuruda, modallar bağsız).

---

## 🛡️ Mojibake Koruması (2026-08-15)

**Olay:** `data/content/modal.json`'daki tüm Türkçe karakterler bozulmuştu ("Kütüphane" → "KÃ¼tÃ¼phane") — bir betik dosyayı cp1252 olarak okuyup UTF-8 yazmıştı (çift kodlama). `cc94ce7` commit'inde geçmişe girmişti; dosya tersine çevirme (cp1252→UTF-8) ile düzeltildi.

**Koruma eklendi (3 katman):**

1. **validation.py → `check_mojibake`** — tüm metin değerlerini recursive tarar; `Ã¶ Ä± ÅŸ ÄŸ Ä° Ã§ â€™ Â°` vb. 40+ deseni yakalar ve **doğru karakteri önererek** hata üretir ("'Ã¶' yerine 'ö' olması gerekiyor… Dosya UTF-8 olarak kaydedilmeli.")
2. **Kayıt engellenir** — `api_save_file` bu hatayı alınca 400 döner, disk'e hiçbir şey yazılmaz; UI'da "Kaydedilemedi" banner + alan işareti görünür
3. **Aktarım da korunur** — `api_modal_transfer` kaynak dosyayı önce doğrular, bozuksa aktarımı reddeder

**Doğrulama:** temiz modal.json → 0 hata ✓; bozuk metinle Doğrula → 1 hata (alan adresi + snippet ile) ✓; bozuk içerikle kayıt → 400 engellendi ✓; UI'da banner + alan vurgusu ✓; transfer testi sonrası artefakt temizlendi ✓.

**Ders:** dosyalar elle/araçla düzenlenirken **UTF-8 olarak kaydedilmeli** (Windows'ta Notepad varsayılanı cp1252 olabiliyor). Manager artık bozuk kaydı geçirmez.

---

## 🧩 Modal İd + Tek Aktif + Tarih Otomasyonu (2026-08-15)

**Sorun:** yeni modal eklenince `id` boş kalıyordu (UI üretmiyor, alan kilitli → kullanıcı dolduramıyordu); aktarma ve `showOnce` bu id'ye bağlı olduğu için riskliydi.

**Yapılanlar:**

1. **Otomatik id** — şemada `"auto": true` işaretli id alanına yeni öğe eklenince `autoId()` üretir: `modal-20260815-1030` (başlıktan temizlenmiş slug + zaman damgası). İdsiz modal oluşturma imkânsızlaştı.
2. **Tek aktif (exclusive)** — şemada `"exclusive": true` olan boolean alanlar (modallarda `active`) tek seçimli çalışır: biri açılınca dizideki diğerleri **otomatik kapanır**. (genel özellik — `renderExclusiveField`)
3. **Tarih otomasyonu** — `findActiveModal` artık önce "aktif + şu an tarih aralığında" olanı bulur; yoksa **tarih aralığında olan bir sonraki planlı modalı** otomatik devreye sokar. → "yarın biten modal → planlanan modal" geçişi elle aktif değiştirmeden çalışır (test: A bitince B geldi ✓)
4. Mevcut idsiz test modalına `erwe-test` id'si atandı.

**Önemli davranış notu:** modal gösterimi **sayfa yüklemesinde** yapılır — sayfa açıkken tarih geçse bile açık modal refresh'e kadar kalır (normal tarayıcı davranışı). İstenirse zamanlayıcı eklenebilir.

**Bonus (2026-08-15):** kart rozetleri artık **kaydetmeden canlı** güncellenir — exclusive bir alan (örn. "Aktif") değiştirilince kart başlığındaki Aktif/Pasif/⏰ rozetleri anında yenilenir (`renderExclusiveField` → `refreshBadges`). **V1 hatası:** yalnızca tıklanan kartın rozeti güncelleniyordu → eski aktif kart "Aktif" görünmeye devam ediyordu (2 aktif görünümü). **Düzeltildi:** exclusive değişince artık **tüm kartların** rozeti yenilenir (test: Bayram'a tıklayınca 1 aktif rozet kaldı, diğer 4 Pasif oldu ✓)

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

---

## 📢 Duyurular Denetimi (2026-08-15)

**Durum:** ✅ Tamam — önyüz + JSON + manager + şema uyumu doğrulandı.

### Bulunan ve düzeltilen sorunlar

1. **KRİTİK: actionType tutarsızlığı** — anasayfa slider'ı `actionType: page` duyuruda sayfaya gidiyordu, duyurular sayfası ise HER ZAMAN modal açıyordu (url/actionType görmezden geliniyordu). → `duyurular.js`'e `getActionUrl()` eklendi (anasayfa announcements.js ile aynı mantık): page/external → linke gider, modal/boş → modal açar.
2. **url '#' olan 5 duyuruya (#1,4,5,7,8) `actionType: 'modal'` eklendi** — davranış netleşti (gizli fallback yerine açık niyet).
3. **Buton metinleri sabitti** — "Detayları Gör"/"Kapat"/"Sayfaya Git" TR'ye kilitliydi. → `Utils.getLocalizedText({tr,en})` ile çevirilebilir yapıldı (EN testi: "View Details" ✓).
4. **Manager'da "Data (code)" alanları** — kök neden: `search-with-controls` bileşeni şema kayıt defterinde yoktu → otomatik şema data'yı ham JSON textarea'ya düşürüyordu. → `_components.json`'a eksiksiz şema eklendi (Arama İkonu, Yer Tutucu, Sıralama, Görünüm, Kategoriler, Sonuç Yok) — 0 raw alan kaldı.
5. **Elle şema yazıldı** (`manager/schemas/duyurular.json`) — otomatik şemanın İngilizce etiketleri yerine Türkçe, kilitli id, select'ler (kategori, actionType, stil), tarih/renk alanları.
6. **`modalId` int'ten string'e** (#3) — şema metin bekliyordu; veri tutarlı hale getirildi.

### MD kural taraması (hepsi temiz)
- `---` kalıntısı: 0 · HTML sızıntısı: 0 · actionType'siz kayıt: 0 · kırık görsel: 0
- Kategoriler arama filtresiyle birebir eşleşiyor ✓ · helpSection dolu ✓ · konsol temiz ✓

### Ders (diğer sayfalara taşı)
- **`<component>` tipi şema defterinde yoksa manager'da "code" görünür** — önce `_components.json`'a bak, bileşen şemasını ekle.
- **Anasayfa bileşeni ile iç sayfa aynı veriyi farklı render edebilir** — actionType/url davranışını her renderer'da aynı fonksiyonla (getActionUrl) çöz.
- Sıradaki: guncel-haberler (aynı arama bileşeni + haber kartları), veritabanlari.

### Aktarım uçtan uca testi (2026-08-15) — ✅ geçti
- **Sayfa tipi:** `buttonUrl: uzaktan-erisim.html` → aktarım `actionType: page` → duyuruda kart tıklayınca sayfaya gitti, modal açılmadı ✓
- **Popup tipi:** `buttonUrl: '#'` → `actionType: modal` → duyuruda popup açıldı, içerik modal ile birebir eşleşti (başlık/icerik/görsel/kategori) ✓
- **Hata yakalandı:** aktarım `announcementId`'yi sayı yazıyordu, şema `text` bekliyordu → aktarım reddedilirdi. Şema `number` yapıldı + boş `""` değerler temizlendi.
- **Temizlik:** test modal/duyuru/görsel silindi; new-database tekrar aktif; her iki dosya 0 doğrulama hatası.

## 🆘 helpSection Standardı (2026-08-15)

**Karar:** helpSection butonları iletişim standardına bağlandı — 3 temel buton (📞 tel, ✉️ mailto, 🏠 ana sayfa), içeriğe göre özel butonlar serbest. **HTML'e asla veri yazılmaz** — tüm içerik JSON'dan render edilir (`#help-container` boş kap).

### Yapılanlar
1. **Kod (`helpsection.js`)**: buton linki artık `link || url || action` okur (eski `action` verisi de çalışır) + `variant` → Bootstrap sınıfına map (primary/secondary/outline) + **modal buton altyapısı**: `type: "modal"` + `modal: {title, body}` olan buton tıklayınca help-modal açar (değerlendirme/sorun bildir gibi ileride kullanılacak). Test: "Sorun Bildir" butonu → modal açıldı ✓ (sonra kaldırıldı).
2. **Veri**: duyurular + guncel-haberler `action` → `link` standardına çevrildi (ölü butonlar canlandı ✓). Tüm butonlar standartta (0 istisna).
3. **Eksik 9 sayfaya helpSection eklendi** (yalnızca JSON): anadolu-arastirma ×4, ill, koleksiyon-kat-plani, kutuphane-kullanim-klavuzu, sss, uyelik-odunc-islemleri — HTML'e dokunulmadı.
4. **İki mekanizma birleşti**: sss/egitim-programlari/ill.js sadece eski `pageData.help` okuyordu → `helpSection || help` fallback'ine çevrildi (inner.js'te zaten vardı). Artık tüm sayfalar `helpSection` öncelikli.
5. **CSS**: help-modal stilleri global inner-pages.css'e eklendi (koyu tema uyumlu).
6. **Şema**: duyurular şeması buton alanları `link/type/modal` olarak güncellendi.

**Ders:** aynı özellik için iki alan adı (help vs helpSection, link vs action) tutarsızlık üretir — standart tek alan, kod fallback'li olmalı.

## 🧩 Genel Modal Kütüphanesi (yeni)

**Dosya:** `data/global/modals.json` — sayfalardan bağımsız modal havuzu.

**Yapı:**
```json
{ "id": "sorun-bildir", "category": "help", "label": {"tr": "Sorun Bildir", "en": "Report an Issue"}, "html": {"tr": "<form>...", "en": "<form>..."} }
```
- Kategoriler: `help / anasayfa / duyurular / genel` (istediğimiz gibi genişletilebilir)
- HTML **tek yerde** — sayfa JSON'larına HTML asla girmez (hardcoded yasağına uyar)
- Aynı modal birden çok sayfada kullanılır: `"type": "modal", "modalId": "sorun-bildir"`

**Kullanım:** HelpSection butonu → `type: "modal"` + `modalId: "<kütüphane-id>"`. Manager'da duyurular şemasındaki "Modal (Kütüphane)" alanı select'tir — kütüphaneden kategori+ad listeler (manuel id yazma yok).

**Manager:** `data/global/modals.json` → "Genel Modallar" formu. Her HTML alanının yanında **👁 Önizle** butonu var — HTML'i iframe'de gerçek render edip gösterir (kaydetmeden). Etiket/HTML alanları TR+EN.

**Site tarafı:** `helpsection.js` → butona tıklayınca `loadLibraryModal(id)` ile `data/global/modals.json`'dan HTML'i yükler (dile göre TR/EN), modal açar. Kütüphane yoksa/bozuksa fallback: butonun kendi `modal` gövdesi.

**Test (canlı doğrulandı):** iletisim.html → "Sorun Bildir" butonu → modal açıldı ✓ (TR: "Adınız Soyadınız", EN: "First Last" — dil değişimi birebir çalışıyor). Form alanları: ad, e-posta, konu select, mesaj, geri dönüş checkbox'ı, gönder butonu.

**API:** `GET /api/modals` — manager'daki modalref select'leri ve referans doğrulama için özet listesi. (DİKKAT: GET handler'a eklenmişti ama POST'a eklenmemişti — 404 veriyordu, düzeltildi.)

## 🧩 Modal Üretici (Wix/Elementor tarzı) — genişletilmiş

**Manager'da "Genel Modallar" → Modal Üretici görünümü:**
- **Geniş düzen:** HTML editörü solda (TR/EN), **canlı önizleme sağda** (iframe DEĞİL div — iframe bu ortamda ana thread'i kilitliyordu, div'e çevrildi)
- **Şablonlar (gerçek site modallarından):** 🏠 Anasayfa, 📢 Duyuru/Sistem, 🗄️ Veritabanı, 🔑 Uzaktan Erişim — seçince TR+EN HTML'i doldurur (onay sorar)
- **Blok paleti:** +Başlık, +Paragraf, +Görsel Bandı, +Buton, +Uyarı Kutusu, +Özellik Satırı, +Adım Listesi, +Form Alanı, +Ayırıcı — imlecin olduğu yere ekler (TR ve EN ayrı)
- **Onay diyaloğu:** native `confirm()` yerine özel non-blocking diyalog (native confirm önizleme ortamında ana thread'i bloke ediyordu)

**Önemli teknik notlar (tekrarlanmasın):**
1. **iframe (srcdoc) bu preview ortamında ANA THREAD'İ KİLİTLİYOR** — tek basit iframe bile. Önizleme hep div + innerHTML ile yapılmalı
2. **native confirm() de kilitliyor** — custom confirmDialog kullan
3. **renderModalBuilder re-render'ı formArea'yı temizlemeli** (yoksa eski builder DOM'da kalır, çakışır)
4. Şablon HTML'inde relative `<img>` kullanma (manager URL'ine göre çözülür) — banner div kullan

## 🧩 Modal Üretici v2 — GERÇEK görsel düzenleyici (sürükle-bırak)

**Kullanıcı isteği:** "Wix/Elementor tarzı olmalı" — önceki textarea'lı sürüm yetmedi, sıfırdan blok tabanlı görsel düzenleyici yazıldı.

**Nasıl çalışıyor:**
- **Palet (13 parça):** Başlık, Paragraf, Not (HTML), Görsel Bandı, Uyarı Kutusu, Özellikler, Liste, Adımlar, Buton, Form, Değerlendirme, Ayırıcı, Ham HTML — sürükleyip tuvalin içine bırakılır
- **Tuval:** bloklar gerçek görünümle çizilir (site CSS sınıfları), tıklayınca seçilir, sürükleyerek sıralanır
- **Denetçi (sağda):** seçili bloğun alanları — metin, ikon, link, liste öğeleri, form alanları (tür/etiket/zorunlu/seçenekler) — canlı günceller
- **TR/EN sekmesi:** her dilin blokları ayrı
- **Görsel ↔ HTML geçişi:** HTML elle düzenlenirse görsele dönünce otomatik tekrar parse edilir (htmlToBlocks)
- **Şablonlar:** artık blok listesi olarak tanımlı (4 şablon), seçince TR+EN blokları doldurur
- **HTML üretimi:** bloklar → `m.html.tr/en` otomatik (site tarafı değişmedi, hâlâ html string okur)
- **Mevcut modallar:** açılınca `htmlToBlocks` ile otomatik bloklara çevrilir (feature-grid, alert, list, lead, note, hero, form, star-rating, steps, button, divider tanınıyor; bilinmeyen → Ham HTML bloğu)

**Yeni: önizleme paneli gizleme** — Modal Üretici açıkken sağdaki site önizlemesi otomatik gizlenir (`.builder-open`), düzenleyici tam genişlik kullanır.

**Site CSS:** `modal-tpl-*` sınıfları `inner-pages.css`'e eklendi — şablon blokları sitede de düzgün görünür.

**Test (canlı):** paletten sürükle-bırak (Ayırıcı eklendi ✓), blok seç → denetçi ✓, canlı düzenleme (başlık değişti, HTML + blok görseli anlık güncellendi ✓), şablon uygulama ✓, HTML modu geçişi ✓, 5 mevcut modalın tümü doğru parse edildi ✓.

## 🧩 Modal Üretici v3 — akordeon + otomatik önizleme gizleme + modal önizleme

**1. Akordeon kartlar:** Her modal ayrı kart, sadece biri açık (varsayılan: ilki). Başlık satırında ▾/▸ ile açılır/kapanır — tümü açık karışıklığı bitti.

**2. Önizleme gizleme düzeltildi:** "Önizleme: Gizle" butonunun yaptığı iş artık **sadece modals.json açıkken otomatik** yapılıyor (`preview-hidden` sınıfı + `builderPreviewForced` bayrağı). Başka dosyaya geçince kullanıcının önceki tercihi korunur (manuel gizlemişse gizli kalır).

**3. Modal önizleme:** Her kartın başlığında **👁 butonu** — modalı sitedeki gibi popup olarak gösterir (koyu arkaplan + beyaz kart + içerik, TR/EN aktif dile göre, başlıkta modal adı). Esc / ✕ / dışarı tıklama ile kapanır.

## 🧪 Tüm Elemanlar Demo Modalı — uçtan uca test

`tum-elemanlar-demo` modalı oluşturuldu (13 blok × TR/EN): title, banner, lead, alert, features, list, steps, divider, form (text/email/select/textarea/checkbox), rating, button, note, raw.

**Doğrulananlar:**
- Python ile yazılan html == JS `blocksToHtml` çıktısı (round-trip birebir) ✓
- Görsel düzenleyicide 13 blok doğru çizildi ✓
- **Sitede** (iletisim → "Tüm Elemanlar Demo" butonu → modal): 10/10 eleman render edildi ✓ (TR + EN)
- Ekran görüntüsü: başlık, band, uyarı, 3 özellik kartı, liste, 3 adımlı rehber, form alanları — hepsi sitenin gerçek stilinde

**Tespit edilen küçük tutarsızlıklar (bilinçli basitleştirmeler):**
1. Form alanları düz (tek sütun) — orijinal sorun-bildir'deki `form-row` 2 sütunlu düzen desteklenmiyor (bilinçli)
2. `note` bloğu html'i `<p class="modal-note">` içine sarar — içine blok eleman konursa geçersiz nesting olur (inline içerik için)
3. `rating` bloğu form dışında bağımsız form-group üretir (form içine konulabilse de)
4. Modal popup başlığı, içeriğin kendi başlığından değil **buton metninden** gelir (help section tasarımı — kafa karıştırıcıysa modal kütüphanesinden label alınabilir)

**Durum:** demo modal diskte (6. modal) + iletisim'de "Tüm Elemanlar Demo" butonu — istenirse silinir.

## 🔧 Dört düzeltme uygulandı (kullanıcı onayıyla)

1. **Popup başlığı:** Zaten kütüphane label'ından geliyormuş (buton metni yalnızca fallback) — MD notu düzeltildi, kod değişmedi.
2. **Form 2 sütun (form-row):** Form bloğundaki her alana (ilk hariç) "Yan yana" kutusu eklendi → iki alan `.form-row` içinde yan yana render edilir. htmlToBlocks form-row'u geri parse eder (2. alan `sameRow: true`). Site CSS'te `.form-row` zaten vardı; manager önizlemesine eklendi. Test: sorun-bildir'deki Ad/E-posta satırı 245px+245px doğrulandı ✓
3. **Demo temizlendi:** `tum-elemanlar-demo` modalı silindi (6→5), iletisim'deki test butonu kaldırıldı ("Sorun Bildir" kaldı).
4. **Note bloğu güvenli:** `<p class="modal-note">` yerine `<div class="modal-note">` — blok eleman nesting sorunu çözüldü. htmlToBlocks hem p hem div kabul eder.

## 🔧 Modal Üretici v2 — kapsamlı yenileme (kullanıcı geri bildirimleri)

**Yapılanlar (hepsi canlı test edildi ✓):**
1. **Kartlar ayırt edici:** Kategori rengi kartın sol kenarında 4px şerit + başlıkta renkli kategori çipi (ANASAYFA/DUYURULAR/HELP).
2. **Denetçi genişletildi:** Sağ düzenleme paneli 300px → 380px (1500px altında 340px).
3. **Özellikler çoklu düzenleme:** 3 özellik kartının hepsi TR/EN sütunlarda aynı anda düzenlenebiliyor (önceden sadece 1 gösteriliyordu).
4. **İkon galerisi:** Her ikon alanında "Galeri" butonu → 327 ikon (FA + Bootstrap) aranabilir seçici. `bi bi-book` gibi sınıf otomatik normalleştirilir.
5. **Resim galerisi:** "Görsel (Resim)" bloğu eklendi + `Galeri` butonu → `/api/images` (sunucuya yeni endpoint) → assets/images'teki 102 görsel küçük resimli ızgarada seçilir.
6. **TR/EN birlikte düzenleme:** Tüm metin alanları TR ve EN yan yana (üstte dil etiketi) — birini yazınca diğeri bağımsız kalır, ikisi de canlı güncellenir.
7. **Zengin metin:** B / I / U / 🔗 bağlantı / ⌫ etiket temizle araç çubuğu — seçili metni sarmalar.
8. **Uyarı kutusu varyantları:** ⚠ Uyarı (turuncu) / ✕ Tehlike (kırmızı) / ✓ Başarı (yeşil) / ℹ Bilgi (mavi) — canlı önizlemede + sitede renkli render.
9. **Ayırıcı varyantları:** Kesik (---) / Düz (───) / Noktalı (···).
10. **Form gönder butonu:** "Gönder Butonu Metni" TR/EN + `action` (PHP/backend adresi) + `method` (POST/GET) + her alana `name` (backend) alanı. action girilince form gerçekten gönderir, boşsa `onsubmit="return false;"`.
11. **Yıldız değerlendirme çalışıyor:** Sitede helpsection.js'e `initStarRating` eklendi — modal açılınca yıldızlar tıklanabilir, seçim `.active` + gizli `input[name=rating]`'e yazılır (backend'e taşınabilir). Test: 4. yıldız → 4 aktif + value=4 ✓.

**Yol boyunca yakalanan hatalar:**
- `langText/langSingle` kapsam dışı `onDataAll` çağırıyordu (ReferenceError) → parametre + `globalOnDataAll` fallback eklendi; fallback açık karta scope'lanır (gizli kartların seçili bloğunu bozmaz).
- `openImageGallery` DOM elementini `openModal`'a geçiriyordu (innerHTML → "[object Object]") → string kabuk + appendChild yöntemine çevrildi (ikon galerisiyle aynı).
- `globalOnDataAll` gizli karttaki seçili bloğu güncelliyordu → `.mb-card-body:not(.collapsed)` içine scope'landı.

**Test sonuçları:** uyarı danger/success canlı tuval ✓ · ayırıcı solid/dotted ✓ · form action → HTML `action=` ✓ · gönder metni canlı ✓ · ikon galerisi commit ✓ · resim galerisi commit ✓ · TR değişince EN korunuyor ✓ · disk verisi temiz (5 modal) ✓

**Bilgi:** Değerlendirme modalı yıldızları artık sitede tıklanabilir. Yıldız etkileşimi site tarafında `helpsection.js`'te (modal açılınca bağlanır).

## 🧩 Modal Üretici — tüm blok elemanları geliştirildi (kısaca her bloğa yeni yetenek)

| Blok | Yeni özellikler |
|---|---|
| Başlık | Boyut (H2/H3/H4) + hizalama (sol/orta/sağ) |
| Paragraf | Hizalama (sol/orta/sağ) |
| Görsel (Resim) | Genişlik kaydırıcısı (%25–100) — canlı önizleme |
| Banner | 5 renk varyantı (lacivert/mavi/yeşil/turuncu/kırmızı) |
| Uyarı Kutusu | "Kapatılabilir (✕)" seçeneği — sitede tıklayınca uyarı kapanır |
| Özellikler | Sütun sayısı (2/3/4) |
| Liste | Numaralı liste (1. 2. 3. — CSS counter) |
| Buton | İkon (galeri) + boyut (küçük/normal/büyük) + yeni sekmede aç |
| Form | Yeni alan tipleri: Telefon (tel), Web adresi (url), Tarih (date) + Gönder butonu görünümü (dolu/çerçeve) |
| Değerlendirme | Yıldız sayısı (5 veya 10) — sitede tıklanabilir |
| Ayırıcı | Renk (gri/mavi/turuncu/kırmızı) |
| Ham HTML / Not | Korumasız kalan HTML artık **raw** blok olarak geri dönüyor (gap/tail doldurma) |

**Round-trip garantisi:** Tüm bloklar HTML → blok → HTML → blok döngüsünde birebir korunuyor (13/13 blok test edildi, `eslesme: true`). Mevcut 5 modal bozulmadan parse ediliyor; "Yan yana" form çifti mantığı düzeltildi (2. alan işaretlenince 1. alanla aynı satıra girer).

**Yakalanan hatalar (düzeltildi):**
- Banner çift parse (hero + tpl-banner aynı anda eşleşiyordu) → hero sarmalayıcılı tek regex
- "Yan yana" alan tek başına form-row'a düşüyordu → önceki alanla eşleşecek şekilde yeniden yazıldı
- Yıldız (rating) bloğu form içindeki alanla çakışıyordu → label `[^<]*` + bitişik star-rating kuralı
- Sondaki/kalan HTML kayboluyordu → gap/tail doldurma: tanınmayan HTML `raw` bloğu olarak korunur

## 📐 Düzenleyici 50/50 + Anasayfa aktif modalı aktarıldı

**1. Sağ panel büyütüldü:** Düzenleyici iki eşit sütuna bölündü (`minmax(0,1fr) minmax(340px,1fr)`) — tuval solda, denetçi sağda. 1500px altında `minmax(320px,1fr)`, 1200px altında tek sütun (dar ekranlar).

**2. Anasayfa aktif modalı birebir aktarıldı:** `data/content/modal.json`'daki aktif `new-database` modalı kütüphaneye (`data/global/modals.json`) işlendi — id `new-database`, kategori `anasayfa`. İçerik (TR/EN):
- **Başlık bandı** — gradient (lacivert→mavi) beyaz yazı (anasayfa modalındaki header görünümü; `hm-title` sınıfı, Başlık bloğunda "Gradient bant" kutusuyla aç/kapa)
- **Görsel** — `nopic.jpeg`
- **Açıklama** — ortalanmış paragraf
- **Buton** — "Veritabanına Git" → `veritabanlari.html`

Builder'da **4 blok** olarak tanınıyor (Başlık / Görsel / Paragraf / Buton) — blok blok düzenlenebilir. Popup önizlemede anasayfadakiyle aynı görünüm doğrulandı ✓ (ekran görüntüsünde: gradient başlık + resim + ortalı metin + mavi buton).

**Teknik not:** Başlık bloğuna `cls` alanı eklendi (ekstra sınıf — `hm-title` gibi); round-trip'te korunuyor. Title regex'i artık ekstra sınıflı başlıkları da tanıyor.

## 🗄️ MODAL PROJESİ RAFTA (şimdilik durduruldu)

**Karar:** Anasayfa aktif modalının (`new-database`) kütüphanedeki aktarımı birebir tutmadığı için modal üretici çalışmaları şimdilik rafa kaldırıldı. Başarısız aktarım (`new-database` modalı) `data/global/modals.json`'dan kaldırıldı → 5 modal kaldı.

**Rafta duran (saklanan):**
- Modal Üretici aracı (Wix/Elementor tarzı görsel düzenleyici, 14 blok, TR/EN çift düzenleme, ikon/resim galerileri, round-trip garantisi) — **çalışır durumda**, kullanılabilir
- `hm-title` gradient başlık stili (site + preview CSS) — şu an kullanılmıyor, yeniden denenirse hazır
- 50/50 düzenleyici düzeni (bu ayrı istekti, kalıcı)

**Devam etmek istendiğinde (kaldığı yerden):**
1. Aktarımın "aynı görünmeme" nedeni: (a) popup önizlemede relative görsel yolları manager adresine çözülüyor → görseller `/assets/...` mutlak yolla veya preview'da base düzeltmesiyle; (b) anasayfa modalı kendi kabuğunda (yapışık gradient başlık + alt bilgi + "tekrar gösterme" kutusu) — kütüphane modalı genel kapsayıcıda içerik olarak gösteriliyor, birebir eşleşmesi için kapsayıcı farkının kabulü veya özel şablon gerekir.
2. İstenirse modal kütüphanesi hiç kullanılmayıp yalnızca help section modal yapısıyla (modalId referansı) devam edilebilir.

## 📢 guncel-haberler — denetim tamamlandı (2026-08-15) ✅

### Yapılanlar (13 bulgunun tamamı uygulandı, canlı test edildi)
1. **actionType davranışı** — `page`/`external` + gerçek url → doğrudan git (dış link yeni sekme, iç sayfa aynı sekme); `modal`/url'siz → modal açılır. Test: id=1 dış link → `window.open` ✓, id=3 → `egitim-programlari.html`'e yönlendi ✓, id=2 → modal ✓
2. **Buton metinleri JSON'a taşındı** — `labels.viewDetails` (Detayları Gör/View Details), `labels.close` (Kapat/Close), `labels.goToPage` (Sayfaya Git/Go to Page). EN'de "View Details" doğrulandı ✓
3. **Kategori rozeti eşleme** — kart + modal rozetleri artık ham ID değil, JSON kategorilerinden çevrilebilir etiket gösteriyor (EN: Databases, Announcement, Training, Event ✓)
4. **Ölü kod temizliği** — `renderFilterButtons()` (hiç çağrılmıyordu), `#news-heading .heading-title` güncellemesi (element yok), renderNews'teki kullanılmayan `hasRealLink` kaldırıldı
5. **Sort ikonu JSON'dan** — toggle artık `controls.sort.icon.desc/asc` + `text.desc/asc` okuyor (test: `sort-down-alt` ↔ `sort-up-alt`, metin "Oldest" ✓)
6. **featured kullanımı** — her kartta "Öne Çıkan/Featured" rozeti render ediliyor (7/8 item featured)
7. **meta.en** — yapı `meta.title.{tr,en}` / `meta.description.{tr,en}` olarak zaten dolu (ayrı `meta.en` yoktu — denetimde yanlış okumuşum, veri doğru)

### Ders (diğer sayfalara taşı)
- Arama bileşeni `search-with-controls` JSON'dan geldiği için **kategori listesi ve sort ikonu/etiketleri tek kaynaktan** okunmalı — toggle'larda hardcoded ikon/metin kullanma
- `actionType` + `url` çiftini her haber/duyuru tipi için tutarlı tut (modal ise url yok, sayfa/dış ise gerçek url)
- Buton/rozet/etiket metinleri asla HTML'de hardcoded olmamalı — `labels` nesnesi JSON'a eklenip okunmalı
- Kategori rozeti ham ID göstermemeli — kategori listesinden eşleme yap (Utils.getLocalizedText)

### Sıradaki sayfa
- **🗄️ veritabanlari** (duyurular ve guncel-haberler'deki dersler burada da uygulanacak)

## 📋 ŞEMA & YÖNETİM KURALLARI (2026-08-15) — uyulacak standartlar

### 1. SEO bölümü: JSON anahtarı `meta`, şema etiketi "SEO Bilgileri"
- Tüm sayfa JSON'larında üst seviye anahtar **`meta`**'dır (seo.js bunu okur, `seo` anahtarı YOKTUR).
- Manager şemasında bu bölüm `label: "SEO Bilgileri"` olarak tanımlanır.
- **Şemasız sayfa** otomatik şemaya düşer ve ham `meta` adını gösterir → bu bir hatadır. Her sayfanın elle şeması olmalı.

### 2. Her sayfa için elle şema zorunlu
- Otomatik şema: ham anahtar adlarını gösterir, ikon galerisi/görsel seçtirici ÇALIŞMAZ, derin {tr,en} alanlar raw'a düşer.
- Şema dosyası: `manager/schemas/<dosya-adı>.json` → `file` alanı JSON yolunu gösterir.

### 3. İkon alanları: `type: "icon"`
- Her ikon alanı şemada `type: "icon"` olmalı → Galeri butonu gelir (FA + Bootstrap, 327 ikon).
- Unutulan yerler: hero.icon, search.icon, clearButtonIcon, sort.icon.{desc,asc}, viewToggle seçenekleri, categories[].icon, helpSection buttons[].icon, heading/icon-list/info-box/alert/table bileşenleri.

### 4. Görsel alanları: `type: "image"` (dosya seçtirici)
- Foto/adres elle yazılmaz — şemada `type: "image"` → "🖼 Seç" butonu → `assets/images` galerisi (102 görsel) → yol **sistem tarafından** yazılır.
- Uygulandığı yerler: duyurular.announcementItems.image, modal modals[].image.{tr,en}, home.meta.ogImage, guncel-haberler.newsItems.image.
- Yeni sayfa şemasında görsel alanı asla `type: "text"` olmamalı.

### 5. Buton/rozet metinleri asla hardcoded olmamalı
- Kart/buton/rozet metinleri sayfa JSON'undaki `labels` nesnesinden okunur (`{tr,en}`).
- Örn: guncel-haberler `labels.viewDetails/close/goToPage/featuredBadge`.

### Denetim akışı hatırlatması
Önce önyüz → sonra JSON → uyuşmazlık/eksik/hatalar → "İlk Bakışta Kontrol Listesi" (veri/içerik, kod bağlantısı, manager/şema, özel durumlar) → düzelt → dersleri MD'ye işle → sonraki sayfa.

## 🎨 KATEGORİ RENKLERİ TEK KAYNAK (2026-08-15) — renk kodu karmaşası bitti

### Kural
- Kategori rengi **yalnızca kategori tanımında** tutulur: `search-with-controls.categories[].color` (şemada `type: "color"`).
- **Öğelerden renk kodu istenmez** — guncel-haberler `newsItems` ve duyurular `announcementItems` şemasından `categoryColor` alanı kaldırıldı. Yeni içerik girerken sadece "Kategori" seçilir, renk otomatik gelir.
- Render tarafı rengi kategoriden türetir:
  - guncel-haberler.js / duyurular.js → `getCategoryColor(categoryId)` (kategori bulunamazsa varsayılan lacivert `#1F4C8A`)
  - anasayfa slider (home.js) → `data.newsCategories`'ten türetir (app.js `loadNewsFromGuncelHaberler` kategorileri de saklar)
- Kategori rengi değiştirilirse **tüm sayfalar** (liste, modal, anasayfa slider) aynı anda güncellenir — eski item renkleri önemsizdir.

### Mevcut renkler
- guncel-haberler: Veritabanları `#1F4C8A` · Duyuru `#C03221` · Eğitim `#198754` · Etkinlik `#fd7e14`
- duyurular: Acil Duyuru `#C03221` · Genel Duyuru `#1F4C8A` · Etkinlik Duyurusu `#198754` · Sistem Bildirimi `#6c757d` · Tatil/Kapanış `#fd7e14`

### Not
- Item verilerindeki eski `categoryColor` alanları veride duruyor (zararsız) ama artık okunmuyor — istendiğinde veriden temizlenebilir.
- Kategori kimlikleri Türkçe string — eşleşme birebir olmalı (rozet etiketi gibi `getCategoryLabel`'den çevrilir).

### 🔧 guncel-haberler — "Öne Çıkan" rozeti kaldırıldı (2026-08-15)
- Kullanıcı rozeti anlamsız buldu: hem CSS'si olmadığı için resmin altına düşüyordu hem de 7/8 kartta görününce ayırt edici değildi.
- `news-card-featured-badge` markup + `labels.featuredBadge` (JSON + şema) kaldırıldı; kart `img + content` yapısına döndü.
- **`featured` bayrağı veride duruyor** — asıl görevi anasayfa slider'ı (maxItems kadar featured öğeyi gösterir). Rozet olarak değil, slider seçimi olarak kullanılıyor.
- Ders: kart üzerine "özellik" rozeti eklerken (1) CSS'i mutlaka yaz, (2) çoğu öğede görünüyorsa anlamsız olur — nadir/ayırt edici durumlarda kullan.

## ⚡ HIZLI İŞLEMLER + ERİŞİLEBİLİRLİK (global bileşenler) — 2026-08-15 ✅

### Yapılanlar
1. **Hardcoded başlık bitti** — quickactions.js `getTranslations()` artık JSON'dan okuyor (`translations.title/ariaLabel/close`, `{tr,en}`). Test: TR "Hızlı İşlemler", EN "Quick Actions" ✓
2. **quickactions.json şeması** oluşturuldu (`schemas/quickactions.json`) — global + 4 sayfa grubu (uzaktan-erisim, veritabanlari, home, inner), her öğede **ikon galerisi** (27 buton), TR/EN, action/url, enabled; çeviriler + bildirim metinleri düzenlenebilir.
3. **accessibility.json şeması** oluşturuldu (`schemas/accessibility.json`) — 13 özellik (ikon galerisi, ariaLabel TR/EN, enabled), çeviriler (TR/EN tam), kısayol, varsayılan dil.
4. Site testi: panel açılıyor (7 öğe anasayfada), başlık JSON'dan, EN'de tam çeviri ✓; erişilebilirlik paneli "Accessibility Menu (CTRL+U)" ✓.

### ⚠️ Bilinen sorun (kullanıcı kararıyla ertelendi)
- **"Rehber Videolar" hızlı işlemi `rehber-videolar.html`'e gidiyor ama sayfa henüz yok (404).** Kullanıcı sayfayı birazdan açacak — kaldırılmadı. Sayfa oluşturulunca sorun çözülür; o zamana kadar tıklayan kullanıcı 404 görür.

### Kural
- Global bileşenlerin (header, footer, quickActions, accessibility) çevirileri/başlıkları **asla JS'te hardcoded olmamalı** — JSON `translations` nesnesinden okunur, fallback olarak varsayılan değer tutulabilir.
- Şema dosya adı, veri dosyasıyla **birebir aynı olmalı** (küçük/büyük harf dahil): `quickactions.json` ↔ `schemas/quickactions.json` (config.js `quickActions: 'quickactions.json'`).

## 🗄️ veritabanlari — denetim tamamlandı (2026-08-15) ✅

### Yapılanlar (7 bulgu — hepsi uygulandı, canlı test edildi)
1. **Müzik + Referans kategorileri filtreye eklendi** — DB kategorilerinde vardı ama filtrede yoktu (seçilemiyordu). İkon + TR/EN ile eklendi. Test: Müzik 3, Referans 8 öğe filtreleme ✓, 12 kategori toplam.
2. **Sort tek kaynağa indi** — `sort.text/icon` component verisi (default/asc/desc) artık tek kaynak: `getSortUi()` + `updateSortButton()`. Hardcoded 'A-Z'/'Z-A'/'Sırala' ve sort-icon hardcodeları bitti. Test: Varsayılan→A-Z→Z-A→Varsayılan döngüsü + ikonlar ✓. Ayrıca verideki karışık anahtarlar düzeltildi (desc="Varsayılan", default="Z-A" idi).
3. **veritabanlari.json şeması** — SEO Bilgileri etiketi, 24 ikon galerisi (hero/search/sort/viewToggle/kategoriler/helpSection), çeviriler tam (tooltips, filterModal, modal), content registry.
4. **search-filter bileşeni _components.json'a eklendi** — daha önce kayıtta yoktu; manager'da bileşen tipi olarak kullanılabilir (mode, sticky, search, sort, viewToggle, categories, noResults).
5. **databases.json şeması** — 75 öğe: logo `type: "image"` (🖼 Seç — 75 buton), kategoriler {Türkçe, İngilizce} ikili, accessType select (remote/campus), apcSupport, kaynak linkleri (userGuide/videoTutorials/journalList/bookList/contentList), not.
6. **meta.en dolduruldu** — her iki dosyada da EN SEO başlık/açıklama boştu (Databases / EN açıklamalar).
7. İlk render sort etiketi `sort.text.desc` yerine `sort.text.default` okur oldu (renderSearchFilter).

### Temiz çıkanlar (önceki denetimde doğrulandı)
- 75/75 logo dosyası diskte ✓ · DB kategorileri filtreyle eşleşti (2 eksik eklenerek kapatıldı) ✓ · Modal metinleri JSON'dan ✓ · accessType 74 remote + 1 campus (gerçek veri) ✓

### Ders (diğer sayfalara taşı)
- Sayfa ayarları ile içerik ayrı dosyalardaysa (veritabanlari.json + databases.json) **ikisine de şema** gerekir; içerik dosyasının şeması en kritik olandır (75 öğe).
- Sıralama/görünüm kontrol etiketleri ve ikonları **component verisinden** okunmalı — JS'te hardcoded 'A-Z'/'Z-A' ve sabit icon sınıfları olmamalı.
- Filtre kategori listesi **verideki kategorileri tam kapsamalı** — eksik kategori = seçilemeyen içerik. Yeni içerik girilirken kategori yoksa filtreye de eklenmeli.

### Sıradaki sayfa
- **📋 formlar** (veya kullanıcının seçeceği — denetim akışı aynı)

## 📄 makale-islem-ucretleri — denetim tamamlandı (2026-08-15) ✅

### Yapılanlar (6 bulgu — hepsi uygulandı, canlı test edildi)
1. **TOC ikonları düzeltildi** — İçindekiler'de ACS "1", Bentham "2" sayı olarak görünüyordu → yayıncı emojileri 🧪 / 📚 yapıldı (diğer 4'ü emojiydi). Canlı: TOC'ta emojiler görünüyor ✓
2. **"TUBİTAK-EKUAL" yazımı** — Genel bilgi girişinde Ü'süz yazılmıştı → "TÜBİTAK-EKUAL" yapıldı (Springer'deki doğru yazımla tutarlı).
3. **hero.icon + showIcon eklendi** — Hero ikonu `bi bi-cash-coin` + `showIcon: true`. **hero.js güncellendi:** `showIcon`/`showBreadcrumb` artık sayfa verisinden okunabiliyor (yoksa config default'u kullanılır) — bu sayfa ve ileride başka sayfalar kullanabilir. Canlı: hero başlığının yanında ikon görünüyor ✓
4. **meta.en dolduruldu** — title.en "Article Processing Charges (APC)", description.en İngilizce. Canlı: EN'de document.title + meta açıklama İngilizce ✓
5. **Tüm içerik `{tr,en}` yapıldı** — hero, generalInfo (intro + 3 infoBox + description), requirements (4 şart), 6 yayıncının tamamı (açıklama, rozetler, uyarılar, infoBox'lar, guidelines, kaynak başlıkları/açıklamaları), tokenInfo etiketleri, iletişim, helpSection (başlık/açıklama/3 buton). Yayıncı adları, isimler, e-postalar, url'ler, ikonlar, emoji'ler str kaldı (çevrilmez). **JS güncellendi:** render fonksiyonları getLocalizedText sarmalandı (badges, warnings title/items, tokenInfo label, resource title, başlıklar). Canlı EN testi: rozetler "Free / Free for Hybrid Journals", uyarılar "Important Limitations", şartlar "Corresponding Author:", tokenlar "Remaining Token Count / 2025 Country Quota", helpSection "Call Now / Send Email / Home" ✓ — hiçbir yerde `[object Object]` yok ✓
6. **Elle şema oluşturuldu** — `manager/schemas/makale-islem-ucretleri.json`: hero (icon galerisi + showIcon), TOC (9 başlık, emoji alanı), genel bilgi (infoBox listesi), şartlar, yayıncı kartları (badges type select free/discount/warning, tokenInfo sayı, warnings maddeleri TR/EN ikili, guidelines, resources), iletişim (kişi listesi), yardım bölümü, SEO Bilgileri, son güncelleme 🔒. Canlı: manager'da Türkçe bölüm etiketleri + ikon galerileri ✓

### Temiz çıkanlar
- Mojibake / HTML sızıntısı / `---` / " - Copy" kalıntısı yok ✓ · TOC anchor ↔ bölüm id birebir eşleşiyor ✓ · **4/4 dış link canlı (200)** ✓ · lastModified güncel ✓ · helpSection 3 buton (iletişim kuralı) ✓

### Ders (diğer sayfalara taşı)
- **Çeviri bütünlüğü:** Bir sayfa kısmen çevrilmişse (örn. sadece TOC `{tr,en}`) EN modda sayfa karışık görünür — içerik alanları ya tamamen `{tr,en}` ya da bilinçli sabit (isim, yayıncı adı) olmalı.
- **Veri `{tr,en}` yapılınca render'ı da kontrol et:** Ham `${field}` interpolation dict basınca `[object Object]` gösterir — getLocalizedText sarmalanmayan her alan bulunmalı. Dönüşüm sonrası mutlaka EN modda `[object Object]` taraması yap.
- **`type: "icon"` galerisi emoji de destekliyor** — yayıncı/TOC emoji alanları için de kullanılabilir (hint'te belirt).
- **HeroManager `showIcon` sabit `false`'du** — hero verisinden okunur hale getirildi; başka sayfalar da hero.icon tanımlayıp `showIcon: true` ile açabilir.
- Dış linkler (kdm PDF'leri, ULAKBİM xlsx) denetimde canlı doğrulanmalı — hepsi 200 ✓

## 📖 mendeley-referans-yonetim-araci — denetim tamamlandı (2026-08-15) ✅

### Yapılanlar (5 bulgu — hepsi uygulandı, canlı test edildi)
1. **Ölü link düzeltildi** — "Diğer Araçlardan Geçiş" url `#` ama disabled/alert yoktu (tıklayınca sayfa başına atlıyordu) → `disabled: true`. Diğer iki `#` linki (Webinar Kaydı, Konu Rehberi) alert ile kapatılmıştı — dokunulmadı. Canlı: 6 kaynaktan 2'si gerçek link (200 ✓), Kullanıcı Rehberi + Diğer Araçlar disabled, 2'si alert'li ✓
2. **Resources bölüm başlığı düzeltildi** — `" Kaynaklar ve Yardım Materyalleri"` (başta çift boşluk, emoji yok) → `"📚 Kaynaklar ve Yardım Materyalleri"` (diğer 5 bölümle tutarlı emoji).
3. **meta.en dolduruldu** — title.en "Mendeley Reference Management Tool", description.en İngilizce. Canlı: EN'de document.title EN ✓
4. **Tüm içerik `{tr,en}` yapıldı** — hero (başlık/açıklama/breadcrumb), 6 bölüm başlığı, lead/text, 10 özellik, infoBox'lar, 5 adım, CTA (başlık + 2 buton), uyarılar, avantajlar (başlık + 5 madde), 6 kaynağın başlık/açıklama/not, helpSection (3 buton). Alert metinleri (yer tutucu uyarıları) bilinçli sabit str kaldı. **JS güncellendi:** section.title, feature.title, infoBox.title, step.title, cta.title, cta buton metinleri, warning.title, benefits.title/items, resource.title getLocalizedText ile sarıldı. Canlı EN testi: "Automatic Citation", "Create an Account", "Get Started Now!", "Sign Up for Mendeley", "Special Benefit for Alumni", "Unlimited private group creation", "Available in our library resources" ✓ — `[object Object]` yok ✓
5. **Elle şema oluşturuldu** — `manager/schemas/mendeley-referans-yonetim-araci.json`: hero (showIcon), TOC, **Sayfa Bölümleri (6)** — content içinde bölüm tipine göre tüm alanlar (lead/text/features/infoBoxes/steps/cta+warnings/benefits/resources), disabled + alert alanları, helpSection, SEO Bilgileri, son güncelleme 🔒. Canlı: manager'da "şema tabanlı düzenleme" + ikon galerileri ✓

### Bonus
- **hero.showIcon açıldı** (`fas fa-quote-right`) — makale sayfasıyla tutarlı. Canlı: hero başlığının yanında ikon ✓

### Temiz çıkanlar
- TOC ↔ bölümler 6/6 eşleşiyor ✓ · Mojibake / HTML / kalıntı yok ✓ · Markdown linkleri doğru alanlarda mdToHtml'den geçiyor ✓ · 2/2 mendeley.com linki canlı ✓ · lastModified güncel ✓

### Ders (diğer sayfalara taşı)
- **Yer tutucu link kuralı:** url `#` olan bir kaynak ya `disabled: true` ya `alert` taşımalı — ikisi de yoksa ölü link (tıklayınca sayfa başına atlar). Denetimde tüm `#` linkleri bu açıdan kontrol edilmeli.
- **Bölüm başlıkları tutarlı olmalı** — aynı listedeki bölüm başlıkları ya hepsi emoji ile başlamalı ya da hiçbiri; baştaki boşluklar temizlenmeli.
- **Farklı içerik tipli bölümler** (features/steps/cta/benefits/resources) tek `sections` dizisinde olabilir — şema content alanına tüm olası alt alanları koymalı (koşullu gösterim manager tarafında).
- Çeviri sonrası EN modda `[object Object]` taraması şart (bu sayfada 10 ham alan bulunup sarıldı — makale sayfasındaki ders tekrar işe yaradı).

### Sıradaki sayfa
- **📋 formlar** (veya kullanıcının seçeceği — denetim akışı aynı)

## 👤 arastirmaci-profili-olusturma — denetim tamamlandı (2026-08-15) ✅

### Yapılanlar (7 bulgu — hepsi uygulandı, canlı test edildi)
1. **Elle şema + 15 doğrulama hatası kapatıldı** — `manager/schemas/arastirmaci-profili-olusturma.json`: hero (showIcon), grouped TOC, quickNav, benefits, basicSteps, tips, **Özet Tablo (headers + nested rows)**, **Platform Bölümleri** (orcid/wos/scopus/googleScholar — her biri id/platformClass/icon/title/subtitle/content/infoBoxes/warnings/benefits/steps + step içinde infoBoxes/warnings), iletişim, yardım, SEO. Doğrula: **hata 0** ✓ (15 → 0).
2. **meta.en dolduruldu** + **hero.showIcon açıldı** (`fas fa-user-graduate`).
3. **Tüm içerik `{tr,en}`** — hero, breadcrumb, benefits (4), basicSteps (4 platform + 17 adım), tips (4), **comparison tablosu (5 sütun başlığı + 20 hücre)** — burada iç içe liste dönüşümü özel işlendi, platforms (18 bölüm: başlık/alt başlık/içerik/adımlar/infoBox'lar/uyarılar/avantajlar), contact, helpSection (3 buton), quickNav (başlık + 5 grup + 23 öğe — iletisim dahil).
4. **basicSteps ham URL'leri markdown link yapıldı** — "https://orcid.org/register adresine gidin" → "[orcid.org/register](https://orcid.org/register) adresine gidin" (2 adım) + render mdToHtml'den geçiyor. Canlı: TR'de de EN'de de tıklanabilir link ✓
5. **iletisim TOC + quickNav'a eklendi** — "Google Scholar" grubunun sonuna (render sırasıyla tutarlı). TOC 22→23 başlık ✓
6. **JS render getLocalizedText ile sarıldı** — sayfa JS'inde ~17 ham alan (bölüm/öğe başlıkları, başlık kartları, tablo başlık/hücreleri, platform başlık/alt başlık/adım başlıkları, infoBox/warning başlıkları) + **QuickAccess.js global'e getLocalizedText** (title, grup başlıkları, öğe metinleri) — Utils importu eklendi.
7. **Bonus düzeltme: quickNav hiç çalışmıyordu** — sayfa kendi fetch'iyle veri yüklediği için app.js'teki `initQuickAccess` hiç tetiklenmiyordu (log bile yoktu). Sayfa init'ine `this.app.initQuickAccess(this.pageData)` eklendi → Hızlı Erişim paneli artık çalışıyor (5 grup, 23 öğe, TR/EN canlı çeviri) ✓

### Manager altyapı eklemeleri (global)
- **Nested array desteği** — `renderArrayItem` dizi öğesini destekliyor (itemFields sırayla hücrelerle eşleşir, lang hücreleri TR/EN ikili). Karşılaştırma tablosu satırları manager'da düzenlenebilir ✓
- **validation.py nested array doğrulaması** — dizi öğesi artık "her öğe nesne olmalı" hatası üretmiyor (hücre tipleri itemFields'a göre doğrulanıyor).

### Temiz çıkanlar
- Mojibake / HTML / kalıntı yok ✓ · TOC 23 + quickNav 23 anchor birebir eşleşiyor ✓ · Adım toggle'ları (30) çalışıyor ✓ · dış linkler (orcid/scholar/kdm) markdown alanlarda ✓ · lastModified güncel ✓

### Ders (diğer sayfalara taşı)
- **Kendi fetch'iyle veri yükleyen sayfalar app.js'teki otomatik başlatıcıları kaçırır** — initQuickAccess gibi global başlatıcılar varsa sayfa init'inden açıkça çağrılmalı. Denetimde konsol loglarını (ör. "🚀 QuickAccess initializing...") yoksa aramak bu tip sessiz hataları yakalar.
- **İç içe dizi verisi (tablo gibi)** hem manager render'ına (renderArrayItem) hem doğrulamaya (validation.py) nested-array desteği gerektirir — ikisi de unutulursa ya `[object Object]` görünür ya da "her öğe nesne olmalı" hatası.
- 2 boyutlu string matrisleri `{tr,en}` dönüşümünde tek boyutlu listeler gibi dönüşmez — satır satır dönüştürülmeli.

### Sıradaki sayfa
- **📋 formlar** (veya kullanıcının seçeceği — denetim akışı aynı)

## 💻 bilgisayar-laboratuvari — denetim tamamlandı (2026-08-15) ✅

### Yapılanlar (4 bulgu — hepsi uygulandı, canlı test edildi)
1. **meta.en dolduruldu** — title: "Computer Laboratory", description: "Anadolu University Library - Computer Laboratory". EN modda `document.title` + meta açıklama artık İngilizce ✓
2. **hero.showIcon açıldı** — `fas fa-laptop` ikonu hero'da görünüyor (diğer denetlenen sayfalarla tutarlı) ✓
3. **Hreflang çift seti temizlendi** — bu sayfada kdm + kutuphane domain seti yineleniyordu (6 satır), diğer 46 sayfada yalnız kdm (3 satır). Kutuphane seti kaldırıldı → 3 satır ✓
4. **Elle şema oluşturuldu** — `manager/schemas/bilgisayar-laboratuvari.json`: hero (Başlık/Açıklama/İkon galerisi/İkonu Göster/Breadcrumb), Sayfa Bölümleri (content registry — `registry: "components"`, Bölüm Kimliği 🔒), Yardım Bölümü (3 buton + ikon galerileri), SEO Bilgileri, Son Güncelleme 🔒. Doğrula: **hata 0** ✓

### Content-registry sayfası — temiz çıkanlar
- Tüm içerik zaten `{tr,en}` (başlık/info-box/ikon listeleri/uyarı) — EN modda her şey İngilizce render, `[object Object]` yok ✓
- Renderer'lar (heading/info-box/icon-list/alert) getLocalizedText kullanıyor ✓
- Mojibake / HTML sızıntısı / kalıntı yok ✓ · helpSection 3 buton (iletişim kuralı) ✓ · lastModified güncel ✓
- Manager: 3 bölüm + 3 bileşen tipi seçici + 21 ikon galerisi ✓

### Ders (diğer sayfalara taşı)
- **Hreflang tutarlılığı**: sayfa kopyalanırken domain seti yinelenebiliyor — denetimde `grep -c hreflang *.html` ile tüm sayfalar 3 satır olmalı (admin-mockup'lar hariç).
- **Content-registry sayfaları için şema** `registry: "components"` referansıyla oluşturulur — bileşen tipleri `_components.json`'dan gelir, variant/style yapısal kalır.
- Bileşen verisi iki dilli olan sayfalarda EN tarafı genelde hazır — kontrol önceliği: meta.en, hero.showIcon, hreflang, şema.

### Sıradaki sayfa
- **📋 formlar** (veya kullanıcının seçeceği — denetim akışı aynı)

## 🌐 HREFLANG TARAMASI — tüm sayfalar (2026-08-15) ✅

### Tarama kapsamı
46 HTML dosyasının tamamı tarandı: satır sayısı + URL↔dosya adı eşleşmesi + domain seti.

### Bulgular ve düzeltmeler
1. **bilgisayar-laboratuvari.html** — 6 satırdı (kdm + kutuphane çift set) → 3 satıra indirildi (önceki tur)
2. **9 dev/demo sayfası üretim domain'ine hreflang veriyordu → kaldırıldı**:
   - `admin-panel.html`, `admin-panel-test.html`, `json-editor.html`, `demo-layouts.html`, `demo-toc-accordion.html`, `demo-toc-floating.html`, `demo-toc-hybrid.html`, `demo-toc-sticky.html`, `test-agreement-modal.html`
   - Bunlar JSON sisteminden bağımsız geliştirme araçları (app.js yok, data-page-name yok) — sunucuya yüklenince Google tarafından dizine eklenip üretim SEO'sunu kirletiyorlardı. Artık 0 satır (admin-mockup'larla tutarlı).
3. **34 gerçek sayfa** — 3 satır, URL'ler dosya adlarıyla birebir eşleşiyor ✓ (bozuk URL yok)
4. **off-kampus.html** — eski legacy sayfa ama hreflang'i tutarlı (3 satır, kendi adı) → dokunulmadı
5. **kurallar.html** — alias sayfa (data-page-name="kutuphane-kurallari" → kutuphane-kurallari.json) — hreflang tutarlı, dokunulmadı

### Kural (MD'ye işlendi)
- **Gerçek sayfa = 3 satır** (kdm domain, dosya adıyla birebir) · **Dev/demo = 0 satır**
- Yeni sayfa kopyalanırken hreflang bloğu tek set olmalı — kutuphane domain seti eklenmemeli
- Dev/demo sayfalarına üretim domain'ine hreflang YAZILMAZ (SEO kirliliği)
- Kontrol komutu: `for f in *.html; do echo "$(grep -c hreflang $f) $f"; done | sort -n`

### Sıradaki sayfa
- **📋 formlar** (veya kullanıcının seçeceği — denetim akışı aynı)

## 🧹 CONTENT-REGISTRY TOPLU TARAMA + DÜZELTME (2026-08-15) ✅

### Yapılanlar (23 content-registry sayfası)
1. **meta.en: 19 sayfa dolduruldu** → 23/23 tamam ✓ (EN title + description, EN modda document.title/metaDesc İngilizce)
2. **hero.showIcon: 22 sayfa açıldı** → 23/23 ✓ (+ ill → `fas fa-exchange-alt`, uyelik-odunc → `fas fa-id-card` ikon seçildi)
3. **Elle şema: 18 yeni şema** → 36/36 sayfa şemalı ✓ (hepsi `registry: "components"` kullanıyor)
4. **Registry 8 → 22 bileşen** — 14 eksik tip eklendi: accordion, circular-progress, collapsible-section, contact-box, contact-buttons, content, divider, icon-list-grid, link-cards, resource-links, staff-list, stat-cards, step-cards, step-guide
5. **Sayfaya özel alanlar**: sss → search, uyelik-odunc → toc, help-anahtarlı 5 sayfa → Yardım Bölümü

### Doğrulama sürecinde yakalanan ve düzeltilen gerçek sorunlar
- **icon-list** veride `title`/`text`/`description` karışık kullanılıyor — registry üçünü de kabul eder oldu (renderer zaten destekliyordu)
- **alert list stili** `content`'siz çalışıyor (items kullanır) — required kaldırıldı
- **contact-box link text** hem string hem `{tr,en}` olabiliyor — lang tipine alındı
- **accordion** iki format: sss.js `question/answer` + genel renderer `title/content` — ikisi de şemada
- **collapsible-section** iki format: `sections` (kutuphane-kullanim-klavuzu) + `content` (uzaktan-erisim/sure-uzatma) — ikisi de şemada
- **step-cards number** karışıktı: bazı sayfalar string ("1"), bazıları sayı (1) — hepsi sayıya çevrildi + şema `number`
- **sure-uzatma görselleri**: JSON `assets/images/sure-uzatma/sure-uzatma-1-tr.png` diyordu, gerçek dosyalar `assets/images/sure-uzatma-1.png` → 2 yolu düzeltildi
- **uzaktan-erisim görselleri**: `off-kampus-N-tr.png` yerine gerçek `off-kampus-N.png` → 3 yol düzeltildi; adım 4 ve EDS görseli dosyaları hiç yoktu → bozuk referanslar kaldırıldı (sayfa temiz render)
- **egitim step-cards** sayıları sayısallaştırıldı

### 🔴 Bilinen sorun (çözülemedi)
- **organizasyon-semasi PDF** — `assets/documents/organizasyon-semasi.pdf` dosyası projede hiç yok (assets/documents klasörü bile yok). Sayfadaki indirme linki 404 veriyor. PDF'i temin edip `assets/documents/` altına koymalısın.

### Server bug düzeltmesi 🐛
- `_schema_mtimes()` `_components.json`'u izlemiyordu (alt çizgili dosyalar atlanıyordu) — registry değişiklikleri sunucu restart'ı olmadan yansımıyordu. Artık izleniyor.

### Doğrulama sonucu
- 18 şemasız sayfanın 17'si **0 hata** ile doğrulamadan geçiyor (tek istisna: eksik PDF)
- Canlı testler: calisma-odalari (TR+EN ✓), sure-uzatma (3 adım, 5 akordeon ✓), uzaktan-erisim (4 adım ✓), sss (18 akordeon + arama ✓), istatistikler (3 dairesel + 16 stat kartı ✓), personel (68 kart ✓) — hepsinde hero ikonu görünüyor, `[object Object]` yok, kırık görsel yok

### Ders
- Content-registry şemaları `registry: "components"` ile ortak kayıt defterine bağlanır — bileşen tipleri tek yerde tanımlanır
- Veride aynı bileşen tipi farklı formatlarda olabiliyor (accordion, collapsible) — registry çoklu formatı desteklemeli
- Doğrulama (server-side) veri/şema uyumsuzluklarını ve eksik dosya referanslarını otomatik yakalar — her şema oluşturduktan sonra çalıştırılmalı

### Sıradaki sayfa
- **📋 formlar** (veya kullanıcının seçeceği — denetim akışı aynı)

## 🎨 İkon Galerisi + Kayıklık + Dinamik Saat (2026-08-17)

### 1. Tüm sayfalarda ikon galerisi
- Tarama: veride ikon değeri olan ama şemasında `icon` tipi (galeri) olmayan sayfalar → **7 sayfa** bulundu, hepsine elle şema oluşturuldu:
  - `anadolu-arastirma` (hub, 4 alt bölüm), `anadolu-universitesi-arastirma-birimleri/duyurulari/mevzuati/arastirmalardan-haberler`, `kime-sormaliyim`, `koleksiyon-kat-plani`
- Manager'da galeri butonları: kime-sormaliyim 23, koleksiyon 38 — doğrulama **0 hata** ✓
- **Manager altyapısı:** "lang öğeli dizi" desteği eklendi (`topics`, `details` gibi doğrudan `{tr,en}` öğeli listeler) — render + defaultItem + itemTitle. Öncesinde şemada bu alanlar olsaydı kayıtta veri bozulurdu.
- `api_files` artık `_reload_schemas_if_changed` çağırıyor (liste her zaman güncel şemalarla gelir).

### 2. egitim-programlari + iletisim "kayıklık" düzeltmesi (contact-grid)
- **Neden:** `.list-item span { flex: 1 }` column flex'te dikey büyüyor → kart içinde içerik üste yapışıyor; `min-width: auto` uzun e-posta/telefon metinlerinde grid kolonlarını eşitsizleştiriyordu (204/216/204px ölçüldü).
- **Düzeltme (CSS):** contact-grid `minmax(0,1fr)` + `justify-content: center` + `min-width: 0` + span `flex: 0 0 auto` + `overflow-wrap: anywhere`.
- Doğrulama: kolonlar artık eşit (208/208/208), içerik dikey ortalanmış ✓ (her iki sayfada).

### 3. calisma-saatleri dinamik saat manager'da görünmüyordu
- **Neden:** `heading` bileşeninin `statusBadge` alanı (saate göre otomatik Açık/Kapalı rozeti — `variant: auto` + `hours` verisi) registry `_components.json`'da **yoktu** → manager düzenleyemiyordu (veri korunuyor ama görünmüyordu).
- **Yapılan:** registry'ye `heading.statusBadge` + bağımsız `status-badge` bileşeni eklendi (23 bileşen). Şema veri yapısına uyduruldu: `{variant, data:{hours, status, statusText, icon}}`.
- **Veri temizliği:** Pazar (Kapalı) gününde `openTime/closeTime: null` kaldırıldı → doğrulama 0 hata ✓.
- Canlı: rozet Pazartesi 08:34'te "Open" gösteriyor ✓ · manager'da saatler düzenlenebilir ✓

### Dersler
- Registry'ye bileşen alanı eklerken **gerçek veri yapısını** birebir kopyala (heading.statusBadge içinde `data` sarmalayıcısı vardı — ilk denemede atlanıp saatler boş render oldu).
- Manager şeması veriyle uyuşmazsa sessizce boş görünür; doğrulama "metin olmalı" gibi gerçek hataları yakalar.
- `null` değerli alanlar doğrulamada "metin olmalı" hatası verir — veriden kaldır (yoksa gereksiz hata).

### 4. calisma-saatleri "sitede görünen ≠ manager" — içerik kapsam kontrolü (2026-08-17)
Sitede görünen ama manager'da **düzenlenemeyen** alanlar tespit edildi ve registry'ye eklendi:
- `heading` → **subtitle** (Alt Başlık) — "Ana Kampüs - Merkez Bina" sitede vardı, manager'da yoktu
- `alert` → **title** (Başlık) + items/link/linkText/linkIcon — "Önemli Bilgilendirme" sitede vardı, manager'da yoktu
- `table` → **title** (Tablo Başlığı) + **id** — "Haftalık Çalışma Programı" sitede vardı, manager'da yoktu
- `contact-buttons` → `type` select'e çevrildi (phone/email/link)
- **alert.link → lang tipi** (formlar sayfasında dile göre farklı URL kullanılıyordu — `{tr,en}`)
- **iletisim şeması:** helpSection butonlarına `type` (link/modal) + `modalId` alanları eklendi, `link` zorunluluktan çıkarıldı (modal butonlarının link'i yok)
- **app.js:** lang-öğeli dizi branch'i string öğeleri artık bozmuyor (tek alan olarak gösterir, tip korunur)
- Tüm sayfa doğrulaması: **34/35 temiz** (tek istisna: organizasyon-semasi eksik PDF — bilinen sorun)

### 5. statusBadge "[object Object]" hatası + boş rozetler (2026-08-17)
- **Belirti:** Manager önizlemesinde (ve kaydedilirse sitede) tüm başlıklarda kırmızı `[object Object]` rozeti.
- **Kök neden:** Şema render'ı sırasında `ensureDefaults` her başlığa boş `statusBadge` ekliyor (`{variant:"", data:{hours:[], status:"", statusText:{tr:"",en:""}, icon:""}}`). `renderStatusBadge` `displayText = statusText || ...` satırında boş `statusText` NESNESİNİ alıyordu → `[object Object]`. Manager önizlemesi (preview/set) bu bellekteki veriyi sitede gösteriyordu.
- **Düzeltmeler:**
  - `renderStatusBadge`: anlamlı veri yoksa (boş saat + boş durum) rozet HİÇ çizilmez; `statusText` `Utils.getLocalizedText` ile çözülür (boşsa "Kapalı" fallback).
  - Manager kaydı: `stripUntouchedDefaults` — şema render'ının eklediği ama kullanıcının **dokunmadığı boş varsayılan alanlar** disk'e yazılmaz (`tab.original` ile karşılaştırma). Kullanıcı doldurursa korunur.
- **Doğrulama:** Önizleme artık tek gerçek rozeti gösteriyor ("Açık"), `[object Object]` yok ✓ · node testi: boş statusBadge temizlenir, main-library saatleri (3 gün) korunur, kullanıcı doldurursa kalır ✓ · disk temiz (2 satır diff) ✓
- **Ders:** Şemaya eklenen her object alanı, render sırasında tüm başlıklara/elemanlara boş varsayılan olarak eklenir — site render'ı boş veriye karşı korumalı olmalı (rozet/durum gibi bileşenler "veri yoksa çizme" kuralı) ve manager kayıt öncesi dokunulmamış boşlukları temizlemeli.

### 6. 🆕 hours-table — tam dinamik çalışma saatleri sistemi (2026-08-17)
Kullanıcı isteği: "görünüm aynen kalsın, her satırın en sağında saate göre Açık/Kapalı rozeti olsun, öğle arası girilen saatlerde de bildirsin, resmi tatillerde bazı birimler açık kalabilsin, yeni bölüm eklemek kolay olsun."

**Yeni bileşen `hours-table`** (site renderer + manager registry):
- Veri modeli: `{id, title, columns:[{kind: name|schedule|status, label}], holidays:[tarih], rows:[{name{tr,en}, icon, schedules:[{days:[0-6], periods:[{open,close}], closed}], exceptions:[{date, open, openTime, closeTime}]}]}`
- `columns.kind`: `name` = satır adı · `schedule` = saat sütunu (satırın programları SIRAYLA eşleşir) · `status` = canlı rozet kolonu
- **Görünüm:** mevcut tabloyla birebir (Gün|Saat + Bölüm|Hafta içi|Cmt|Pzr) + en sağda "Durum" kolonu. `00:00-23:59` → otomatik **7/24**; çoklu aralık → `08:30 - 12:00 / 13:30 - 18:00`; `closed` → **Kapalı**
- **Rozet mantığı** (`computeStatusForRow`): bugünün günü → o programa bak → aralık içinde **Açık** / aralıklar arası boşluk **Öğle Arası** (sarı) / dışı **Kapalı**. 7/24 → hep Açık
- **Tatil sistemi:** üst düzey `scheduleConfig.holidays` (sayfa geneli) + tablo bazlı `holidays`. Tatilde tüm satırlar Kapalı; satırın `exceptions` listesinde `{date, open:true}` varsa o birim Açık kalır (29 Ekim'de Okuma Salonları gibi) — istenirse özel saat de verilebilir
- **Başlık rozeti:** `heading.statusBadge = {variant:"from-table", tableRef:"main-library-hours-table"}` — tek veri kaynağı: tablodan hesaplanır (eskiden başlıkta ayrıca saat listesi tutuluyordu, çift bakım vardı). `ComponentRenderer.registerPageData()` ile sayfa verisi renderer'a verilir
- **Manager:** yeni alan tipleri **`time`** (saat:dakika), **`day-multiselect`** (7 gün kutucuğu), `itemType:"date"` (tatil tarihleri) eklendi. Satır/program/aralık/istisna/sütun/tarih için "+" butonları — yeni bölüm eklemek = "+ Satır" → ad + ikon galerisi + gün kutucukları + saatler (kod yok)

**Doğrulama (hepsi geçti):**
- Node mantık testi 9/9: öğle arası (12:30 → lunch), tatil (Kapalı), tatil+istisna (Açık), 7/24 (Açık), mesai dışı (Kapalı) ✓
- Canlı TR+EN: başlık rozeti "Açık/Open", tablolar birebir, `[object Object]` YOK ✓
- Tatil simülasyonu (17 Ağustos geçici tatil): tüm satırlar Kapalı → Okuma Salonları'na istisna eklenince Açık, diğerleri Kapalı ✓ (tam istenen senaryo)
- Manager: 252 gün kutucuğu (14 satır × program × 7), 46 saat alanı (23 aralık × 2), 8 tarih (7 tatil + 1 istisna), "+ Satır" 11→12 ✓ · doğrulama 0 hata ✓

**Dersler:**
- Registry'ye bileşen eklerken JSON üretimini **json.dumps çıktısının anahtar satırını gövdeye karıştırmadan** yaz (ilk denemede `{"hours-table": {"hours-table": {...}}}` çift iç içe oldu → manager'da alanlar sessizce render olmadı; doğrulama bile yakalamadı çünkü veri tarafı temizdi, sadece ŞEMA tarafı bozuktu → UI render'ı + şema servisini birlikte test et)
- Manager'da bileşen alanları görünmüyorsa önce `/api/file` yanıtındaki **resolved şemayı** kontrol et (registry çözümü), sonra UI'a bak
- Tatil listesi şu an sabit resmi tatiller (2026): 01-01, 04-23, 05-01, 05-19, 07-15, 08-30, 10-29 — **dini bayramlar (Ramazan/Kurban) her yıl güncellenmeli** (manager'dan "Çalışma Saati Ayarları → Resmi Tatiller" bölümüne tarih eklenir)

### 6.1 ⏰ 24 saat veri / AM-PM görüntüleme (2026-08-17)
- **Veri ve manager her zaman 24 saat** kalır (`input type="time"` zaten 24 saat — `08:30`, `18:00`).
- **Site dili İngilizce olunca sadece görüntüleme AM/PM'e döner:** yeni `ComponentRenderer.formatClock()` — TR'de `08:30`, EN'de `8:30 AM` / `6:00 PM` / `12:00 PM` (öğlen) / `12:00 AM` (gece yarısı). 24:00 → `12:00 AM`.
- `scheduleDisplay` artık `formatClock` kullanıyor; `7/24` her iki dilde değişmez.
- Canlı: TR `08:00 - 23:00` · EN `8:00 AM - 11:00 PM` · öğle arası `8:30 AM - 12:00 PM / 1:30 PM - 6:00 PM` ✓
- **Ders:** dil duyarlı gösterimler için veriyi (24 saat) görüntüden (AM/PM) ayır — çeviri yalnızca render anında uygulanır, veri ve manager etkilenmez.

### 6.2 🌍 24 saat / AM-PM — tüm sayfalara yaygınlaştırma (2026-08-17)
Kullanıcı isteği: "calisma-saatleri dışındaki sayfalarda saat gösteren tüm bileşenleri tarayıp aynı kuralı uygula."

**Tarama sonucu — saatler 3 yerde:**
1. **Structured veri:** `home.json meta.openingHours` → yalnızca **JSON-LD** (schema.org `openingHoursSpecification`). Makine formatı → **BİLİNÇLİ 24 saat kalıyor** (Google zorunlu tutar), sayfada görsel gösterimi yok. ✓ doğrulandı
2. **Serbest metin:** duyurular/haberler/modal içerikleri, info-box/alert içerikleri ("02:00-06:00", "08:00 - 23:00", "14:00-16:00" vb.) → `getLocalizedText` + `mdToHtml` akışı
3. **hours-table hücreleri:** zaten `formatClock` ile dönüyordu (6.1)

**Uygulanan kural — TEK nokta: `Utils.getLocalizedText` + `Utils.localizeClockText`**
- `getLocalizedText` artık TÜM dönüş noktalarını `localizeClockText`'ten geçiriyor → başlık, alt başlık, içerik, tablo hücresi, duyuru/haber metni, modal paragrafı, kat-planı detayları — **yerelleştirilmiş her metin** kapsanır
- `ComponentRenderer.formatClock` da aynı kurala yönlendirildi (çift mantık kaldırıldı)
- Regex: `\b(2[0-4]|1[0-9]|0?[0-9]):([0-5][0-9])\b(?!:)(?!\s*[AP]M\b)` — saniyeli (`10:30:00`), zaten AM/PM olan, URL içindeki saatler çevrilmez; `24:00` → `12:00 AM`
- **Kapsam dışı:** ham `html` alanları (modal html, custom-html) — kullanıcının yapıştırdığı raw kod, otomatik dönüşüm HTML'i bozabilir; EN sürümde elle AM/PM yazılır. JSON-LD structured data da kapsam dışı (makine formatı).

**Doğrulama:**
- Node 14/14: aralıklar, öğle, `24:00`→`12:00 AM`, `00:00`→`12:00 AM`, gece yarısı, saniye koruması, çift dönüşüm koruması, URL koruması ✓
- Canlı EN: duyurular "2:00 AM-6:00 AM" / "8:00 AM-11:00 PM" ✓ · kat-planı "Working Hours: 8:30 AM - 10:00 PM" ✓ · guncel-haberler saat yok (etkilenmedi) ✓
- Canlı TR: duyurular "02:00-06:00", "08:00-23:00" — **değişmedi** ✓
- JSON-LD openingHours "08:00"/"23:00" 24 saat ✓ · konsol hatasız ✓

**Dersler:**
- Görüntüleme kuralları için doğru nokta, tüm yerelleştirilmiş metnin geçtiği **tek fonksiyon** (`getLocalizedText`) — bileşen bileşen aramak yerine oraya koy = her yerde tutarlı.
- Makine tüketen veri (JSON-LD) görüntüleme kuralından **muaf** tutulmalı.
- Regex dönüşümlerinde çift dönüşüm koruması şart: zaten AM/PM olanı yakalama (`(?!\s*[AP]M\b)`) ve saniyeli zamanı bozma (`(?!:)`).

### 6.3 🇬🇧 EN'de "7/24" → "24/7" (2026-08-17)
- İngilizcenin standart ifadesi "24/7"dir (24 hours, 7 days); "7/24" Türkçe sıralamadır.
- `Utils.localizeClockText`'e `\b7\/24\b(?!\/\d)` → `24/7` kuralı eklendi → hours-table hücreleri + serbest metin dahil EN modda tüm gösterimler "24/7" olur; TR'de "7/24" kalır.
- Koruma: `7/24/2026` gibi tarih formatı bozulmaz (ardından /rakam gelirse çevrilmez).
- Canlı: EN "Reading Halls | 24/7 | 24/7 | 24/7 | Open" ✓ (sayfada hiç "7/24" yok) · TR "Okuma Salonları | 7/24 | 7/24 | 7/24 | Açık" ✓

### 7. 🧹 Çift "Yardım Bölümü" temizliği (2026-08-17)
- **Belirti:** Manager'da bazı sayfalarda iki "Yardım Bölümü" kartı.
- **Kök neden:** 10 sayfanın JSON'unda HEM `help` HEM `helpSection` anahtarı vardı (ikisi de dolu, legacy çift). Site `helpSection || help` önceliğini kullandığı için `help` hiçbir yerde görünmüyordu (ölü veri) — koleksiyon-kat-plani canlı testinde doğrulandı: sitede yalnızca helpSection içeriği render oluyor.
- **Yapılan:** 10 sayfadan (anadolu-* 4 alt sayfa, egitim-programlari, ill, koleksiyon-kat-plani, kutuphane-kullanim-klavuzu, sss, uyelik-odunc-islemleri) `help` anahtarı JSON + şemalardan cerrahi olarak kaldırıldı (dosya formatı korundu, temiz diff). helpSection kaldı.
- **Doğrulama:** 10/10 sayfa doğrulamada **0 hata** ✓ · manager'da tek "Yardım Bölümü" ✓ · sitede helpSection render oluyor (Hemen Ara/E-posta/Ana Sayfa) ✓ · 36 JSON'un hiçbirinde çift kalmadı ✓
- **Ders:** Bir sayfada aynı işi yapan iki alan (help vs helpSection) birikirse site hangisini gösteriyorsa onu tut, diğerini veriden + şemadan birlikte sil — yalnızca birini silersen manager/site tutarsızlığı sürer.

### 8. Hero Sistemi — 3 Katmanlı (bilgisayar-laboratuvari pilotu) ✅

- **Amaç:** Breadcrumb tüm sayfalarda görünsün (gizle/göster), ikon konumu değişebilsin, hero renkleri düzenlenebilir olsun — global ayarlar + sayfa bazlı override.
- **Katman 1 — Global (data/global/settings.json → `hero` bloğu):** showBreadcrumb=true, breadcrumbMode=auto, showIcon=true, iconPosition=top, backgroundColor=#e6f2fb, boxColor=#ffffff, iconColor=#11325d, titleColor=#11325d, textColor=#555555. Tek yerden tüm site değişir. Manager'da GENEL AYARLAR → settings.json (yeni explicit şema eklendi: renk seçiciler + select'ler).
- **Katman 2 — Sayfa override (hero şeması genişletildi):** bilgisayar-laboratuvari hero'suna showBreadcrumb, breadcrumbMode (auto/manual/hidden), iconPosition (top/left/right), backgroundColor/boxColor/iconColor/titleColor/textColor eklendi. Sayfada değer yoksa → global, global yoksa → CSS (fallback zinciri).
- **Katman 3 — Breadcrumb modları:** `auto` = header.json menüsünden türetilir (Ana Sayfa → Araştırma → Sayfa; son kırıntı sayfanın kendi başlığını kullanır), `manual` = sayfanın kendi breadcrumb dizisi, `hidden` = gizli. showBreadcrumb=false her modu kapatır.
- **Menü başlığı dönüşümü:** BÜYÜK HARF menü başlıkları breadcrumb'da başlık biçimine çevrilir (Türkçe yerel ayar: I→ı, i→İ; APC/ILL/SSS gibi 2-3 harfli kısaltmalar korunur; tireli kelimeler korunur).
- **hero.js:** settings.json + header.json bir kez yüklenir (önbellek), mergeConfig global>sayfa birleştirir, renkler inline style, ikon konumu CSS sınıfı (top/left/right + mobilde üste döner).
- **CSS:** inner-pages.css'e .page-hero-icon-left/right (flex satır, ikon yanında) + mobil düşüşü eklendi.
- **settings.json şeması:** manager/schemas/settings.json oluşturuldu (9 hero alanı + tüm diğer bloklar düzenlenebilir, lastModified kilitli).
- **Doğrulama:** TR + EN canlı (auto: "Ana Sayfa > Araştırma > Bilgisayar Laboratuvarı" / "Home > Research > Computer Laboratory"; manual: "Ana Sayfa > Hizmetler > ..."; hidden: yok) ✓ · sayfa override (iconPosition left/right, renkler) ✓ · global renkler uygulanıyor (#e6f2fb arka plan) ✓ · şema doğrulama 0 hata ✓ · manager render 13 hero alanı + settings 9 hero alanı ✓
- **Ders:** Sitede settings.json hiç yüklenmiyormuş — HeroManager kendi fetch'i ile yükledi (önbellekli). Breadcrumb'ı her sayfaya elle doldurmak yerine menüden otomatik türetmek daha sürdürülebilir; elle dizi yalnızca istisna sayfalarda.
- **Kural:** Yeni bir hero alanı eklenecekse 3 yere birlikte dokun: settings.json (global default) → sayfa şeması (override) → hero.js render (fallback zinciri).
- **Not:** Sayfa şemasındaki boş renk alanları manager'da #000000 görünür (değer yok = global kullanılır, kaydedilmez). "Breadcrumb Göster" onay kutusu sayfada boşsa unchecked görünür ama global true uygulanır — hint metni bunu açıklar.

### 8.1 Hero Geliştirmeleri + Help/SEO Kalıpları (bilgisayar-laboratuvari pilotu) ✅

**1. İkon/metin konumu:**
- `iconPosition` (top/left/right) + yeni `textAlign` (left/center/right) — boşsa otomatik: sol ikon→sola, sağ ikon→sağa, üst→orta. Explicit seçim override eder.
- Metin ikonun yanında (flex), mobilde üste döner.

**2. Breadcrumb açıklamanın altına taşındı** — hero kutusunun İÇİNDE, metnin altında (kesikli ayraçla). Koyu tema düzeltmesi eklendi.

**3. Renk sıfırlama:** Manager'daki her renk alanının yanına ✕ (Sıfırla) butonu — değeri temizler → global (settings.json) renk geçerli olur, kayıtta boş yazılır ve stripUntouchedDefaults temizler. Eski renkler geri geldi: bg #e6f2fb, kutu #ffffff, ikon/başlık #11325d, metin #555555.

**4. Global bağlantı (manager):** Hero kartının başında "⚙ Global Ayarları Aç (settings.json)" butonu (`globallink` alan tipi) — tıklayınca settings.json ayrı sekmede açılır. Sayfa alanları boşsa global geçerli; doluysa sayfa override'ı (hint metni açıklar).

**5. Koşullu görünürlük (manager):** Yeni `visibleWhen: {key, value}` şema özelliği — breadcrumb listesi yalnızca mod "manual" iken görünür (auto/hidden'da gizli), helpSection modalId yalnızca type=modal iken görünür.

**6. Şema gruplama:** Hero kartı 4 görsel gruba bölündü (Başlık ve Açıklama / İkon Ayarları / Breadcrumb Ayarları / Renkler) — `group` alan tipi (veriye yazılmaz).

**7. HelpSection kalıbı (modal destekli):** Buton şeması: type (link/modal) + icon + text + variant + link + modalId (`modalref` — modals.json kütüphanesinden select). Test: "Sorun Bildir" modal butonu eklendi → canlıda modals.json'dan açılıyor ✓. iletisim'deki desen artık burada da.

**8. SEO kalıbı:** Meta şeması zenginleştirildi: title, description, keywords, ogImage, ogType, section, author, publishedTime, tags (home'a özgü searchUrlTemplate/logo/openingHours dahil edilmedi). Data dolduruldu; canlıda og:type=article, og:image 1200×630, article:section/tag/published_time uygulanıyor ✓.

**Manager'a eklenen alan tipleri:** `group` (görsel bölüm başlığı), `globallink` (başka JSON'u açar), `visibleWhen` (koşullu görünürlük), renk ✕ sıfırla.

**Doğrulama:** 48 dosya — 2 bilinen sorun (organizasyon-semasi PDF, rehber-videolar sayfası henüz yok — quickactions'ta referans veriliyor, sayfa yapılınca kapanır). Hero/settings şeması 0 hata. TR+EN canlı ✓.

**Kural:** HelpSection ve SEO artık kalıp — diğer sayfalara uygulanırken bilgisayar-laboratuvari şemasındaki yapı kopyalanır. Hero için: ikon ayarları → İkon grubu, breadcrumb → Breadcrumb grubu (listesi sadece manual'de), renkler → Renkler grubu, global link başta.

---

## ⛔ 8.2 HERO PİLOTU GERİ ALINDI (2026-08-17)

Kullanıcı kararı: **hero pilotu (3 katmanlı sistem + 8 maddelik geliştirmeler) görsel olarak bozulduğu için tamamen geri alındı.** Tek tek konuşulup yeniden tasarlanacak.

**Geri alınanlar:**
- `assets/js/components/hero.js` → orijinal commit haline döndürüldü (git restore)
- `data/global/settings.json` → hero bloğu kaldırıldı (orijinal hal)
- `manager/schemas/settings.json` → silindi (sadece hero global içindi)
- `manager/schemas/bilgisayar-laboratuvari.json` → hero/helpSection/meta standart kalıba döndü (diğer sayfalardaki gibi: hero = başlık/açıklama/ikon/showIcon/breadcrumb; helpSection = icon/text/link; meta = title/description)
- `manager/ui/assets/app.js` → `group`, `globallink`, `visibleWhen`, renk ✕ sıfırla kodları çıkarıldı (orijinal davranış)
- `manager/ui/assets/style.css` → bu özelliklerin stilleri kaldırıldı
- `data/pages/bilgisayar-laboratuvari.json` → "Sorun Bildir" modal butonu + zengin SEO alanları (keywords/ogImage/ogType/section/author/publishedTime/tags) çıkarıldı. **Korunanlar:** showIcon, meta.en (önceki turlardan)
- `assets/css/global/inner-pages.css` → hero ikon konumu + breadcrumb CSS'i kaldırıldı, orijinal breadcrumb CSS'i geri geldi. **Korunanlar:** modal kütüphanesi CSS'i (help-modal, modal-feature vb.)

**Doğrulama:** Site bilgisayar-laboratuvari → orijinal mavi degrade hero, breadcrumb gizli (orijinal varsayılan), "Sorun Bildir" yok ✓. Manager → hero 5 alan, helpSection standart butonlar, meta 2 alan, grup/globallink/sıfırlama yok ✓. settings.json hero bloğu yok ✓. hero.js/settings.json git diff temiz ✓.

**Ders:** Hero değişiklikleri GLOBAL görünümü etkiliyor (tüm sayfalar). Yeni tasarımda global→sayfa ayrımı, breadcrumb konumu ve yönetilebilirlik baştan konuşulacak — bu sefer pilot sayfada beğenilmeden diğer sayfalara yayılmayacak.

---

### 8.3 v1 manager (8123) calisma-saatleri düzeltmesi (2026-08-17)

Kullanıcı v1 manager'da (8123, `python manager/server.py`) calisma-saatleri.json'u açınca **şemasız/auto** görünüyordu ("Id: special-hours" + ham Components — İngilizce alan adları). Sebep: v1'in `manager/schemas/` klasöründe sadece 4 şema vardı (footer/header/iletisim/_components), calisma-saatleri şeması yoktu — güzel şemaların tamamı v2'deydi.

**Yapılan:**
- `manager/schemas/calisma-saatleri.json` → `manager/schemas/calisma-saatleri.json` kopyalandı (v1 formatı: LF + indent=2 + `preview` anahtarı)
- v1 `_components.json`'a `hours-table` + `contact-buttons` bileşen şemaları eklendi (v2'den)
- v1 `app.js`'e `time` (renderScalar) + `day-multiselect` (renderField + defaultFor) alan tipleri eklendi
- 8123 sunucusu yeniden başlatıldı (şemalar başlangıçta yükleniyor)

**Doğrulama:** v1 manager artık Türkçe şema gösteriyor — Hero, Çalışma Saati Ayarları, Resmi Tatiller, Sayfa Bölümleri, 46 saat alanı + 252 gün seçici aktif. Site 8123+8124'te 200 ✓.

---

### 8.4 HERO PİLOTU GERİ GETİRİLDİ (2026-08-17)

**Sebep:** Kullanıcının "her şey bozuldu" şikayeti, 8123'teki v1 manager'ın şemasız render'ından kaynaklanıyordu — hero pilotunun kendisi sağlamdı (v2'de). Kullanıcı onayıyla **8 + 8.1'in tamamı geri getirildi.**

**Geri getirilenler (8.2'nin tersi):**
- `data/global/settings.json` → hero bloğu (showBreadcrumb=true, auto, showIcon=true, iconPosition=top, textAlign="", 5 renk)
- `manager/schemas/settings.json` → yeniden oluşturuldu (10 hero alanı + diğer bloklar + lastModified kilitli)
- `manager/schemas/bilgisayar-laboratuvari.json` → hero 19 alan (globallink + 4 grup + visibleWhen) + helpSection modal kalıbı (6 alan) + meta 9 alan
- `manager/ui/assets/app.js` → applyVisibleWhen + group + globallink + renk ✕ sıfırla
- `manager/ui/assets/style.css` → field-group/globallink-btn/color-row/color-reset stilleri
- `data/pages/bilgisayar-laboratuvari.json` → "Sorun Bildir" modal butonu + SEO meta (keywords/ogImage/ogType/section/author/publishedTime/tags)
- `assets/css/global/inner-pages.css` → ikon konumu (top/left/right) + breadcrumb kutu içi stilleri + koyu tema
- `assets/js/components/hero.js` → 3 katmanlı sistem yeniden yazıldı (MD 8+8.1'den)

**hero.js notu:** Başlık dönüşümü (titleCase) geliştirildi — dil başlık bazında tespit edilir (İ/Ğ/Ü/Ş/Ö/Ç içeriyorsa tr-TR, yoksa en-US). Böylece 'ARACI' → 'Aracı' (tr) ve 'INTEGRATED' → 'Integrated' (en) aynı anda doğru; ASCII 'I' belirsizliği bağlamdan çözülür. 22/22 test ✓. Parantezli kelimeler ilk harften büyütülür: "(mendeley)" → "(Mendeley)".

**Doğrulama (canlı 8124):**
- TR: "Ana Sayfa > Araştırma > Bilgisayar Laboratuvarı" · EN: "Home > Research > Computer Laboratory" ✓
- manual: "Ana Sayfa > Hizmetler > Bilgisayar Laboratuvarı" (sayfanın dizisi) ✓ · hidden: yok ✓
- Global renkler (#e6f2fb arkaplan, #11325d başlık/ikon), ikon, "Sorun Bildir" ✓
- Manager: 4 grup, globallink → settings.json açılıyor, koşullu görünürlük (auto gizli/manual görünür), 5 renk sıfırlama ✓
- Şema doğrulama 0 hata ✓ · titleCase 22/22 ✓

**Yedek:** Commit `2904e40` + tag `hero-geri-getirme-oncesi` (geri getirmeden önceki durum — gerekirse geri dönülebilir).

### 8.5 HERO İNCE AYAR — METİN HER ZAMAN ORTADA (2026-08-17)

**Kullanıcı istekleri:**
1. Metin hizalaması ikon konumundan BAĞIMSIZ olmalı — ikon sol/sağda olsa bile başlık+açıklama ortada kalmalı (önceden sol ikon → metni sola kaydırıyordu).
2. Breadcrumb açılınca kutu çok büyüyordu — boşluklar daraltıldı.
3. Manager'da renk alanları boşken SİYAH görünüyordu — "renkler siyah olmuş" şikayetinin gerçek sebebi buydu (veri değil!).

**Yapılanlar:**
- `hero.js`: otomatik hizalama kaldırıldı → `textAlign = cfg.textAlign || 'center'` (ikon konumu metni etkilemez)
- `inner-pages.css`: sol/sağ ikon düzeni flex'ten **grid (1fr | auto | 1fr)**'e geçti — orta sütun (metin) tam ortada, ikon yan sütunda metne yaslı, breadcrumb `grid-column: 1/-1` satır 2'de
- Breadcrumb: font 0.875→0.8125rem, margin 1rem→0.8rem, padding 0.75→0.55rem, wrap + row-gap; kutu padding 2rem/3rem → 1.75rem/2.5rem
- `app.js` (color case): boş değer `#000000` yerine **nötr gri `#d9d9d9` + "Global" rozeti** — boş alan siyah görünmüyor, "global ayar geçerli" net
- `style.css`: `.color-global-badge` stili (+ koyu tema)
- Şema hint güncellendi: "İkondan bağımsızdır — boşsa her zaman orta"

**Doğrulama (canlı 8124):**
- İkon sol: metin tam ortada (offset 0), ikon solda ✓ · İkon sağ: metin ortada ✓ · İkon üst: ikon üstte, metin ortada ✓
- Breadcrumb altta ortalanmış, kompakt ✓ · EN: "Home > Research > Computer Laboratory" ✓
- Global renkler: #e6f2fb / #ffffff / #11325d / #11325d / #555555 (mavi ailesi) ✓
- Manager: boş renkler gri + "Global" rozeti, siyah yok ✓ · settings.json renkleri mavi ✓

**Not (süreç):** v2 sunucusu aslında `MANAGER_PORT=8124` ortam değişkeniyle çalışıyormuş — düz `python manager/server.py` 8123'e bağlanmaya çalışıp takılıyor. Zombie süreçler temizlendi, v2 `MANAGER_PORT=8124` ile, v1 normal şekilde yeniden başlatıldı (8123 v1, 8124 v2 — ikisi de ayakta).

### 8.6 HERO: ÜST ÇİZGİ RENGİ + HAZIR RENK PALETİ + SPLIT DÜZEN (2026-08-17)

**Kullanıcı istekleri:**
1. Kutucuğun üstündeki sarı şeridin (border-top) rengi ayarlanabilir olsun — global + sayfa bazlı.
2. Manager'da renk seçicilerin yanında sitenin ana renkleri hazır swatch olarak gelsin (sarı/mavi/açık mavi ~3 ana renk).
3. Yeni düzen: metin/ikon solda, breadcrumb aynı satırda sağda (split).
4. Hero'nun gereksiz yüksekliği azaltılsın.

**Yapılanlar:**
- `hero.js`: `layout` (stack/split) + `borderColor` mergeConfig'e eklendi; boxStyle artık border-top-color da yazıyor; split'te boş textAlign → sol
- `settings.json` (data): hero bloğuna `layout: stack`, `borderColor: #FFC43D`
- `settings` şeması: +`layout` (stack/split) + `borderColor` ("Üst Çizgi Rengi (Sarı Şerit)") → hero 12 alan; textAlign hint düzeltildi
- `bilgisayar-laboratuvari` şeması: Başlık grubuna `layout`, Renkler grubuna `borderColor`
- `inner-pages.css`: `.page-hero-layout-split` stilleri (flex, metin `margin-right:auto`, breadcrumb sağda `max-width:45%` + flex-end, mobilde alt alta); `.page-hero` padding 1.5/2 → 1.1/1.5rem, `.page-hero-content` padding 1.75/2.5 → 1.25/2rem → hero ~250px → ~193px
- `app.js` (color case): **hazır palet** — variables.css'ten 7 ana renk (Sarı #FFC43D, Mavi #1F4C8A, Koyu Mavi #153a6d, Açık Mavi #EEF9FC, Açık Mavi koyu #d5eef5, Beyaz, Kırmızı #C03221) her renk alanının altında tek tıkla seçilebilir swatch
- `style.css`: `.color-palette` / `.color-swatch` stilleri

**Doğrulama (canlı 8124):**
- Split düzen: metin solda (sola hizalı), breadcrumb sağda aynı satırda (45% genişlik, flex-end) ✓ · mobilde alt alta ✓
- borderColor sayfa bazlı (#1F4C8A test) ve global (#FFC43D sarı) ✓
- Hero yüksekliği 193px ✓ · Manager: settings 12 alan, palet 42 swatch (6×7), layout stack/split ✓
- Test verisi geri alındı (sayfa: iconPosition left, textAlign center, layout yok → global stack)

**Not:** Şema değişiklikleri sunucu yeniden başlatılınca yükleniyor — v2 restart edildi (8123 v1, 8124 v2 ayakta).

### 8.7 SPLIT ÖN AYARLARI + KART GENİŞLİĞİ + TÜRKÇE SEÇENEKLER (2026-08-17)

**Kullanıcı istekleri:**
1. Split düzeninde kart header ile aynı genişlikte olsun (container'ı doldursun).
2. Split için ön ayarlar: metin/ikon solda + breadcrumb sağda VEYA tam tersi.

**Yapılanlar:**
- `hero.js`: `layout` artık `stack | split-left | split-right`. Split'te metin otomatik o kenara hizalanır (textAlign ezilir); stack'te textAlign geçerli
- `inner-pages.css`: split stilleri iki yöne ayrıldı — `split-left` (metin solda, breadcrumb sağda, `margin-right:auto`) ve `split-right` (breadcrumb `order:-1` solda, metin sağda `margin-left:auto` + sağa hizalı). Kart `max-width: 100%` → header/container ile aynı genişlik. Mobilde ikisi de alt alta
- Şemalar (settings + bilgisayar-laboratuvari): layout 3 seçenek + **tüm select'ler Türkçe etiketli** (Yerleşim Düzeni açıklamalı, İkon Konumu Üst/Sol/Sağ, Metin Hizalaması Sol/Orta/Sağ, Breadcrumb Modu Otomatik/Elle/Gizli)

**Doğrulama (canlı 8124):**
- split-left: metin solda (114px), breadcrumb sağda (707px), aynı satır ✓
- split-right: breadcrumb solda (30px), metin sağda (707px), metin sağa hizalı ✓
- Kart genişliği 741px = container içeriği (eski durumda geniş ekranda 1000px'e takılıyordu) ✓
- Manager: 4 select Türkçe etiketli ✓ · şemalar restart sonrası yüklendi ✓
- Test verisi geri alındı (sayfa: iconPosition left, textAlign center, layout yok → global stack)

### 8.8 Hero: kutu boşlukları + tamamen kapatma + split-left düzeltmesi (12.08.2026)

**İstenen:** Kutucuk alt/üst padding ve margin ayarı · hero'yu tamamen kapatma ayarı.

**Yapılan:**
- **`enabled` (Hero'yu Göster)** — global (settings.json → hero.enabled, varsayılan `true`) + sayfa bazlı (hero.enabled `false` → o sayfada hero tamamen gizlenir, container display:none). Kapalıysa başlık/ikon/breadcrumb/çizgi dahil hiçbir şey render edilmez.
- **Kutu Boşlukları** — global + sayfa bazlı 4 alan (rem): `boxPaddingTop`, `boxPaddingBottom` (üst/alt iç boşluk), `boxMarginTop`, `boxMarginBottom` (üst/alt dış boşluk). Boşsa CSS varsayılanı: padding 1.25rem, margin 0. Sayfa şemasında "Kutu Boşlukları" grubu, settings şemasında hero sonuna eklendi.
- **Split düzeltmesi:** bilgisayar-laboratuvari.json'da `layout: "split"` (eski 2'li şema) kalmıştı → 8.7'nin 3'lü şemasına göre `split-left` yapıldı. (Yoksa `page-hero-layout-split` CSS'siz sınıfı üretip split stili uygulanmıyordu.)

**Doğrulama (canlı 8124):**
- Test: boxPaddingTop 2.5 / bottom 1 / marginTop 1.5 / bottom 0.5 → 40px / 16px / 24px / 8px uygulandı ✓
- enabled=false → hero-container display:none, hero öğeleri tamamen yok ✓ (sonra geri alındı)
- split-left: ikon x=30, metin x=114, breadcrumb x=402–707 aynı satır, kart 741px = container ✓
- Manager: settings.json "Hero'yu Göster (Global)" + 4 boşluk alanı ✓ · bilgisayar-laboratuvari "Hero'yu Göster" + "Kutu Boşlukları" grubu (4 alan) ✓
- Test verisi temizlendi; sayfa HEAD'ten geri yüklendi + layout split-left (kullanıcının ekran görüntüsündeki düzen)

**Not:** 8124 v2 sunucusu şema değişikliği için yeniden başlatıldı. 8123 v1 ve 8124 v2 ayakta.

### 8.9 Hero gizliyken üst boşluk + önizleme oturumu keşfi (12.08.2026)

**Sorun:** "Hero'yu Göster" kapatılınca kutucuğun margin ayarları işe yaramıyor (kutucuk gizli olduğu için görünmez etki) ve menü ile içerik arasında nefes payı kalmıyor.

**Kök neden — önizleme oturumu (önemli keşif):** manager `preview_session` çerezi koyar; bu çerezli tarayıcıda site `/data/*.json` isteklerine **diskteki dosyayı değil, manager'daki kaydedilmemiş önizleme verisini** servis eder (server.py 671-672, 710-713). Yani manager'da yaptığın düzenlemeler Kaydet'e basmasan bile sitede görünür. "Margin ayarlanamadı" hissinin sebebi: hero gizliyken margin, görünmeyen kutuya uygulanıyordu.

**Yapılan:**
- **`hiddenSpacing` (Gizliyken Üst Boşluk)** — global (settings.json) + sayfa (bilgisayar-laboratuvari): hero `enabled:false` iken menü ile içerik arasına bırakılacak boşluk (rem). Boşsa CSS varsayılanı **2rem**.
- hero.js: gizliyken `display:none` yerine `<div class="hero-hidden-spacer">` render eder; yüksekliği hiddenSpacing'den gelir.
- inner-pages.css: `.hero-hidden-spacer { height: 2rem; }`
- Manager şemalarına "Gizliyken Üst Boşluk" alanı (number, rem).

**Doğrulama (canlı 8124):**
- hiddenSpacing boş → içerik header'dan 32px (2rem) aşağıda; 4rem → 64px ✓
- Manager kaydetme akışı test edildi: "Üst Dış Boşluk" 1.5 girildi → JSON'a yazıldı → sitede 24px margin ✓ (sonra temizlendi)
- Hero görünürken margin alanları çalışıyor ✓

**Not:** Test kaydı manager'ın otomatik commit'iyle git'e girmişti (e9a054a, e3a1e89 — "İçerik güncellemesi"); çalışma kopyasından test değeri temizlendi, 1 satırlık diff kaldı (sonraki kayıtta kapanır). Geçmiş yeniden yazılmadı. 8123 v1 + 8124 v2 ayakta.

### 8.10 Boşluk düzeltmesi tamamlama (12.08.2026)

- **Sayfa JS düzeltmesi:** `bilgisayar-laboratuvari.js` → `setupHeroSection`, hero nesnesi yoksa `init`'i çağırmıyordu; artık `init(this.pageData.hero || null)` çağrılıyor. Böylece **hero nesnesi tamamen silinse bile** (enabled:false dışında) HeroManager gizli boşluğu render eder.
- hero.js `init`: hero verisi yoksa da global `hiddenSpacing` ile spacer bırakır.
- Global varsayılan `hiddenSpacing` artık **explicit 2** (2rem = 32px) — manager'da "Gizliyken Üst Boşluk" alanında görünür.
- Doğrulama: hero nesnesi silindi → spacer 32px render edildi ✓ · geri yüklendi → hero görünür, spacer yok ✓
- Özet mekanizma: hero gizliyken menü-altı boşluk = **"Gizliyken Üst Boşluk"** (rem) — sayfa veya global. 0 → içerik header'a yapışır, 2 → 32px, 4 → 64px.

### 8.11 Doğrulama düzeltmesi: boş sayı alanları (12.08.2026)

**Sorun:** Manager'da kaydetmede hata: `$.hero.boxPaddingTop: sayı olmalı` vb. — settings.json'daki boş string (`""`) değerler, şemadaki `number` tipi tarafından reddediliyordu.

**Yapılan:** `manager/validation.py` → `number` tipi için boş değer (`""` / `null`) artık "ayarlanmamış" kabul edilir (varsayılan kullanılır), hata değil. Dizi içindeki sayı öğeleri sıkı kalmaya devam eder.

**Doğrulama:** `/api/validate` — settings.json ve bilgisayar-laboratuvari.json → 200, 0 hata ✓. v2 yeniden başlatıldı.

### 8.12 Hero göster/gizle tutarlılığı (12.08.2026)

**Sorun:** Global "Hero'yu Göster" ile sayfadaki "Hero'yu Göster" birbirini eziyor gibi görünüyordu. Kök neden: sayfadaki alan **checkbox**'tı — boşken (yani "global kullan" anlamındayken) işaretsiz görünüyor, kullanıcı "kapalı" sanıyordu. İşaretleyince global'i geçersiz kılan sayfa değeri yazılıyor, global kapalı olsa bile hero açılıyordu.

**Yapılan:**
- Sayfa şemasında "Hero'yu Göster" **checkbox → 3 durumlu select**: `"" Global'i Kullan (settings.json)` / `"true" Göster` / `"false" Gizle`. Boş = global geçerli artık açıkça seçenek olarak görünüyor.
- hero.js `_resolveEnabled`: `""`/null → global (varsayılan true); `true/"true"` → açık; `false/"false"` → kapalı. Hem boolean hem string değerler çözülüyor.
- Global "Hero'yu Göster (Global)" ipucu netleştirildi: "Sitenin anahtarı — sayfa boş bırakılırsa bu geçerli; sayfa kendi seçimini yaparsa o sayfada geçersiz kılar."

**Semantik (doğrulandı):**
- Global kapalı + sayfa boş → hero gizli ✓
- Global açık + sayfa boş → hero görünür ✓
- Global kapalı + sayfa "Göster" → o sayfada görünür (sayfa kazanır) ✓
- Global açık + sayfa "Gizle" → o sayfada gizli (sayfa kazanır) ✓

**Not:** Önizleme oturumu da araya girebilir — manager'da kaydedilmemiş eski düzenleme sitede görünmeye devam eder; "Kaydet ve Commit Et" ile temizlenir. v2 yeniden başlatıldı.

### 8.13 Hero gizliyken TOC sayfalarında içerik menünün altına kaçıyordu (12.08.2026)

**Sorun:** Hero global kapatılınca TOC'lu sayfalarda (mendeley-referans-yonetim-araci, makale-islem-ucretleri) içerik sabit menünün (0-80px) **altına kayıyordu** — sayfa başlangıcı menünün arkasında kalıyordu. "hem üstten boşluk hem menü altına kaçma" hissinin sebebi buydu.

**Kök neden:** Çoğu sayfa `main.main-container` kullanır (CSS'te `margin-top: var(--header-height)` var → hero gizlense bile içerik menünün altında). Ama TOC sayfaları `div.page-container > main.main-content` yapısı kullanıyor ve bu yapıda **header offset margin'i yoktu** — offset'i hero'nun kendi margin'i sağlıyordu; hero gizlenince içerik yukarı fırlıyordu.

**Yapılan:** `assets/css/pages/mendeley-referans-yonetim-araci.css` ve `makale-islem-ucretleri.css` → `.page-container`'e `margin-top: var(--header-height)` eklendi (main-container ile aynı davranış).

**Doğrulama (canlı 8124, hero gizli):**
- mendeley: pageContainer 112px'te (menü altı), içerik 136px — örtüşme yok ✓
- makale: aynı ✓ · sss (arama): 32px boşluk, örtüşme yok ✓
- Hero açıkken TOC sayfaları artık diğer sayfalarla tutarlı: hero → içerik 80px boşluk ✓
- "Üstten boşluk" hissi = `Gizliyken Üst Boşluk` (varsayılan 2rem=32px) — istenirse 0 yapılabilir.

### 8.14 TOC üst kısmı menü arkasında + gizliyken boşluk (12.08.2026)

**Sorun:** (1) TOC'lu sayfalarda (mendeley, makale) TOC'nin üst kısmı görünmüyordu, (2) hero gizliyken menü ile içerik arasında fazla boşluk vardı (sss dahil).

**Kök nedenler:**
- **Desktop TOC sidebar** `position: fixed; top: 20px` ile yapışıyordu → 80px'lik sabit menünün ARKASINDA kalıyordu (başlık `<h3>` + ilk maddeler gizli).
- **Mobil TOC çekmecesi** `top: 0` → açılınca başlığı menünün arkasında.
- **Gizliyken Üst Boşluk** varsayılanı 2rem (32px) → menü ile içerik arasında görünen boşluk.

**Yapılan:**
- `hybrid-toc.css`: desktop sidebar varsayılan top → `calc(var(--header-height) + 20px)` (100px); mobil çekmece → `top: var(--header-height); height: calc(100vh - var(--header-height))`.
- `hybrid-toc.js`: iki pozisyonlayıcıdaki sticky `20px` → `calc(var(--header-height) + 20px)`; minimum `20` → `100`.
- `Gizliyken Üst Boşluk` varsayılanı **0** (global + CSS fallback) — içerik menünün hemen altından başlar; istenirse rem ile artırılır. Şema ipuçları güncellendi.

**Doğrulama (canlı 8124, hero gizli):**
- mendeley + makale: içerik 80px'te (menü altı, boşluk yok) ✓ · mobil çekmece 80'den açılıyor, başlık görünür ✓
- sss: içerik 80px'te ✓
- Desktop sidebar: kod seviyesinde doğrulandı (100px) — webview mobil genişlikte olduğundan masaüstünde görsel teyit kullanıcıdan.

### 8.15 Diğer sayfalarda hero üzerine bindirme margin'leri (12.08.2026)

**Sorun:** veritabanlari, arastirmaci-profili, uyelik-odunc, kime-sormaliyim sayfalarında da içerik menünün altına kaçıyordu.

**Kök neden:** Bu sayfalarda içerik, hero bandının ÜZERİNE çekilecek şekilde **negatif margin** kullanıyordu:
- `.databases-page .content-wrapper` → `margin-top: -5rem` (veritabanlari)
- `.search-section` (arama kutusu bileşeni — sss, kime-sormaliyim) → `margin-top: -3rem` (mobil -2rem)

Hero görünürken bu, "arama alanı hero'nun alt kısmına otursun" tasarımıydı. Hero GİZLİYKEN negatif margin içeriği sabit menünün ARKASINA (80px üstüne) çekiyordu.

**Yapılan:** `inner-pages.css` — hero gizliyken (`body:not(:has(.page-hero))`) bu negatif margin'ler 0'a çekiliyor:
```css
body:not(:has(.page-hero)) .search-section,
body:not(:has(.page-hero)) .databases-page .content-wrapper { margin-top: 0; }
```
Proje `:has()` kullanıyor (hybrid-toc + veritabanlari zaten), uyumlu.

**Doğrulama (canlı 8124, hero gizli):**
- veritabanlari: content-wrapper 112px (margin 0) ✓
- sss: search-section 80px (margin 0) ✓ · kime-sormaliyim: 80px ✓
- arastirmaci-profili + uyelik-odunc: içerik 80px, çekmece 80px ✓
- Tümü menünün altında, örtüşme yok ✓

### 8.16 Help Section — Hero ile aynı 3 katmanlı sistem (pilot: bilgisayar-laboratuvari)

**İstenen:** Help section'ın hero gibi gizle/göster + renk ayarlarıyla zenginleştirilmesi.

**Yapılan:**
- `helpsection.js` → 3 katmanlı çözüm: **global (settings.json → help) > sayfa (helpSection override) > CSS varsayılanı**
- Global bloğa eklendi: `enabled` + 5 renk (backgroundColor, borderColor, titleColor, textColor, iconColor) — boş = CSS varsayılanı
- Sayfa şemasına eklendi: **"Yardım Bölümünü Göster"** 3 durumlu select (Global'i Kullan / Göster / Gizle) + "Renkler" grubu (5 renk) + global link butonu ("⚙ Global Ayarları Aç")
- `bilgisayar-laboratuvari.js` düzeltildi: helpSection nesnesi silinse bile init çağrılıyor (hero'daki aynı hata)

**Doğrulanan kombinasyonlar (canlı 8124):**
| Global help | Sayfa | Sonuç |
|---|---|---|
| Açık | Boş | Görünür (CSS varsayılanı: mavi şerit #1F4C8A) ✓ |
| Açık | "Gizle" | Gizli (sayfa kazanır) ✓ |
| Kapalı | "Göster" | Görünür (sayfa kazanır) ✓ |
| — | Renkler (#123456, #ffcc00, #fff, #ffaa00) | Hepsi uygulandı ✓ |

**Not:** Hero'nun `enabled:false` ayarı (kullanıcı) duruyor; help global açık + sayfa boş → help görünüyor. Test verileri temizlendi.

### 8.17 Hero + Help Section — Tüm site genelinde zengin şema (32 sayfa)

**Yapılan:**
- Bilgisayar-laboratuvari'deki zengin hero şablonu (28 alan: enabled 3'lü select, layout, ikon/renk/boşluk/breadcrumb grupları) tüm sayfa şemalarına kopyalandı (32 sayfa)
- Aynı şekilde zengin helpSection şablonu (10 alan: enabled + 5 renk) — 5 sayfaya YENİDEN eklendi: egitim-programlari, ill, kutuphane-kullanim-klavuzu, sss, uyelik-odunc-islemleri
- Hariç tutulanlar: home, databases, anadolu-arastirma, component-showcase.old (özel yapılar)
- Veri tarafına dokunulmadı — boş alanlar = global/CSS varsayılanı (3 katmanlı sistem zaten çalışıyor)

**Doğrulama:**
- 36 sayfa /api/validate → 0 hata (tek istisna: organizasyon-semasi.json'da eski PDF sorunu — assets/documents/organizasyon-semasi.pdf yok, şema ile ilgisi yok)
- Şema API: sss/egitim/ill/mendeley'de hero 28 alan + help 10 alan ✓

**Bekleyen:** organizasyon-semasi PDF'i (kullanıcı yüklemeli) · SEO zenginleştirme (sonraki adım)

### 8.18 Çalışma Saatleri — Görsel Editör + 24 saat zorunlu

**Yapılan:**
- Manager'da saat girişleri artık 24 saat zorunlu (AM/PM yok): native input[type=time] yerine
  otomatik ":" ekleyen metin kontrolü ("830" → "08:30", "25:99" → "23:59", blur'da tamamlama)
- calisma-saatleri.json için **özel görsel editör** (schema.id="hours-editor"):
  - Resmi Tatiller kartı (scheduleConfig.holidays — tarih ekle/sil)
  - Her saat tablosu için kart: tablo başlığı TR/EN + satırlar
  - Her satır: ad TR/EN, ikon, programlar (gün rozetleri + Hafta İçi/Cmt/Paz ön ayarları,
    saat aralıkları + öğle arası için aralık ekle, 7/24 hızlı buton, "Kapalı" toggle)
  - Tatil istisnaları (tarih + açık checkbox)
  - Satır/program/istisna ekle-sil
- Değişiklikler canlı önizlemeye anında yansıyor (markDirty → preview)

**Doğrulama (canlı 8124):**
- Editör açıldı: 3 tablo, 14 satır, 36 program, 44 saat alanı, 7 tatil, native time input 0 ✓
- Saat girişi: "0730" → "07:30" ✓ · önizlemede anında göründü ("Pazartesi - Cuma 07:30 - 23:00 Açık") ✓
- Kaydet ve Commit Et → diske yazıldı ✓ (test değeri geri alındı, dosya orijinal formata döndü)
- Form/Ham JSON geçişi korundu (Ham JSON butonu aktif) ✓
