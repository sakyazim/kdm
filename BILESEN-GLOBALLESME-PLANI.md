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
- **`search-with-controls`**: veride 2 kullanım (`duyurular`, `guncel-haberler`), **jenerik renderer'ı yok** (yalnız sayfa-özel JS'te işleniyor). Diğer sayfaya eklenirse boş kalır.
- **4 boş alert** (`sure-uzatma` ×2, `uzaktan-erisim` ×2): `data`'sız, `variant`'sız → `component-alert undefined` class'ı basar.
- **2 varyantsız heading** (`data/pages/test.json`): `renderHeading` `''` döner → site görünmez.
- **heading şemasında `variant` select yok** → editörde başlık stilini değiştirmek imkânsız (şu an sadece wizard varsayılan atıyor).
- **Ölü renderer case'leri** (registry'de yok ama kodda var): `custom-html`, `image`, `news-display`, `ordered-list`, `paragraph`, `search`, `unordered-list`, `video` → kaldır veya belgele.
- **`status-badge`** ayrı bileşen olarak hiç kullanılmıyor (0); sadece heading içindeki gömülü alan çalışıyor.
- **Bölüm şemasında `className`/`layout` alanı yok** ama renderer `section.className`'i zaten okuyor → düzenlenebilir yapılmalı.
- Eski wizard bileşenlerinde `id` çoğunlukla yok → çapa/ID özellikleri kullanılamıyor.

### 2.2 Bileşene dönüştürülebilir legacy içerik
| Sayfa & yapı | Mevcut | Önerilen bileşen | Zorluk |
|---|---|---|---|
| `kime-sormaliyim` → `departments` (5) | bölüm + temas + iletişim | `staff-list` + `contact-box`/`info-box` | düşük |
| `koleksiyon-kat-plani` → `floors` (5) | kat → bölüm → detay | `collapsible-section` + `info-box`/`table` | düşük |
| `mendeley` → `sections` (6) | `info-card`, `features` | `content` + `icon-list-grid` + `info-box` | düşük |
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
- [ ] `heading` şemasına `variant` select (`single-icon`/`single-plain`/`double-icon`/`double-plain`) + editör/wizard uyumu
- [ ] Boş alert'lerin temizliği (`sure-uzatma`, `uzaktan-erisim`) — kaldır veya veri doldur
- [ ] `search-with-controls` jenerik renderer'ı (veya sayfa-özel kodu registry'ye kazandır)
- [ ] Ölü case'lerin kararı: kaldır veya belgele (`custom-html`, `image`, `news-display`, `paragraph`, `search`, `unordered-list`, `video`)
- [ ] `status-badge` standalone kararı (kullan kaldır veya sadece heading içinde tut)
- [ ] Bölüm şemasına `className` + `layout` alanı
- [ ] ✅ Doğrulama: `validation.py` 0 hata + render smoke test

### AŞAMA 2 — test.json kararları
- [ ] 2 varyantsız heading → `single-icon`
- [ ] `statusBadge` auto/manual düzeltmesi (varsa)
- [ ] ✅ Doğrulama: sayfa tarayıcıda görünüyor + rozet doğru

### AŞAMA 3 — Legacy Dönüşüm (pilottan genişe, teker teker)
- [ ] **Pilot:** `kime-sormaliyim.departments` → `staff-list`/`contact-box` + test
- [ ] `koleksiyon-kat-plani.floors` → `collapsible-section`/`info-box` + test
- [ ] `mendeley.sections` → `content`/`icon-list-grid`/`info-box` + test
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