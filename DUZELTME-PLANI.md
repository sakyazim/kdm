# HTML → Yapılandırılmış Veri Dönüşüm Planı

Tarih: 2026-08-14 · Durum: **plan + uygulama devam ediyor**
Amaç: JSON dosyalarındaki TÜM HTML'i temizle; manager'da richtext editör OLMAYACAK, yapılandırılmış veri olacak.

---

## 0. NEDEN

Kullanıcı: "bazı yerlerde html kodlar geliyor json düzenlerken... atlamışız sanırım... hepsini düzelt, html veya richtext olmasın, sırayla test ederek yap."

Analiz (SISTEM-ANALIZI.md §3): 14 dosyada **244 HTML alanı** (54.403 karakter):
- 218 INLINE (p, strong, a, br, i, em, code, span)
- 24 LISTE (ul/li)
- 2 TABLO
- sss.json'daki `component-*` desenleri HTML etiketi DEĞİL, `div`'in class'ı — site `ComponentRenderer`'ının ürettiği çıktının kopyası.

## 1. FORMAT KARARI (2 katman)

### Katman A — Metin alanları için "hafif işaretleme" (markdown alt kümesi)
HTML yerine JSON'da şu kalıplar kullanılır (HTML yok, manager'da textarea'da okunaklı):

| HTML | Yeni format |
|---|---|
| `<strong>x</strong>` / `<b>x</b>` | `**x**` |
| `<em>x</em>` / `<i>x</i>` (içerik amaçlı) | `*x*` |
| `<a href="u">x</a>` | `[x](u)` |
| `` `<code>x</code>` `` | `` `x` `` |
| `<br>` | `\n` (satır sonu) |
| `<p>x</p>` | paragraf bloğu |
| `<ul><li>x</li>...</ul>` | `- x` satırları |
| `<ol><li>x</li>...</ol>` | `1. x` satırları |
| tablo | `| hücre | hücre |` satırları + başlık ayracı |

Dönüştürücü: `Utils.mdToHtml(markdown)` — yalnızca bu kalıpları işler, gerisini escape eder (XSS güvenli).

### Katman B — Bileşen alanları (sss.json `answer`) için blok dizisi
Site `ComponentRenderer`'ı zaten anlıyor → HTML'i aynı formata geri çevir:

```json
"answer": {
  "tr": [
    { "type": "content", "data": { "content": "markdown metni" } },
    { "type": "alert", "variant": "info", "data": { "icon": "...", "title": "...", "content": "..." } },
    { "type": "info-box", "data": { "title": "...", "titleIcon": "...", "content": "..." } },
    { "type": "icon-list", "data": { "title": "...", "titleIcon": "...", "items": [{ "icon": "...", "title": "...", "description": "..." }] } },
    { "type": "table", "data": { "headers": [...], "rows": [{ "icon": "...", "cells": [...] }] } }
  ],
  "en": [ ... ]
}
```

Sitede render: `ComponentRenderer.renderMultiple(blocks)`.

## 2. SIRALI GÖREV LİSTESİ (test ederek ilerle)

- [x] Analiz tamamlandı (SISTEM-ANALIZI.md)
- [ ] **1. Altyapı — `Utils.mdToHtml`**: site render'ı için markdown→HTML dönüştürücü
- [ ] **2. sss.json dönüşümü** (en karmaşık: bileşen HTML'leri → blok dizisi) + `sss.js`/`faq.js` render güncellemesi
- [ ] **3. Basit içerik dosyaları** (iletisim, calisma-saatleri, mendeley, sure-uzatma, uyelik-odunc, kutuphane-kurallari, kutuphane-kullanim-klavuzu, arastirmaci-profili, egitim-programlari, uzaktan-erisim, ill) → markdown
- [ ] **4. Sızıntı temizliği**: accessibility `iconHtml` (sil), calisma-saatleri inline `style`, veritabanlari `resultsCount`
- [ ] **5. Site JS render noktaları**: `innerHTML`/`getLocalizedText` kullanan tüm noktalar → `mdToHtml`/`renderMultiple`
- [ ] **6. Manager**: richtext YOK; alan tipleri textarea (markdown) + blok dizisi olarak kalır; `_components`/şema güncelle
- [ ] **7. Final test**: tüm sayfalar önizlemede sırayla doğrulanır → kullanıcıya bildir

## 3. DOSYA BAZINDA HTML ALAN SAYISI

```
44  arastirmaci-profili-olusturma.json      (steps[].content, content, items[].text, warnings, infoBoxes)
36  sss.json                                (answer — BİLEŞEN: alert/info-box/icon-list/table)
30  kutuphane-kullanim-klavuzu.json
28  ill.json                                (steps[].content — ikonlu linkler)
22  sure-uzatma.json
20  kutuphane-kurallari.json
18  egitim-programlari.json
18  uzaktan-erisim.json
 8  uyelik-odunc-islemleri.json
 6  calisma-saatleri.json                   (inline style sızıntısı)
 6  iletisim.json
 4  mendeley-referans-yonetim-araci.json
 2  accessibility.json                      (iconHtml span — silinecek)
 2  veritabanlari.json                      (resultsCount <strong>)
```

## 4. RİSKLER / KURALLAR

1. **Veri kaybı yok**: `target="_blank"`, `class="external-link"`, `rel="noopener"` gibi link özellikleri mdToHtml'de karşılanır (tüm dış linkler `target="_blank" rel="noopener"` alır; mailto/tel normal).
2. **İkon korunur**: metin içindeki `<i class="...">` ikonları (örn. ill.json linkleri `bi bi-box-arrow-up-right`) → `[x](u) ↗` biçiminde metin işaretine çevrilir veya markdown linki korunur. (İkonun kendisi veride kalmaz; stil görevi renderer'da.)
3. **Güvenlik**: mdToHtml yalnızca bilinen kalıpları işler; `<script>` vb. escape edilir.
4. **Kesintiye karşı**: her dosya dönüşümünden önce `git` yedek (v1 tag mevcut); adım adım test.
5. **Bileşen formatı** (Katman B) yalnızca sss.json `answer` için; diğer alanlar Katman A (markdown).

## 5. KARAR BEKLEYENLER (bu turda yapılmayacak, sonra konuşulacak)

- Kategori tek kaynağı + manager'da select + "yeni kategori ekle" (Müzik/Referans eksikliği)
- `dergipark` çift kaydı (hangisi kalsın)
- Ölü dosyaların silinmesi (announcements.json, news.json, erisebilirlik.js ikizi, component-showcase.old, kök HTML kalıntıları)
- Manager'a sayfa→dosya haritası

---

## 6. İLERLEME DURUMU (güncellenir)

- [ ] Altyapı mdToHtml
- [ ] sss.json + sss.js/faq.js
- [ ] Diğer 12 içerik dosyası
- [ ] Sızıntı temizliği
- [ ] Site JS render noktaları
- [ ] Manager
- [ ] Final test + kullanıcıya bildir
