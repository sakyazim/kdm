# Bileşen Globalleştirme Planı

> Amaç: Sitedeki tüm içeriği tek bir yönetilen bileşen sistemine bağlamak — **yapı global, sadece veri farklı**. Kısayol değil; her adım doğrulanarak ilerlenir.

---

## 1. Konuşulan Kararlar (Özet)

| Karar | Sonuç |
|---|---|
| Globalleştirme sırası | Önce bileşen sistemini tek kaynak yap → sonra legacy sayfaları çevir → sonra yeni sayfalar/önizleme |
| 1. Adım tavsiyesi | Küçük pilot: `kime-sormaliyim`, `koleksiyon-kat-plani`, `mendeley` ile kalıp oturt, sonra genişlet |
| Önizleme | Bileşen seçiciye **gerçek renderer + örnek veri** ile mini önizleme (+ varyant önizleme) eklenecek |
| Veri kaybı önlemi | Her dönüşümde: `validation.py` + `node --check` + tarayıcı render + id/bağlantı korunum kontrolü |
| Yedek | Tam offline yedek + (önerilen) git/GitHub yedeği — her aşama öncesi taze checkpoint |

---

## 2. Analiz Bulguları (2026-08-19)

### 2.1 Bileşen sorunları
- **`search-with-controls`**: veride 2 kullanım (`duyurular`, `guncel-haberler`), **jenerik renderer'ı yoktu** (yalnız sayfa-özel JS'te işleniyor). ✅ 2026-08-19 jenerik `renderSearchWithControls` eklendi.
- **Variant'sız alert'ler** (`sure-uzatma` ×2, `uzaktan-erisim` ×2): boş değiller — `component.variant` yerine **`data.style`** renk bilgisi taşıyorlar (legacy kalıntısı) ve renderer onu yok sayıyordu. ✅ Renderer artık `variant || data.style || 'default'` okuyor; `default` CSS eklendi. Kaldırma gereksiz çıktı.
- **2 varyantsız heading** (`data/pages/test.json`): ✅ renderer artık `variant || 'single-icon'` fallback'i ile boş kalmıyor (AŞAMA 2'de veri de temizlenecek).
- **heading şemasında `variant` select yoktu** → ✅ `variants` meta bilgisi eklendi (heading/alert/icon-list) + editöre Varyant seçici.
- **Ölü renderer case'leri** (registry'de yok ama kodda var): `custom-html`, `news-display`, `search` → **karar: kod korunur** (escape hatch + yeni sayfa adayı), durum belgelemesi MD'de tutulur. `paragraph/ordered-list/unordered-list/image/video` ölü değil — `collapsible-section` içerik blokları.
- **`status-badge`** ayrı bileşen olarak hiç kullanılmıyor (0) → **karar: registry'de kalsın + belgelensin** (heading içindeki gömülü alan çalışıyor).
- **Bölüm şemasında `className`/`layout` alanı yoktu** → ✅ server.py kalıbına + 24 sayfa şemasına `layout` select + `className` eklendi; `inner.js` + 15 sayfa JS `section-card-body` layout sınıfı basıyor; CSS utility'leri eklendi.
- Eski wizard bileşenlerinde `id` çoğunlukla yok → çapa/ID özellikleri kullanılamıyor (devam: kademeli).

### 2.2 Bileşene dönüştürülebilir legacy içerik
| Sayfa & yapı | Mevcut | Önerilen bileşen | Zorluk |
|---|---|---|---|
| `kime-sormaliyim` → `departments` (5) ✅ | bölüm + temas + iletişim | **`heading double-icon` + `icon-list` + `heading double-plain` + `contact-buttons`** (2026-08-19 pilot) | düşük |
| `koleksiyon-kat-plani` → `floors` (5) ✅ | kat → bölüm → detay | **`content` + `collapsible-section`** (+ `content` paragraf) — saf içerik sayfası, interaktif nav kaldırıldı | düşük |
| `mendeley` → `sections` (6) ✅ | `info-card`, `features` | **`content` + `icon-list` + `info-box` + `step-cards` + `alert` + `resource-links` + `contact-buttons`** (2026-08-19 pilot) | düşük |
| `arastirmaci-profili` → `quickNav` | floating hızlı erişim | `resource-links` / `link-cards` | orta |
| `makale` → `generalInfo` | metin bloğu | `content` / `info-box` | düşük |
| `makale` → `publishers` (6) | zengin yayıncı kartı | `icon-list-grid` + `info-box`; yeni bileşen gerekebilir | yüksek |
| `home` → `sections` (5) | `dataSource`'lu dinamik bloklar | bileşen değil; dinamik veri kartı / `news-display` adayı | yüksek |

### 2.3 Yerleşim (rows / flex / cell)
- Genel yerleşim kavramı yok; düzen her bileşenin içinde (`icon-list-grid` → `grid-cols-N`+`gap-*`, `stat-cards` → `stats-grid`).
- Tek istisna: `contact-buttons` → `data.layout/gap/justify` (inline `display:flex|grid`).
- **Renderer kancası hazır**: `inner.js` → `section.className` → `section-card ${sectionClass}`; şemada alan yok.
- Yapılacak: şemaya `layout` select (`row`/`column`/`cell`/`grid-2`/`grid-3`) + `className`, renderer'a sınıf basma, birkaç responsive utility CSS, editör+wizard'a seçici.

---

## 3. Yapılacaklar (Sıralı + Testli)

### AŞAMA 0 — Zemin (güvence)
- [ ] Tam offline yedek alındı: `D:\KDM\e_yedek_20260819_1953` (49 MB, `.git` dahil) ✅
- [ ] Git/GitHub yedeği: remote yok → özel repo oluştur + ilk commit/push (secrets taraması ile)

### AŞAMA 1 — Bileşen Sistemi Sertleştirme
- [x] `heading`/`alert`/`icon-list` şemalarına `variants` meta bilgisi + editörde Varyant seçici (2026-08-19)
- [x] Renderer fallback'leri: `heading` → `single-icon`, `alert` → `variant || data.style || 'default'` + `default` CSS
- [x] `search-with-controls` jenerik renderer'ı (2026-08-19)
- [x] Ölü case'ler kararı: `custom-html`, `news-display`, `search` korunur + belgelendi; `paragraph/...` = collapsible iç blok
- [x] `status-badge` kararı: registry'de kalır, bağımsız kullanım 0 (belgelendi)
- [x] Bölüm şeması: `layout` select + `className` (server.py kalıbı + 24 sayfa şeması + inner.js + 15 sayfa JS + CSS)
- [ ] ✅ Doğrulama: `validation.py` 0 hata + render smoke test

### AŞAMA 2 — test.json kararları
- [x] 2 varyantsız heading → `single-icon` (2026-08-19)
- [x] `statusBadge`'ler kaldırıldı (auto+hours'suz → her daim kırmızı "kapalı" çipi basıyordu; manuel olmadığına göre en temizi kaldırmak)
- [x] idsiz 3. bölüme `id: "ek-bolum"` eklendi
- [x] ✅ Doğrulama: JSON valid + validation 0 yeni hata

### AŞAMA 3 — Legacy Dönüşüm (pilottan genişe, teker teker)
- [x] **Pilot:** `kime-sormaliyim.departments` → `heading double-icon` + `icon-list` (konular) + `heading double-plain` + `contact-buttons` (2026-08-19)
  - Şema: `departments`/`labels` kaldırıldı → standart `content` (sections/components) eklendi; `searchSection.icon` çift anahtar → `clearButtonIcon` düzeltildi
  - `_components.json`: `icon-list`'e `title` + `titleIcon` alanları eklendi (renderer zaten destekliyordu, şema eksikti)
  - `ComponentRenderer`: `buildSectionCard`/`buildSectionCards` eklendi; `inner.js` ile ortak kullanılıyor (%100 aynı section-card kalıbı)
  - Hata düzeltmesi: bölümde **birden fazla heading** varsa renderer son heading'i bölüm başlığı yapıyor, ilkini yutuyordu → yalnızca ilk heading başlık, geri kalanlar gövdeye
  - Ölü CSS temizliği: `.topics-*`, `.topic-*`, `.variant-kime-sormaliyim`, `.contact-section/.contact-title` kaldırıldı; `.contact-item/.contact-info/.btn-contact` korundu (makale/arastirmaci kullanıyor)
  - Arama filtresi `card.textContent` üzerinden çalışıyor (başlık+konular+iletişim aranır)
  - ✅ Doğrulama: node --check temiz, validation 0 yeni hata (mevcut 5 var), node render smoke test OK
- [x] `koleksiyon-kat-plani.floors` → `content` + `collapsible-section` (2026-08-19)
  - Karar: **saf içerik sayfası** — interaktif sol kat navigasyonu kaldırıldı; 5 kat → 5 içerik section'ı (heading double-icon + content paragraf + 32 collapsible-section, expanded=true)
  - Şema: `floors` alanı → standart `content`; `FloorPlanManager` (özel JS) + özel sayfa CSS'i silindi, HTML temizlendi, `InnerPage` standard render kullanıyor
  - `inner.js` legacy kontrol listesinden `departments`/`floors` çıkarıldı (artık hiçbir sayfada yok)
  - ✅ Doğrulama: node --check temiz, validation 0 yeni hata, render smoke test (32 collapsible, id çakışması yok)
- [x] `mendeley.sections` → `content`/`icon-list`/`info-box`/`step-cards`/`alert`/`resource-links`/`contact-buttons` (2026-08-19)
  - 6 info-card section → 6 standart `content` section; eşleme: lead/text→`content`, features→`icon-list`, infoBoxes→`info-box`, steps→`step-cards` (defaultOpen), cta→heading `single-icon`+`content`+`contact-buttons`, warnings→`alert` warning, benefits→`icon-list` (check), resources→`resource-links`; `toc` + hero `showIcon` korundu
  - Şema: özel `sections` (info-card) alanı → standart `content` (hierarchy sections + components registry); `toc` üst seviye kaldı
  - `_components.json` + renderer: `resource-links` bileşenine `disabled`/`note`/`alert` alanları; `contact-buttons` buton metni `Utils.getLocalizedText` ile dil desteği; paylaşılan `component-resource-links` CSS `inner-page-components.css`'e eklendi (organizasyon-semasi de kazanıyor)
  - Özel sayfa JS 385 satırdan 62 satıra: `renderFeatures/InfoBoxes/Steps/CTA/Warnings/Benefits/Resources` deterministik renderer'ları silindi → `ComponentRenderer.buildSectionCards`; 472 satır bespoke sayfa CSS'i silindi (`.page-container`/`.main-content` düzeni `hybrid-toc.css`'ten geliyor)
  - ✅ Doğrulama: node --check temiz, validation 0 yeni hata, render smoke test (6 TOC anchor = 6 section id, çakışma yok, tüm bileşenler render, disabled/note çalışıyor)
- [ ] `makale-islem-ucretleri` (`generalInfo` + `publishers`) + test
- [ ] `arastirmaci-profili.quickNav` → `resource-links`/`link-cards` + test
- [ ] `home.sections` dinamik blok kararı + test
- [ ] ✅ Her sayfa için: JSON validation + node --check + tarayıcı render + id/bağlantı korunumu

### AŞAMA 4 — Önizleme
- [ ] Picker'da gerçek renderer + örnek veri ile mini önizleme, varyant seçimi ile canlı güncelleme

### AŞAMA 5 — Yeni Sayfa Üretimi
- [ ] Wizard: section `layout` seçimi (rows/flex/cell) + `className`
- [ ] Yeni örnek sayfa üret + test (bilgisayar-laboratuvari kalıbı gibi)
- [ ] ✅ Tüm site validation + smoke test + tarayıcı kontrolü

---

## 4. Her Adımda Test Şablonu
1. JSON şema/validation: `python manager/../validation.py` (0 hata hedefi)
2. JS sözdizimi: `node --check <dosya>`
3. Tarayıcı: ilgili sayfayı `localhost:8123` üzerinden render et + konsolu izle
4. Veri kaybı: id/bağlantı/count kontrolleri (script: yedek ile fark diff)
5. Commit/checkpoint: her AŞAMA sonunda (git) + offline yedek

---

## 5. Yedek Stratejisi
- **Offline:** `D:\KDM\e_yedek_YYYYMMDD_HHMM` — AŞAMA 0 alındı; her aşama başında yenilenmeli.
- **Git/GitHub (önerilen):** projede remote yok → özel repo + ilk commit/push şart. Avantaj: aşama aşama rollback, uzak kopya (disk arızasına karşı). Tek risk: repo'ya `node_modules`/yedek klasörleri girmemeli; `.gitignore` kontrolü.