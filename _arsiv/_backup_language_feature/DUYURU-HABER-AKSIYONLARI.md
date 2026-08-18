# DUYURU VE HABER AKSİYON SİSTEMİ

**Oluşturma Tarihi:** 2025-11-12
**Versiyon:** 1.0
**Durum:** ✅ Aktif

---

## 📋 GENEL BAKIŞ

Anasayfadaki güncel haberler ve duyurular için esnek aksiyon sistemi. Artık her haber/duyuru için 3 farklı davranış tanımlayabilirsiniz:

1. **📄 Direkt Sayfa Aç** (`actionType: "page"`) - Belirli bir sayfa açılır
2. **🔲 Modal Aç** (`actionType: "modal"`) - Duyuru/haber detay modalı açılır
3. **🌐 Dış Link** (`actionType: "external"`) - Harici web sitesine gider

---

## 🎯 KULLANIM ÖRNEKLERİ

### 1. Direkt Sayfa Aç (Page)

**Kullanım Senaryosu:** Çalışma saatlerini duyurmak istiyorsunuz, kullanıcı tıkladığında direkt çalışma saatleri sayfasına gitsin.

```json
{
  "id": 2,
  "title": {
    "tr": "Yeni Çalışma Saatleri Duyurusu",
    "en": "New Opening Hours Announcement"
  },
  "summary": {
    "tr": "2024-2025 Güz Dönemi çalışma saatlerimiz güncellendi.",
    "en": "Our 2024-2025 Fall Semester opening hours have been updated."
  },
  "image": "assets/images/nopic.jpeg",
  "date": "2024-10-15",
  "category": "Genel Duyuru",
  "categoryColor": "#1F4C8A",
  "actionType": "page",
  "url": "calisma-saatleri.html",
  "featured": true
}
```

**Sonuç:** Tıklandığında → `calisma-saatleri.html` sayfası açılır

---

### 2. Modal Aç (Modal)

**Kullanım Senaryosu:** Sınav dönemi özel saatler duyurusu, detay bilgileri için modal açılsın.

```json
{
  "id": 3,
  "title": {
    "tr": "Sınav Dönemi Özel Çalışma Saatleri",
    "en": "Exam Period Special Opening Hours"
  },
  "summary": {
    "tr": "Ara sınav dönemi boyunca kütüphanemiz 24 saat açık kalacaktır.",
    "en": "Our library will be open 24 hours during the midterm exam period."
  },
  "content": {
    "tr": "Detaylı içerik... (Modal'da gösterilecek)",
    "en": "Detailed content... (Will be shown in modal)"
  },
  "image": "assets/images/nopic.jpeg",
  "date": "2024-10-10",
  "category": "Genel Duyuru",
  "categoryColor": "#1F4C8A",
  "actionType": "modal",
  "modalId": 3,
  "featured": true
}
```

**Sonuç:** Tıklandığında → `duyurular.html?id=3` → Modal açılır

---

### 3. Dış Link (External)

**Kullanım Senaryosu:** Yeni veritabanı erişimi açıldı, tıklandığında veritabanı sitesine gitsin.

```json
{
  "id": 1,
  "title": {
    "tr": "Yeni Veritabanı Erişimi Açıldı",
    "en": "New Database Access Opened"
  },
  "summary": {
    "tr": "Kütüphanemiz bünyesinde yeni akademik veritabanlarına erişim başlamıştır.",
    "en": "Access to new academic databases has been opened in our library."
  },
  "image": "assets/images/nopic.jpeg",
  "date": "2024-01-15",
  "category": "Veritabanları",
  "categoryColor": "#1F4C8A",
  "actionType": "external",
  "url": "https://library.anadolu.edu.tr/databases",
  "featured": true
}
```

**Sonuç:** Tıklandığında → Yeni sekmede dış link açılır

---

## 📁 ETKİLENEN DOSYALAR

### JSON Dosyaları
- ✅ `data/pages/guncel-haberler.json` - Haber item'larına `actionType` eklendi
- ✅ `data/pages/duyurular.json` - Duyuru item'larına `actionType` eklendi

### JavaScript Dosyaları
- ✅ `assets/js/pages/home.js` - `getActionUrl()` metodu eklendi
- ✅ `assets/js/components/announcements.js` - `getActionUrl()` metodu eklendi

---

## 🔧 TEKNİK DETAYLAR

### JSON Schema

```typescript
interface NewsItem {
  id: number;
  title: { tr: string; en: string };
  summary: { tr: string; en: string };
  content?: { tr: string; en: string };
  image: string;
  date: string;
  category: string;
  categoryColor: string;

  // YENİ: Aksiyon sistemi
  actionType?: "page" | "modal" | "external"; // Zorunlu değil, default: modal
  url?: string; // page ve external için gerekli
  modalId?: number; // modal için opsiyonel (varsayılan: id)

  featured: boolean;
}
```

### JavaScript Logic

```javascript
getActionUrl(item, basePage = 'duyurular.html') {
  // ActionType yoksa eski sistemi kullan (default: modal)
  if (!item.actionType) {
    return `${basePage}?id=${item.id}`;
  }

  switch (item.actionType) {
    case 'page':
      // Direkt sayfa linki
      return item.url || '#';

    case 'modal':
      // Modal açma linki
      return `${basePage}?id=${item.modalId || item.id}`;

    case 'external':
      // Dış link
      return item.url || '#';

    default:
      return `${basePage}?id=${item.id}`;
  }
}
```

### Target Attribute

```javascript
const actionTarget = item.actionType === 'external' ? '_blank' : '_self';
```

- **external**: Yeni sekmede açılır (`target="_blank"`)
- **page, modal**: Aynı sekmede açılır (`target="_self"`)

---

## ✅ AVANTAJLAR

1. **Esneklik**: Aynı listede farklı davranışlar
2. **Kullanıcı Deneyimi**: Her içerik için en uygun aksiyon
3. **Geriye Dönük Uyumluluk**: `actionType` yoksa default olarak modal açılır
4. **Dış Link Desteği**: Veritabanı, form, dış kaynak linkleri
5. **Modal ID Esnekliği**: Farklı modal ID kullanılabilir

---

## 📝 HIZLI REFERANS

### Page Action
```json
"actionType": "page",
"url": "calisma-saatleri.html"
```

### Modal Action
```json
"actionType": "modal",
"modalId": 3
```

### External Action
```json
"actionType": "external",
"url": "https://example.com"
```

### Default (ActionType yok)
```json
// actionType yok → modal açılır (id parametresi ile)
```

---

## 🧪 TEST SENARYOLARI

### Test 1: Page Action
1. Anasayfaya git
2. "Yeni Çalışma Saatleri" duyurusuna tıkla
3. ✅ `calisma-saatleri.html` sayfası açılmalı

### Test 2: Modal Action
1. Anasayfaya git
2. "Sınav Dönemi" duyurusuna tıkla
3. ✅ `duyurular.html?id=3` açılmalı
4. ✅ Modal otomatik açılmalı

### Test 3: External Action
1. Anasayfaya git
2. "Yeni Veritabanı" haberine tıkla
3. ✅ Yeni sekmede dış link açılmalı

### Test 4: Default (Eski Sistem)
1. actionType olmayan bir item ekle
2. Tıkla
3. ✅ Modal açılmalı (eski davranış)

---

## 🔄 GELECEK İYİLEŞTİRMELER

### Potansiyel Aksiyon Tipleri

```json
"actionType": "download" // Dosya indirme
"actionType": "video" // Video player açma
"actionType": "pdf" // PDF viewer açma
"actionType": "form" // Form sayfası açma
```

### Gelişmiş Parametreler

```json
{
  "actionType": "modal",
  "modalId": 3,
  "modalOptions": {
    "autoClose": true,
    "closeAfter": 5000,
    "showAgain": false
  }
}
```

---

## 🐛 SORUN GİDERME

### Sorun 1: Link Çalışmıyor
**Çözüm:** `url` alanını kontrol edin, boş veya geçersiz olabilir.

```json
// ❌ YANLIŞ
"url": ""

// ✅ DOĞRU
"url": "calisma-saatleri.html"
```

### Sorun 2: Modal Açılmıyor
**Çözüm:** `modalId` ID ile item'ın `id` alanı eşleşiyor mu kontrol edin.

```json
// Item ID: 3
"modalId": 3 // ✅ Doğru
"modalId": 5 // ❌ Yanlış (item bulunamaz)
```

### Sorun 3: Dış Link Yeni Sekmede Açılmıyor
**Çözüm:** `actionType: "external"` olmalı.

```json
// ❌ YANLIŞ
"actionType": "page",
"url": "https://example.com"

// ✅ DOĞRU
"actionType": "external",
"url": "https://example.com"
```

---

## 📊 MEVCUT KULLANIM İSTATİSTİKLERİ

### guncel-haberler.json
- **Total Items**: 8
- **page**: 2 (Çalışma Saatleri, Eğitim Programları)
- **modal**: 1 (Çalışma Saatleri Güncelleme)
- **external**: 1 (Yeni Veritabanı)
- **default**: 4 (Eski sistem)

### duyurular.json
- **Total Items**: 10
- **page**: 2 (Çalışma Saatleri, Çalışma Odaları)
- **modal**: 1 (Sınav Dönemi)
- **default**: 7 (Eski sistem)

---

## 🎓 BEST PRACTICES

### 1. ActionType Seçimi
- **page**: Sabit bilgiler (Çalışma saatleri, İletişim, Hakkımızda)
- **modal**: Geçici duyurular (Tatil, Sistem bakımı, Etkinlik)
- **external**: Dış kaynaklar (Veritabanları, Form linkleri)

### 2. URL Formatı
```json
// ✅ İç sayfa (page)
"url": "calisma-saatleri.html"

// ✅ Dış link (external)
"url": "https://library.anadolu.edu.tr/databases"

// ❌ Karışık kullanım
"actionType": "page",
"url": "https://example.com" // Dış link için external kullan
```

### 3. Modal ID
```json
// ✅ Aynı ID kullan (basit)
"id": 3,
"actionType": "modal",
"modalId": 3

// ✅ Farklı ID kullan (gelişmiş)
"id": 10,
"actionType": "modal",
"modalId": 3 // ID 3'ün içeriğini göster
```

---

## 📞 DESTEK

**Sorularınız için:**
- Bu dokümantasyonu referans alın
- Claude AI ile chat yapabilirsiniz
- Kod örnekleri: `home.js` ve `announcements.js` dosyalarına bakın

---

**📅 Son Güncelleme:** 2025-11-12
**✍️ Hazırlayan:** Claude AI
**📝 Versiyon:** 1.0
