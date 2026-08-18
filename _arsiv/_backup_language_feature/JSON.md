# JSON YAPILANDIRMA DÜZELTMELERİ

**Tarih:** 2025-11-13
**Amaç:** Index.html sayfası için JSON yapısını düzeltmek ve HTML'deki hardcoded metinleri temizlemek

---

## 🔍 TESPİT EDİLEN HATALAR

### ❌ HATA 1: Yanlış Klasöre Dosya Oluşturuldu
- `d:\KDMWEB\d\data\pages\services.json` oluşturuldu (YANLIŞ!)
- `d:\KDMWEB\d\data\pages\arrivals.json` oluşturuldu (YANLIŞ!)

**DOĞRUSU:**
- `d:\KDMWEB\d\data\content\services.json` olmalıydı
- `d:\KDMWEB\d\data\content\arrivals.json` olmalıydı

### ❌ HATA 2: Her JSON Kendi Çevirilerini İçermeli
Şu anda `home.json` içinde `translations.arrivals` var:
```json
"arrivals": {
  "location": { "tr": "Yeri:", "en": "Location:" },
  "callNumber": { "tr": "Yer Numarası:", "en": "Call Number:" },
  "copy": { "tr": "Kopyala", "en": "Copy" }
}
```

**DOĞRUSU:** Bu çeviriler `arrivals.json` içinde olmalı!

### ❌ HATA 3: HTML'de Hardcoded Metinler Var
`index.html` içinde şu hardcoded metinler var:
- Section başlıkları (Güncel Haberler, Duyurular, Yeni Gelenler, vb.)
- Aria-label'lar
- Modal metinleri
- Button metinleri

**DOĞRUSU:** Tüm bu metinler JavaScript tarafından JSON'dan yüklenip inject edilmeli!

---

## 🎯 YAPILACAK DÜZELTMELER

### ADIM 1: Dosyaları Doğru Klasöre Taşı

#### 1.1. services.json'u taşı
```bash
# SİL (yanlış klasördeki dosya)
rm d:\KDMWEB\d\data\pages\services.json

# OLUŞTUR (doğru klasörde)
# Dosya: d:\KDMWEB\d\data\content\services.json
```

**YENİ services.json İçeriği:**
```json
{
  "title": {
    "tr": "Kütüphane Hizmetleri",
    "en": "Library Services"
  },
  "services": [
    {
      "id": "databases",
      "title": {
        "tr": "Veritabanları",
        "en": "Databases"
      },
      "description": {
        "tr": "Elektronik veritabanlarına erişim",
        "en": "Access to electronic databases"
      },
      "icon": "bi bi-database",
      "url": "veritabanlari.html",
      "active": true
    },
    {
      "id": "remote-access",
      "title": {
        "tr": "Uzaktan Erişim",
        "en": "Remote Access"
      },
      "description": {
        "tr": "Kampüs dışından e-kaynaklara erişim",
        "en": "Access to e-resources off-campus"
      },
      "icon": "bi bi-wifi",
      "url": "uzaktan-erisim.html",
      "active": true
    },
    {
      "id": "membership",
      "title": {
        "tr": "Üyelik",
        "en": "Membership"
      },
      "description": {
        "tr": "Kütüphane üyelik işlemleri",
        "en": "Library membership procedures"
      },
      "icon": "bi bi-person-badge",
      "url": "uyelik-odunc-islemleri.html",
      "active": true
    },
    {
      "id": "training",
      "title": {
        "tr": "Eğitimler",
        "en": "Training"
      },
      "description": {
        "tr": "Kütüphane eğitim programları",
        "en": "Library training programs"
      },
      "icon": "bi bi-mortarboard",
      "url": "egitim-programlari.html",
      "active": true
    },
    {
      "id": "ill",
      "title": {
        "tr": "Kütüphanelerarası İşbirlikleri",
        "en": "Interlibrary Loan"
      },
      "description": {
        "tr": "Kütüphanelerarası ödünç alma hizmeti",
        "en": "Interlibrary loan service"
      },
      "icon": "bi bi-arrow-left-right",
      "url": "ill.html",
      "active": true
    },
    {
      "id": "study-rooms",
      "title": {
        "tr": "Çalışma Odaları",
        "en": "Study Rooms"
      },
      "description": {
        "tr": "Grup çalışma odaları rezervasyonu",
        "en": "Group study room reservations"
      },
      "icon": "bi bi-door-open",
      "url": "calisma-odalari.html",
      "active": true
    },
    {
      "id": "computer-lab",
      "title": {
        "tr": "Bilgisayar Laboratuvarı",
        "en": "Computer Laboratory"
      },
      "description": {
        "tr": "Bilgisayar laboratuvarı hizmetleri",
        "en": "Computer laboratory services"
      },
      "icon": "bi bi-laptop",
      "url": "bilgisayar-laboratuvari.html",
      "active": true
    },
    {
      "id": "extension",
      "title": {
        "tr": "Süre Uzatma",
        "en": "Renewal"
      },
      "description": {
        "tr": "Ödünç aldığınız kaynakların süresini uzatın",
        "en": "Renew your borrowed materials"
      },
      "icon": "bi bi-arrow-clockwise",
      "url": "sure-uzatma.html",
      "active": true
    }
  ]
}
```

#### 1.2. arrivals.json'u taşı
```bash
# SİL (yanlış klasördeki dosya)
rm d:\KDMWEB\d\data\pages\arrivals.json

# OLUŞTUR (doğru klasörde)
# Dosya: d:\KDMWEB\d\data\content\arrivals.json
```

**YENİ arrivals.json İçeriği (çeviriler içinde!):**
```json
{
  "title": {
    "tr": "Yeni Gelenler",
    "en": "New Arrivals"
  },
  "translations": {
    "location": {
      "tr": "Yeri:",
      "en": "Location:"
    },
    "callNumber": {
      "tr": "Yer Numarası:",
      "en": "Call Number:"
    },
    "copy": {
      "tr": "Kopyala",
      "en": "Copy"
    }
  },
  "arrivals": [
    {
      "id": 1,
      "title": {
        "tr": "Yapay Zeka ve Makine Öğrenmesi",
        "en": "Artificial Intelligence and Machine Learning"
      },
      "author": {
        "tr": "John D. Kelleher",
        "en": "John D. Kelleher"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "006.3 K29y",
      "image": "assets/images/nopic.jpeg",
      "active": true
    },
    {
      "id": 2,
      "title": {
        "tr": "Veri Bilimi ve Analitik",
        "en": "Data Science and Analytics"
      },
      "author": {
        "tr": "Foster Provost",
        "en": "Foster Provost"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "658.4038 P96v",
      "image": "assets/images/nopic.jpeg",
      "active": true
    },
    {
      "id": 3,
      "title": {
        "tr": "Modern Web Geliştirme",
        "en": "Modern Web Development"
      },
      "author": {
        "tr": "Kyle Simpson",
        "en": "Kyle Simpson"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "005.133 S59m",
      "image": "assets/images/nopic.jpeg",
      "active": true
    },
    {
      "id": 4,
      "title": {
        "tr": "Blockchain Teknolojileri",
        "en": "Blockchain Technologies"
      },
      "author": {
        "tr": "Imran Bashir",
        "en": "Imran Bashir"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "005.824 B33b",
      "image": "assets/images/nopic.jpeg",
      "active": true
    },
    {
      "id": 5,
      "title": {
        "tr": "Bulut Bilişim ve AWS",
        "en": "Cloud Computing and AWS"
      },
      "author": {
        "tr": "Anthony Sequeira",
        "en": "Anthony Sequeira"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "004.678 S47b",
      "image": "assets/images/nopic.jpeg",
      "active": true
    },
    {
      "id": 6,
      "title": {
        "tr": "Python ile Veri Analizi",
        "en": "Data Analysis with Python"
      },
      "author": {
        "tr": "Wes McKinney",
        "en": "Wes McKinney"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "005.133 M15p",
      "image": "assets/images/nopic.jpeg",
      "active": true
    },
    {
      "id": 7,
      "title": {
        "tr": "Siber Güvenlik Temelleri",
        "en": "Cybersecurity Fundamentals"
      },
      "author": {
        "tr": "Charles J. Brooks",
        "en": "Charles J. Brooks"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "005.8 B79s",
      "image": "assets/images/nopic.jpeg",
      "active": true
    },
    {
      "id": 8,
      "title": {
        "tr": "Mobil Uygulama Geliştirme",
        "en": "Mobile Application Development"
      },
      "author": {
        "tr": "Neil Smyth",
        "en": "Neil Smyth"
      },
      "floor": {
        "tr": "3. Kat",
        "en": "3rd Floor"
      },
      "callNumber": "005.258 S66m",
      "image": "assets/images/nopic.jpeg",
      "active": true
    }
  ]
}
```

---

### ADIM 2: home.json'dan Gereksiz Çevirileri Kaldır

**Dosya:** `d:\KDMWEB\d\data\pages\home.json`

**KALDIRULACAK:**
```json
"arrivals": {
  "location": { "tr": "Yeri:", "en": "Location:" },
  "callNumber": { "tr": "Yer Numarası:", "en": "Call Number:" },
  "copy": { "tr": "Kopyala", "en": "Copy" }
}
```

**YENİ translations bölümü (sadece genel home sayfası için):**
```json
"translations": {
  "searchButton": {
    "tr": "Ara",
    "en": "Search"
  },
  "detailsButton": {
    "tr": "Detayları Gör",
    "en": "View Details"
  },
  "viewAll": {
    "tr": "Tümünü Gör",
    "en": "View All"
  },
  "copyNotification": {
    "tr": "Yer numarası kopyalandı!",
    "en": "Call number copied!"
  },
  "slider": {
    "prev": {
      "tr": "Önceki slide",
      "en": "Previous slide"
    },
    "next": {
      "tr": "Sonraki slide",
      "en": "Next slide"
    }
  },
  "mobileCollection": {
    "ariaLabel": {
      "tr": "Mobil Koleksiyon Seçimi",
      "en": "Mobile Collection Selection"
    }
  },
  "modal": {
    "close": {
      "tr": "Kapat",
      "en": "Close"
    },
    "detailButton": {
      "tr": "Detaylı Bilgi",
      "en": "Detailed Information"
    },
    "dontShowAgain": {
      "tr": "Bu duyuruyu tekrar gösterme",
      "en": "Don't show this announcement again"
    },
    "defaultTitle": {
      "tr": "Duyuru",
      "en": "Announcement"
    },
    "defaultDescription": {
      "tr": "Duyuru içeriği...",
      "en": "Announcement content..."
    }
  },
  "sections": {
    "newsAndAnnouncements": {
      "tr": "Haberler ve Duyurular",
      "en": "News and Announcements"
    }
  }
}
```

---

### ADIM 3: home.js'i Güncelle - arrivals çevirilerini arrivals.json'dan çek

**Dosya:** `d:\KDMWEB\d\assets\js\pages\home.js`

**DEĞİŞTİRİLECEK:**

**ESKİ KOD (satır ~621-624):**
```javascript
// Translations
const location = this.translations?.arrivals?.location || 'Location:';
const callNumber = this.translations?.arrivals?.callNumber || 'Call Number:';
const copy = this.translations?.arrivals?.copy || 'Copy';
```

**YENİ KOD:**
```javascript
// Translations (arrivals.json'dan gelecek)
const arrivalsTranslations = this.data.arrivalsData?.translations;
const location = Utils.getLocalizedText(arrivalsTranslations?.location) || 'Location:';
const callNumber = Utils.getLocalizedText(arrivalsTranslations?.callNumber) || 'Call Number:';
const copy = Utils.getLocalizedText(arrivalsTranslations?.copy) || 'Copy';
```

---

### ADIM 4: index.html'i Temizle - Tüm Hardcoded Metinleri Kaldır

**Dosya:** `d:\KDMWEB\d\index.html`

#### 4.1. Section Başlıklarını Boşalt (JS dolduracak)

**ESKİ KOD (satır 77):**
```html
<h2 id="services-title" class="visually-hidden">Kütüphane Hizmetleri</h2>
```

**YENİ KOD:**
```html
<h2 id="services-title" class="visually-hidden"></h2>
```

---

**ESKİ KOD (satır 85):**
```html
<h2 id="news-announcements-title" class="visually-hidden">Haberler ve Duyurular</h2>
```

**YENİ KOD:**
```html
<h2 id="news-announcements-title" class="visually-hidden"></h2>
```

---

**ESKİ KOD (satır 91):**
```html
<h3 class="section-title" style="margin: 0;">Güncel Haberler</h3>
```

**YENİ KOD:**
```html
<h3 class="section-title" style="margin: 0;"></h3>
```

---

**ESKİ KOD (satır 93-97):**
```html
<button type="button" class="control-btn prev-btn" aria-label="Önceki slide">
  <i class="bi bi-chevron-left"></i>
</button>
<button type="button" class="control-btn next-btn" aria-label="Sonraki slide">
  <i class="bi bi-chevron-right"></i>
</button>
```

**YENİ KOD:**
```html
<button type="button" class="control-btn prev-btn" aria-label="">
  <i class="bi bi-chevron-left"></i>
</button>
<button type="button" class="control-btn next-btn" aria-label="">
  <i class="bi bi-chevron-right"></i>
</button>
```

---

**ESKİ KOD (satır 108):**
```html
<a href="guncel-haberler.html" class="view-all-link slider-view-all">
  Tümünü Gör
  <i class="bi bi-arrow-right"></i>
</a>
```

**YENİ KOD:**
```html
<a href="guncel-haberler.html" class="view-all-link slider-view-all">
  <span class="view-all-text"></span>
  <i class="bi bi-arrow-right"></i>
</a>
```

---

**ESKİ KOD (satır 117):**
```html
<h3 class="section-title" style="margin: 0;">Duyurular</h3>
```

**YENİ KOD:**
```html
<h3 class="section-title" style="margin: 0;"></h3>
```

---

**ESKİ KOD (satır 122-125):**
```html
<a href="duyurular.html" class="view-all-link slider-view-all">
  Tümünü Gör
  <i class="bi bi-arrow-right"></i>
</a>
```

**YENİ KOD:**
```html
<a href="duyurular.html" class="view-all-link slider-view-all">
  <span class="view-all-text"></span>
  <i class="bi bi-arrow-right"></i>
</a>
```

---

**ESKİ KOD (satır 135):**
```html
<h3 id="arrivals-title" class="section-title title-large">Yeni Gelenler</h3>
```

**YENİ KOD:**
```html
<h3 id="arrivals-title" class="section-title title-large"></h3>
```

---

**ESKİ KOD (satır 57):**
```html
<select id="mobile-collection-selector" class="custom-select ps-5" aria-label="Mobil Koleksiyon Seçimi"></select>
```

**YENİ KOD:**
```html
<select id="mobile-collection-selector" class="custom-select ps-5" aria-label=""></select>
```

---

#### 4.2. Modal Metinlerini Boşalt

**ESKİ KOD (satır 152):**
```html
<button type="button" class="modal-close" data-close-modal aria-label="Kapat">
```

**YENİ KOD:**
```html
<button type="button" class="modal-close" data-close-modal aria-label="">
```

---

**ESKİ KOD (satır 157):**
```html
<h2 class="modal-title" id="modalTitle">Modal Başlık</h2>
```

**YENİ KOD:**
```html
<h2 class="modal-title" id="modalTitle"></h2>
```

---

**ESKİ KOD (satır 167):**
```html
<p class="modal-description" id="modalDescription">Modal açıklaması...</p>
```

**YENİ KOD:**
```html
<p class="modal-description" id="modalDescription"></p>
```

---

**ESKİ KOD (satır 171):**
```html
<a href="#" class="modal-button" id="modalButton">Detaylı Bilgi</a>
```

**YENİ KOD:**
```html
<a href="#" class="modal-button" id="modalButton"></a>
```

---

**ESKİ KOD (satır 174):**
```html
<span>Bu duyuruyu tekrar gösterme</span>
```

**YENİ KOD:**
```html
<span class="modal-dont-show-text"></span>
```

---

#### 4.3. Copy Notification Boşalt

**ESKİ KOD (satır 190):**
```html
<span>Yer numarası kopyalandı!</span>
```

**YENİ KOD:**
```html
<span class="copy-notification-text"></span>
```

---

### ADIM 5: home.js'te updateViewAllLinks Fonksiyonunu Güncelle

**Dosya:** `d:\KDMWEB\d\assets\js\pages\home.js`

**ESKİ KOD (satır 69-79):**
```javascript
updateViewAllLinks() {
  const viewAllText = this.translations?.viewAll || 'View All';
  const viewAllLinks = document.querySelectorAll('.view-all-link');

  viewAllLinks.forEach(link => {
    const textNode = Array.from(link.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = viewAllText;
    }
  });
}
```

**YENİ KOD:**
```javascript
updateViewAllLinks() {
  const viewAllText = this.translations?.viewAll || 'View All';
  const viewAllTextElements = document.querySelectorAll('.view-all-text');

  viewAllTextElements.forEach(element => {
    element.textContent = viewAllText;
  });
}
```

---

### ADIM 6: home.js'te updateSectionTitles Fonksiyonunu Güncelle

**Dosya:** `d:\KDMWEB\d\assets\js\pages\home.js`

**EKLENECEK (satır ~145-151 sonrasına):**
```javascript
// Haberler ve Duyurular section başlığını güncelle
const newsAnnouncementsTitle = document.querySelector('#news-announcements-title');
if (newsAnnouncementsTitle && this.translations?.sections?.newsAndAnnouncements) {
  newsAnnouncementsTitle.textContent = Utils.getLocalizedText(this.translations.sections.newsAndAnnouncements);
}
```

---

### ADIM 7: home.js'te updateModalTranslations Fonksiyonunu Güncelle

**Dosya:** `d:\KDMWEB\d\assets\js\pages\home.js`

**GÜNCELLENECEK (satır 188-192):**

**ESKİ KOD:**
```javascript
// Modal title (default değer)
const modalTitle = document.querySelector('#modalTitle');
if (modalTitle && modalTitle.textContent === 'Modal Başlık') {
  modalTitle.textContent = Utils.getLocalizedText(this.translations.modal.defaultTitle);
}
```

**YENİ KOD:**
```javascript
// Modal title (varsayılan değer - her zaman güncelle)
const modalTitle = document.querySelector('#modalTitle');
if (modalTitle && !modalTitle.textContent.trim()) {
  modalTitle.textContent = Utils.getLocalizedText(this.translations.modal.defaultTitle);
}
```

**AYNISI İÇİN (satır 195-199, 201-205):**

---

### ADIM 8: home.js'te updateCopyNotificationTranslation Fonksiyonunu Güncelle

**Dosya:** `d:\KDMWEB\d\assets\js\pages\home.js`

**ESKİ KOD (satır 216-220):**
```javascript
updateCopyNotificationTranslation() {
  const notification = document.querySelector('#copy-notification span');
  if (notification && this.translations?.copyNotification) {
    notification.textContent = Utils.getLocalizedText(this.translations.copyNotification);
  }
}
```

**YENİ KOD:**
```javascript
updateCopyNotificationTranslation() {
  const notification = document.querySelector('.copy-notification-text');
  if (notification && this.translations?.copyNotification) {
    notification.textContent = Utils.getLocalizedText(this.translations.copyNotification);
  }
}
```

---

### ADIM 9: Modal Don't Show Again Label Güncelle

**Dosya:** `d:\KDMWEB\d\assets\js\pages\home.js`

**GÜNCELLENECEK (satır 207-210):**

**ESKİ KOD:**
```javascript
// Don't show again checkbox
const dontShowLabel = document.querySelector('#autoModal .modal-checkbox span');
if (dontShowLabel) {
  dontShowLabel.textContent = Utils.getLocalizedText(this.translations.modal.dontShowAgain);
}
```

**YENİ KOD:**
```javascript
// Don't show again checkbox
const dontShowLabel = document.querySelector('.modal-dont-show-text');
if (dontShowLabel) {
  dontShowLabel.textContent = Utils.getLocalizedText(this.translations.modal.dontShowAgain);
}
```

---

## 📋 ÖZET: YAPILACAKLAR LİSTESİ

### Dosya İşlemleri:
1. ✅ **SİL:** `d:\KDMWEB\d\data\pages\services.json`
2. ✅ **SİL:** `d:\KDMWEB\d\data\pages\arrivals.json`
3. ✅ **OLUŞTUR:** `d:\KDMWEB\d\data\content\services.json` (yukarıdaki içerikle)
4. ✅ **OLUŞTUR:** `d:\KDMWEB\d\data\content\arrivals.json` (yukarıdaki içerikle - translations dahil!)

### JSON Güncellemeleri:
5. ✅ **GÜNCELLE:** `d:\KDMWEB\d\data\pages\home.json` - arrivals çevirilerini kaldır, sections.newsAndAnnouncements ekle

### HTML Güncellemeleri:
6. ✅ **GÜNCELLE:** `d:\KDMWEB\d\index.html` - Tüm hardcoded metinleri boşalt (17 yer)

### JavaScript Güncellemeleri:
7. ✅ **GÜNCELLE:** `d:\KDMWEB\d\assets\js\pages\home.js` - loadArrivals fonksiyonu (arrivals translations)
8. ✅ **GÜNCELLE:** `d:\KDMWEB\d\assets\js\pages\home.js` - updateViewAllLinks fonksiyonu
9. ✅ **GÜNCELLE:** `d:\KDMWEB\d\assets\js\pages\home.js` - updateSectionTitles fonksiyonu (newsAndAnnouncements)
10. ✅ **GÜNCELLE:** `d:\KDMWEB\d\assets\js\pages\home.js` - updateModalTranslations fonksiyonu (selector değişiklikleri)
11. ✅ **GÜNCELLE:** `d:\KDMWEB\d\assets\js\pages\home.js` - updateCopyNotificationTranslation fonksiyonu (selector değişikliği)

---

## 🎯 SONUÇ

Bu değişiklikler sonrasında:
- ✅ Her JSON kendi çevirilerini içerecek (arrivals.json kendi translations'ını barındıracak)
- ✅ home.json sadece genel home sayfası ayarlarını içerecek
- ✅ index.html tamamen temiz olacak - hiç hardcoded metin kalmayacak
- ✅ Tüm metinler JavaScript tarafından JSON'dan inject edilecek
- ✅ Dil değiştiğinde tüm metinler otomatik güncellenecek
- ✅ Diğer sayfalardaki standarda uygun olacak

---

## ⚠️ UYGULAMA KOMUTU

Bu dosyayı oluşturduktan sonra şu komutu verin:
```
"json.md'yi uygula"
```

Claude tüm değişiklikleri otomatik olarak uygulayacaktır.
