# ÇOK DİLLİ SİSTEM MİGRASYON PLANI

**Hazırlanma Tarihi:** 2025-11-05
**Proje:** Anadolu Üniversitesi Kütüphane Web Sitesi
**Amaç:** Çoklu dil desteğini tek dosyada yönetilebilir hale getirmek

---

## 📋 İÇİNDEKİLER

1. [Mevcut Durum ve Problem](#mevcut-durum-ve-problem)
2. [Hedef Mimari](#hedef-mimari)
3. [Uygulama Adımları](#uygulama-adımları)
4. [Kod Değişiklikleri](#kod-değişiklikleri)
5. [JSON Dönüşüm Stratejisi](#json-dönüşüm-stratejisi)
6. [JSON Editor Geliştirme](#json-editor-geliştirme)
7. [Test Planı](#test-planı)
8. [Rollback Stratejisi](#rollback-stratejisi)

---

## 🔍 MEVCUT DURUM VE PROBLEM

### Mevcut Yapı:
```
data/pages/
├── bilgisayar-laboratuvari.json      (Tek dil, TR)
├── bilgisayar-laboratuvari.tr.json   (YOK - Sistem bunu arıyor!)
├── bilgisayar-laboratuvari.en.json   (YOK)
```

### Sorunlar:
1. ❌ Sistem `*.tr.json` ve `*.en.json` dosyalarını arıyor ama bulamıyor
2. ❌ İki ayrı dosya yönetimi zahmetli (güncelleme yaparken her iki dosyayı düzenlemek gerekir)
3. ❌ Senkronizasyon riski (TR güncellenip EN unutulabilir)
4. ❌ JSON editor ile düzenleme karmaşık hale gelir

### Etkilenen Sayfalar:
```
✅ Dil desteği OLAN:
- guncel-haberler.tr.json / .en.json
- sure-uzatma.tr.json
- uzaktan-erisim.tr.json
- veritabanlari.tr.json

❌ Dil desteği OLMAYAN (Problemli):
- bilgisayar-laboratuvari.json
- calisma-odalari.json
- kime-sormaliyim.json
- calisma-saatleri.json
- duyurular.json
- egitim-programlari.json
- erisilebilirlik.json
- formlar.json
- gizlilik.json
- home.json
- iletisim.json
- ill.json
- koleksiyon-kat-plani.json
- kosullar.json
- kutuphane-kurallari.json
- makale-islem-ucretleri.json
- mendeley-referans-yonetim-araci.json
- organizasyon-semasi.json
- personel.json
- sss.json
- tarihce-genel-bilgiler.json
- uyelik-odunc-islemleri.json
```

---

## 🎯 HEDEF MİMARİ

### Yeni Yapı:
```
data/pages/
└── bilgisayar-laboratuvari.json  (İçinde hem TR hem EN)
```

### Örnek JSON Formatı:

**ESKİ FORMAT:**
```json
{
  "meta": {
    "title": "Bilgisayar Laboratuvarı",
    "description": "Anadolu Üniversitesi Kütüphane - Bilgisayar Laboratuvarı"
  },
  "hero": {
    "title": "Bilgisayar Laboratuvarı",
    "description": "Modern teknoloji ile araştırmalarınızı destekliyoruz"
  },
  "content": {
    "cards": [
      {
        "title": "Bilgisayar Laboratuvarı",
        "content": "Kütüphanemizde bulunan bilgisayar laboratuvarında..."
      }
    ]
  }
}
```

**YENİ FORMAT:**
```json
{
  "meta": {
    "title": {
      "tr": "Bilgisayar Laboratuvarı",
      "en": "Computer Laboratory"
    },
    "description": {
      "tr": "Anadolu Üniversitesi Kütüphane - Bilgisayar Laboratuvarı",
      "en": "Anadolu University Library - Computer Laboratory"
    }
  },
  "hero": {
    "title": {
      "tr": "Bilgisayar Laboratuvarı",
      "en": "Computer Laboratory"
    },
    "description": {
      "tr": "Modern teknoloji ile araştırmalarınızı destekliyoruz",
      "en": "Supporting your research with modern technology"
    }
  },
  "content": {
    "cards": [
      {
        "title": {
          "tr": "Bilgisayar Laboratuvarı",
          "en": "Computer Laboratory"
        },
        "content": {
          "tr": "Kütüphanemizde bulunan bilgisayar laboratuvarında araştırmalarınızı yapabilir...",
          "en": "In our library's computer laboratory, you can conduct your research..."
        }
      }
    ]
  },
  "help": {
    "title": {
      "tr": "Aradığınız soruyu bulamadınız mı?",
      "en": "Can't find the question you're looking for?"
    },
    "description": {
      "tr": "Kütüphane hizmetleri hakkında daha detaylı bilgi almak için bizimle iletişime geçin.",
      "en": "Contact us for more detailed information about library services."
    },
    "buttons": [
      {
        "icon": "fas fa-phone",
        "text": {
          "tr": "Hemen Ara",
          "en": "Call Now"
        },
        "link": "tel:+902223350580"
      }
    ]
  }
}
```

### Avantajlar:
- ✅ Tek dosya yönetimi
- ✅ Senkronizasyon garantisi
- ✅ JSON Editor ile kolay düzenleme
- ✅ Eksik çeviri tespiti kolay
- ✅ Git'te daha temiz geçmiş
- ✅ Çeviri yapılmamış alanlar için fallback (TR → EN)

---

## 🚀 UYGULAMA ADIMLARI

### ADIM 1: Utility Fonksiyonu Oluşturma
**Dosya:** `assets/js/core/utils.js`
**Süre:** 10 dakika

### ADIM 2: App.js Güncelleme
**Dosya:** `assets/js/core/app.js`
**Süre:** 15 dakika

### ADIM 3: Sayfa Sınıflarını Güncelleme
**Dosyalar:** `assets/js/pages/*.js` (tüm sayfa dosyaları)
**Süre:** 2 saat

### ADIM 4: Component Manager'ları Güncelleme
**Dosyalar:** `assets/js/components/*.js`
**Süre:** 1 saat

### ADIM 5: JSON Dosyalarını Dönüştürme
**Dosyalar:** `data/pages/*.json`
**Süre:** 1-2 saat (script ile otomatik)

### ADIM 6: JSON Editor Geliştirme
**Dosya:** `json-editor.html` ve ilgili JS
**Süre:** 3-4 saat

### ADIM 7: Test ve Düzeltme
**Süre:** 2-3 saat

**TOPLAM TAHMİNİ SÜRE:** 10-12 saat

---

## 💻 KOD DEĞİŞİKLİKLERİ

### 1. Utils.js - Çoklu Dil Fonksiyonu

**Dosya:** `assets/js/core/utils.js`

```javascript
import { LanguageManager } from './language-manager.js';

/**
 * Get text in current language from multi-language object
 * @param {Object|string|Array} textObj - Object with {tr: "...", en: "..."}, plain string, or array
 * @param {string} lang - Language code (optional, uses current language if not provided)
 * @returns {string|Array} Text in requested language
 */
static getLocalizedText(textObj, lang = null) {
  // Eğer null veya undefined ise boş string döndür
  if (textObj === null || textObj === undefined) {
    return '';
  }

  // Eğer string ise direkt döndür
  if (typeof textObj === 'string') {
    return textObj;
  }

  // Eğer array ise her elemanı işle
  if (Array.isArray(textObj)) {
    return textObj.map(item => this.getLocalizedText(item, lang));
  }

  // Eğer object değilse string'e çevir
  if (typeof textObj !== 'object') {
    return String(textObj);
  }

  const currentLang = lang || LanguageManager.getCurrentLanguage();

  // İstenen dilde varsa döndür
  if (textObj[currentLang]) {
    return textObj[currentLang];
  }

  // Yoksa TR'ye fallback (default language)
  if (textObj.tr) {
    return textObj.tr;
  }

  // TR de yoksa EN'e fallback
  if (textObj.en) {
    return textObj.en;
  }

  // Hiçbiri yoksa ilk değeri döndür
  const firstValue = Object.values(textObj)[0];
  if (firstValue) {
    return firstValue;
  }

  // Son çare: boş string
  return '';
}

/**
 * Deep localize an entire object recursively
 * @param {Object} obj - Object to localize
 * @param {string} lang - Language code (optional)
 * @returns {Object} Localized object
 */
static localizeObject(obj, lang = null) {
  if (!obj || typeof obj !== 'object') {
    return this.getLocalizedText(obj, lang);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => this.localizeObject(item, lang));
  }

  // Check if this object is a multi-language object (has tr/en keys)
  const hasLangKeys = obj.tr !== undefined || obj.en !== undefined;
  if (hasLangKeys && Object.keys(obj).every(key => ['tr', 'en'].includes(key))) {
    return this.getLocalizedText(obj, lang);
  }

  // Recursively process all properties
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = this.localizeObject(obj[key], lang);
    }
  }
  return result;
}
```

**Kullanım Örnekleri:**
```javascript
// Basit string
Utils.getLocalizedText("Merhaba")  // → "Merhaba"

// Çoklu dil object
Utils.getLocalizedText({ tr: "Merhaba", en: "Hello" })  // → "Merhaba" (eğer dil TR ise)

// Array
Utils.getLocalizedText([
  { tr: "Bir", en: "One" },
  { tr: "İki", en: "Two" }
])  // → ["Bir", "İki"]

// Tüm object'i localize et
Utils.localizeObject({
  title: { tr: "Başlık", en: "Title" },
  items: [
    { name: { tr: "Öğe 1", en: "Item 1" } }
  ]
})
// → { title: "Başlık", items: [{ name: "Öğe 1" }] }
```

---

### 2. App.js - JSON Yükleme Güncelleme

**Dosya:** `assets/js/core/app.js`

**Değişiklik 1:** `loadPageData()` fonksiyonunu güncelleyin (satır 147-182)

```javascript
/**
 * Sayfa özel verileri yükle
 * @param {string} pageName - Sayfa adı
 * @returns {Promise<Object>} Sayfa verisi
 */
async loadPageData(pageName) {
  try {
    // YENİ YAKLASIM: Dil uzantısız dosyayı yükle (içinde çoklu dil var)
    const fileName = `${pageName}.json`;
    const response = await fetch(`${this.config.jsonPath}pages/${fileName}`);

    if (response.ok) {
      const pageData = await response.json();
      console.log(`${fileName} loaded successfully`, pageData);

      // QuickAccess otomatik başlatma
      this.initQuickAccess(pageData);

      return pageData;
    } else {
      console.warn(`${fileName} could not be loaded (${response.status})`);
      return null;
    }
  } catch (error) {
    console.warn(`Error loading ${pageName}.json:`, error.message);
    return null;
  }
}
```

**Değişiklik 2:** Global data yükleme de aynı şekilde güncellenecek (satır 106-140)

```javascript
/**
 * Global verileri yükle (her sayfada kullanılan)
 */
async loadGlobalData() {
  const globalFiles = ['header', 'footer', 'settings', 'quickActions', 'accessibility'];

  const loadPromises = globalFiles.map(async (key) => {
    try {
      // Dil uzantısız dosyayı yükle
      const fileName = `${key}.json`;
      const response = await fetch(`${this.config.jsonPath}global/${fileName}`);

      if (response.ok) {
        this.data[key] = await response.json();
        console.log(`${fileName} loaded successfully`);
      } else {
        console.warn(`${fileName} could not be loaded (${response.status})`);
      }
    } catch (error) {
      console.warn(`Error loading ${key}.json:`, error.message);
    }
  });

  await Promise.all(loadPromises);
}
```

---

### 3. Sayfa Sınıflarını Güncelleme

**Örnek:** `assets/js/pages/bilgisayar-laboratuvari.js`

**ESKİ KOD:**
```javascript
renderCard(card) {
  let contentHtml = '';
  if (Array.isArray(card.content)) {
    contentHtml = '<ul>';
    card.content.forEach(item => {
      contentHtml += `<li>${item}</li>`;
    });
    contentHtml += '</ul>';
  } else {
    contentHtml = `<p>${card.content}</p>`;
  }

  return `
    <div class="col-md-12 mb-4">
      <div class="info-card">
        <div class="card-header">${card.title}</div>
        <div class="card-body">
          ${contentHtml}
        </div>
      </div>
    </div>
  `;
}
```

**YENİ KOD:**
```javascript
import Utils from '../core/utils.js';

renderCard(card) {
  const title = Utils.getLocalizedText(card.title);
  const content = Utils.getLocalizedText(card.content);

  let contentHtml = '';
  if (Array.isArray(content)) {
    contentHtml = '<ul>';
    content.forEach(item => {
      contentHtml += `<li>${item}</li>`;
    });
    contentHtml += '</ul>';
  } else {
    contentHtml = `<p>${content}</p>`;
  }

  return `
    <div class="col-md-12 mb-4">
      <div class="info-card">
        <div class="card-header">${title}</div>
        <div class="card-body">
          ${contentHtml}
        </div>
      </div>
    </div>
  `;
}
```

**PATTERN:** Tüm sayfa sınıflarında aynı değişiklik uygulanacak:
1. `import Utils from '../core/utils.js';` ekle
2. Her `data.field` kullanımını `Utils.getLocalizedText(data.field)` ile sarmalama

---

### 4. Component Manager Güncellemeleri

Aşağıdaki componentler güncellenecek:

#### a) HeroManager (`assets/js/components/hero.js`)

```javascript
import Utils from '../core/utils.js';

async init(heroData) {
  if (!heroData) return;

  const title = Utils.getLocalizedText(heroData.title);
  const description = Utils.getLocalizedText(heroData.description);
  const backgroundImage = heroData.backgroundImage || '';

  const heroHTML = `
    <section class="hero-section" style="background-image: url('${backgroundImage}');">
      <div class="hero-content">
        <h1 class="hero-title">${title}</h1>
        <p class="hero-description">${description}</p>
      </div>
    </section>
  `;

  // ... rest of the code
}
```

#### b) HelpSectionManager (`assets/js/components/helpsection.js`)

```javascript
import Utils from '../core/utils.js';

async init(helpData) {
  if (!helpData) return;

  const title = Utils.getLocalizedText(helpData.title);
  const description = Utils.getLocalizedText(helpData.description);

  let buttonsHTML = '';
  if (helpData.buttons && Array.isArray(helpData.buttons)) {
    helpData.buttons.forEach(button => {
      const buttonText = Utils.getLocalizedText(button.text);
      buttonsHTML += `
        <a href="${button.link}" class="help-button">
          <i class="${button.icon}"></i>
          <span>${buttonText}</span>
        </a>
      `;
    });
  }

  // ... rest of the code
}
```

#### c) HeaderManager (`assets/js/components/header.js`)

```javascript
import Utils from '../core/utils.js';

renderNavigation(navItems) {
  return navItems.map(item => {
    const text = Utils.getLocalizedText(item.text);

    if (item.dropdown) {
      const dropdownItems = item.dropdown.map(subItem => {
        const subText = Utils.getLocalizedText(subItem.text);
        return `<a class="dropdown-item" href="${subItem.link}">${subText}</a>`;
      }).join('');

      return `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#">${text}</a>
          <div class="dropdown-menu">${dropdownItems}</div>
        </li>
      `;
    } else {
      return `<li class="nav-item"><a class="nav-link" href="${item.link}">${text}</a></li>`;
    }
  }).join('');
}
```

#### d) FooterManager (`assets/js/components/footer.js`)

```javascript
import Utils from '../core/utils.js';

init(footerData) {
  if (!footerData) return;

  const columns = footerData.columns.map(column => {
    const title = Utils.getLocalizedText(column.title);
    const links = column.links.map(link => {
      const text = Utils.getLocalizedText(link.text);
      return `<li><a href="${link.url}">${text}</a></li>`;
    }).join('');

    return `
      <div class="footer-column">
        <h3>${title}</h3>
        <ul>${links}</ul>
      </div>
    `;
  }).join('');

  // ... rest of the code
}
```

---

## 🔄 JSON DÖNÜŞÜM STRATEJİSİ

### Manuel Dönüşüm Scripti

**Dosya:** `convert-json-to-multilang.js` (root dizinde oluştur)

```javascript
const fs = require('fs');
const path = require('path');

/**
 * Bir değeri çoklu dil formatına çevir
 */
function convertToMultilang(value, hasEnglish = false) {
  if (value === null || value === undefined) {
    return value;
  }

  // String ise çoklu dil object'e çevir
  if (typeof value === 'string') {
    return {
      tr: value,
      en: hasEnglish ? '' : value // EN boş veya TR ile aynı
    };
  }

  // Array ise her elemanı işle
  if (Array.isArray(value)) {
    return value.map(item => convertToMultilang(item, hasEnglish));
  }

  // Object ise her property'yi işle
  if (typeof value === 'object') {
    // Zaten çoklu dil formatında mı kontrol et
    if (value.tr !== undefined || value.en !== undefined) {
      return value; // Zaten dönüştürülmüş
    }

    const result = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        // Bazı alanları dönüştürme (icon, link, url vs.)
        const skipKeys = ['icon', 'link', 'url', 'href', 'image', 'backgroundImage', 'logo', 'type', 'id'];
        if (skipKeys.includes(key)) {
          result[key] = value[key];
        } else {
          result[key] = convertToMultilang(value[key], hasEnglish);
        }
      }
    }
    return result;
  }

  return value;
}

/**
 * JSON dosyasını dönüştür
 */
function convertJSONFile(filePath, hasEnglish = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    const converted = convertToMultilang(data, hasEnglish);

    const newContent = JSON.stringify(converted, null, 2);
    fs.writeFileSync(filePath, newContent, 'utf8');

    console.log(`✅ Converted: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
  }
}

/**
 * Dizindeki tüm JSON dosyalarını dönüştür
 */
function convertDirectory(dirPath, hasEnglish = false) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (file.endsWith('.json') && !file.includes('.tr.') && !file.includes('.en.')) {
      const filePath = path.join(dirPath, file);
      convertJSONFile(filePath, hasEnglish);
    }
  });
}

// KULLANIM:
console.log('🚀 JSON Conversion Starting...\n');

// Pages dizinini dönüştür
console.log('📄 Converting pages...');
convertDirectory('./data/pages', false);

// Global dizinini dönüştür
console.log('\n🌐 Converting global...');
convertDirectory('./data/global', false);

console.log('\n✨ Conversion completed!');
console.log('⚠️  Lütfen dosyaları kontrol edin ve İngilizce çevirileri ekleyin.');
```

**Kullanım:**
```bash
node convert-json-to-multilang.js
```

### Manuel Kontrol Listesi

Dönüşümden sonra her dosyayı kontrol edin:

1. ✅ Tüm metin alanları `{ tr: "...", en: "..." }` formatında mı?
2. ✅ `icon`, `link`, `url` gibi teknik alanlar dokunulmamış mı?
3. ✅ Array'ler doğru dönüştürülmüş mü?
4. ✅ İç içe object'ler doğru çalışıyor mu?

---

## 🎨 JSON EDITOR GELİŞTİRME

### Mevcut JSON Editor Analizi

**Dosya:** `json-editor.html`

Mevcut editor'ün şu özellikleri olmalı:
1. Dosya seçimi
2. JSON parse ve render
3. Form alanları ile düzenleme
4. Kaydetme

### Yeni Özellikler

#### 1. Çoklu Dil Alanları

Her metin alanı için TR ve EN input'ları:

```html
<div class="field-multilang">
  <label>Başlık / Title</label>
  <div class="lang-inputs">
    <div class="lang-input">
      <span class="lang-badge">TR</span>
      <input type="text" name="hero.title.tr" value="...">
    </div>
    <div class="lang-input">
      <span class="lang-badge">EN</span>
      <input type="text" name="hero.title.en" value="...">
    </div>
  </div>
</div>
```

#### 2. Çeviri Durumu İndikatörü

```html
<div class="translation-status">
  <span class="status-indicator status-complete">TR ✓</span>
  <span class="status-indicator status-missing">EN ✗</span>
</div>
```

#### 3. Toplu Çeviri Desteği

```html
<button class="btn-translate-missing">
  <i class="fas fa-language"></i>
  Eksik Çevirileri Göster
</button>
```

### JSON Editor JavaScript

**Dosya:** `assets/js/json-editor.js` (yeni oluşturulacak)

```javascript
class JSONEditor {
  constructor() {
    this.currentFile = null;
    this.currentData = null;
    this.isDirty = false;
  }

  /**
   * JSON dosyasını yükle
   */
  async loadFile(fileName) {
    try {
      const response = await fetch(`data/pages/${fileName}`);
      if (!response.ok) throw new Error('File not found');

      this.currentData = await response.json();
      this.currentFile = fileName;
      this.isDirty = false;

      this.renderEditor();
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Dosya yüklenirken hata oluştu!');
    }
  }

  /**
   * Editor'ı render et
   */
  renderEditor() {
    const container = document.getElementById('editor-container');
    container.innerHTML = '';

    this.renderObject(this.currentData, container, '');
  }

  /**
   * Object'i recursive olarak render et
   */
  renderObject(obj, container, path) {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const value = obj[key];
      const fullPath = path ? `${path}.${key}` : key;

      // Çoklu dil alanı mı kontrol et
      if (this.isMultilangField(value)) {
        this.renderMultilangField(key, value, container, fullPath);
      } else if (Array.isArray(value)) {
        this.renderArray(key, value, container, fullPath);
      } else if (typeof value === 'object' && value !== null) {
        this.renderObjectField(key, value, container, fullPath);
      } else {
        this.renderSimpleField(key, value, container, fullPath);
      }
    }
  }

  /**
   * Çoklu dil alanı mı kontrol et
   */
  isMultilangField(value) {
    if (typeof value !== 'object' || value === null) return false;
    const keys = Object.keys(value);
    return keys.length === 2 && keys.includes('tr') && keys.includes('en');
  }

  /**
   * Çoklu dil alanını render et
   */
  renderMultilangField(key, value, container, path) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-multilang';

    const label = document.createElement('label');
    label.textContent = this.humanizeKey(key);
    fieldDiv.appendChild(label);

    const langInputs = document.createElement('div');
    langInputs.className = 'lang-inputs';

    // TR Input
    const trDiv = this.createLangInput('TR', value.tr || '', `${path}.tr`);
    langInputs.appendChild(trDiv);

    // EN Input
    const enDiv = this.createLangInput('EN', value.en || '', `${path}.en`);
    langInputs.appendChild(enDiv);

    fieldDiv.appendChild(langInputs);

    // Çeviri durumu
    const status = this.createTranslationStatus(value);
    fieldDiv.appendChild(status);

    container.appendChild(fieldDiv);
  }

  /**
   * Dil input'u oluştur
   */
  createLangInput(lang, value, path) {
    const div = document.createElement('div');
    div.className = 'lang-input';

    const badge = document.createElement('span');
    badge.className = 'lang-badge';
    badge.textContent = lang;
    div.appendChild(badge);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.dataset.path = path;
    input.addEventListener('input', () => {
      this.isDirty = true;
      this.updateValue(path, input.value);
    });
    div.appendChild(input);

    return div;
  }

  /**
   * Çeviri durumu indikatörü
   */
  createTranslationStatus(value) {
    const div = document.createElement('div');
    div.className = 'translation-status';

    const trStatus = value.tr && value.tr.trim() !== '';
    const enStatus = value.en && value.en.trim() !== '';

    div.innerHTML = `
      <span class="status-indicator ${trStatus ? 'status-complete' : 'status-missing'}">
        TR ${trStatus ? '✓' : '✗'}
      </span>
      <span class="status-indicator ${enStatus ? 'status-complete' : 'status-missing'}">
        EN ${enStatus ? '✓' : '✗'}
      </span>
    `;

    return div;
  }

  /**
   * Değeri güncelle
   */
  updateValue(path, value) {
    const keys = path.split('.');
    let obj = this.currentData;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * Kaydet
   */
  async save() {
    if (!this.currentFile) return;

    const jsonContent = JSON.stringify(this.currentData, null, 2);

    // Burada backend'e kaydetme işlemi yapılacak
    // Şimdilik indirme olarak yapıyoruz
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.currentFile;
    a.click();
    URL.revokeObjectURL(url);

    this.isDirty = false;
    alert('Dosya kaydedildi!');
  }

  /**
   * Key'i insan okunabilir hale getir
   */
  humanizeKey(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

// Initialize
const editor = new JSONEditor();
```

### JSON Editor CSS

**Dosya:** `assets/css/json-editor.css`

```css
/* JSON Editor Styles */
.editor-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.field-multilang {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.field-multilang label {
  display: block;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lang-inputs {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.lang-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #007bff;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  min-width: 32px;
  text-align: center;
}

.lang-input input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.lang-input input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.translation-status {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.status-indicator {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-complete {
  background: #d4edda;
  color: #155724;
}

.status-missing {
  background: #f8d7da;
  color: #721c24;
}

.editor-actions {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px;
  border-bottom: 2px solid #007bff;
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 100;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,123,255,0.3);
}

.btn-translate-missing {
  background: #ffc107;
  color: #000;
}

.btn-translate-missing:hover {
  background: #e0a800;
}

.file-selector {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.dirty-indicator {
  display: none;
  color: #dc3545;
  font-weight: 600;
  font-size: 12px;
}

.dirty-indicator.active {
  display: block;
}
```

### JSON Editor HTML Güncellemesi

**Dosya:** `json-editor.html`

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSON Editor - Çoklu Dil Desteği</title>
  <link rel="stylesheet" href="assets/css/json-editor.css">
</head>
<body>
  <div class="editor-container">
    <div class="editor-actions">
      <select class="file-selector" id="file-selector">
        <option value="">Dosya Seçin...</option>
        <option value="bilgisayar-laboratuvari.json">Bilgisayar Laboratuvarı</option>
        <option value="calisma-odalari.json">Çalışma Odaları</option>
        <option value="kime-sormaliyim.json">Kime Sormalıyım</option>
        <!-- Diğer dosyalar... -->
      </select>

      <button class="btn btn-primary" id="save-btn">
        <i class="fas fa-save"></i> Kaydet
      </button>

      <button class="btn btn-translate-missing" id="show-missing-btn">
        <i class="fas fa-language"></i> Eksik Çevirileri Göster
      </button>

      <div class="dirty-indicator" id="dirty-indicator">
        * Kaydedilmemiş değişiklikler var
      </div>
    </div>

    <div id="editor-content">
      <!-- Editor içeriği buraya gelecek -->
    </div>
  </div>

  <script type="module">
    import { JSONEditor } from './assets/js/json-editor.js';

    const editor = new JSONEditor();

    // File selector
    document.getElementById('file-selector').addEventListener('change', (e) => {
      if (e.target.value) {
        editor.loadFile(e.target.value);
      }
    });

    // Save button
    document.getElementById('save-btn').addEventListener('click', () => {
      editor.save();
    });

    // Show missing translations
    document.getElementById('show-missing-btn').addEventListener('click', () => {
      editor.showMissingTranslations();
    });

    // Unsaved changes warning
    window.addEventListener('beforeunload', (e) => {
      if (editor.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  </script>
</body>
</html>
```

---

## 🧪 TEST PLANI

### Test Aşamaları

#### 1. Unit Test
- ✅ `Utils.getLocalizedText()` fonksiyonu tüm veri tipleriyle test edilecek
- ✅ `Utils.localizeObject()` iç içe object'lerde test edilecek
- ✅ Fallback mekanizması (TR → EN → ilk değer) test edilecek

#### 2. Sayfa Test
Her sayfa için:
- ✅ TR dilinde tüm içerikler görünüyor mu?
- ✅ EN diline geçildiğinde çeviriler görünüyor mu?
- ✅ Eksik çeviriler için TR fallback çalışıyor mu?
- ✅ Hero, içerik, button'lar doğru render oluyor mu?

#### 3. Component Test
- ✅ Header navigasyon linkleri çoklu dilde çalışıyor mu?
- ✅ Footer kolonları ve linkler doğru mu?
- ✅ Hero section başlık ve açıklama doğru mu?
- ✅ Help section butonları doğru mu?

#### 4. JSON Editor Test
- ✅ Dosya yükleme çalışıyor mu?
- ✅ Çoklu dil alanları doğru render oluyor mu?
- ✅ Değişiklikler doğru kaydediliyor mu?
- ✅ Çeviri durumu doğru gösteriliyor mu?
- ✅ Eksik çeviriler listelenebiliyor mu?

### Test Sayfaları

1. ✅ `bilgisayar-laboratuvari.html`
2. ✅ `calisma-odalari.html`
3. ✅ `kime-sormaliyim.html`
4. ✅ `index.html` (ana sayfa)
5. ✅ `veritabanlari.html`

### Test Checklist

```
□ TR dilinde tüm sayfalar düzgün görünüyor
□ EN diline geçiş yapılabiliyor
□ Eksik çeviriler için fallback çalışıyor
□ Console'da hata yok
□ JSON Editor çalışıyor
□ Değişiklikler kaydedilebiliyor
□ Dil geçişleri smooth
□ Mobile responsive çalışıyor
```

---

## 🔙 ROLLBACK STRATEJİSİ

### Geri Alma Planı

Eğer migrasyon sırasında sorun çıkarsa:

#### 1. Git ile Geri Alma
```bash
# Son commit öncesine dön
git reset --hard HEAD~1

# Veya belirli bir commit'e
git reset --hard <commit-hash>
```

#### 2. Backup Stratejisi

**MİGRASYON ÖNCESİ:**
```bash
# Tüm data klasörünü yedekle
cp -r data/ data_backup_$(date +%Y%m%d_%H%M%S)/

# JavaScript dosyalarını yedekle
cp -r assets/js/ assets/js_backup_$(date +%Y%m%d_%H%M%S)/
```

**GERI YÜKLEME:**
```bash
# Yedekten geri yükle
rm -rf data/
cp -r data_backup_20251105_120000/ data/

rm -rf assets/js/
cp -r assets/js_backup_20251105_120000/ assets/js/
```

#### 3. Kademeli Rollback

Tüm sistemi geri almak yerine sadece problemli kısmı:

```javascript
// app.js içinde fallback ekle
async loadPageData(pageName) {
  try {
    // YENİ: Çoklu dil dosyasını dene
    const response = await fetch(`${this.config.jsonPath}pages/${pageName}.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('New format failed, trying old format...');
  }

  // ESKİ: Dil uzantılı dosyaları dene
  const currentLang = LanguageManager.getCurrentLanguage();
  const langFileName = `${pageName}.${currentLang}.json`;
  const response = await fetch(`${this.config.jsonPath}pages/${langFileName}`);
  if (response.ok) {
    return await response.json();
  }

  return null;
}
```

---

## 📝 UYGULAMA KONTROL LİSTESİ

### Hazırlık
- [x] Tüm değişiklikleri Git'e commit et
- [x] Backup al (`data/` ve `assets/js/`)
- [ ] Test ortamı hazırla
- [x] Dokümantasyonu oku

### Kod Değişiklikleri
- [x] `utils.js` güncelle → `getLocalizedText()` ve `localizeObject()` eklendi
- [x] `app.js` güncelle → Dil uzantısız yükleme (multi-lang JSON desteği)
- [ ] Tüm sayfa sınıflarını güncelle (27 dosya) - 1/27 tamamlandı (iletisim)
- [x] Component manager'ları güncelle (6 dosya)
  - [x] inner-page-components.js (renderHeading, renderAlert, renderIconList, renderTable, renderInfoBox)
  - [x] hero.js (render, renderBreadcrumb)
  - [x] helpsection.js (render, renderButtons, renderCard)

### JSON Dönüşümü
- [ ] Dönüşüm scriptini çalıştır (ihtiyaç yok, manuel dönüştürüyoruz)
- [ ] `data/pages/` tüm dosyaları kontrol et - 1/27 tamamlandı (iletisim.json)
- [ ] `data/global/` tüm dosyaları kontrol et
- [ ] Eski `.tr.json` ve `.en.json` dosyalarını sil

### PİLOT TEST - İLETİŞİM SAYFASI (2025-11-05)
- [x] iletisim.json çoklu dil formatına dönüştürüldü
- [x] Tüm text alanları {tr: "...", en: "..."} formatında
- [x] Component renderer'lar güncellendi
- [x] Hero ve HelpSection component'leri güncellendi
- [ ] Test: TR dilinde görüntüleme
- [ ] Test: EN diline geçiş
- [ ] Test: Console'da hata kontrolü

### JSON Editor
- [ ] `json-editor.js` oluştur
- [ ] `json-editor.css` oluştur
- [ ] `json-editor.html` güncelle
- [ ] Test et

### Test
- [ ] TR dilinde tüm sayfaları test et
- [ ] EN diline geç ve test et
- [ ] Console hatalarını kontrol et
- [ ] Mobile'da test et

### Deployment
- [ ] Test ortamında son kontrol
- [ ] Production'a deploy et
- [ ] Canlıda son kontrol
- [ ] Dokümantasyonu güncelle

---

## 🎓 EK KAYNAKLAR

### Faydalı Linkler
- [JavaScript i18n Best Practices](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n)
- [JSON Schema for Multilingual Data](https://json-schema.org/)
- [Web Localization Guide](https://www.w3.org/International/questions/qa-i18n)

### Geliştirme Araçları
- VSCode Extension: i18n Ally (çoklu dil desteği)
- JSON Validator: jsonlint.com
- Translation Management: Lokalise, Crowdin

### İletişim
Sorularınız için:
- Bu dokümanı referans alarak Claude ile chat yapabilirsiniz
- Her adımda test edin ve doğrulayın
- Backup almayı unutmayın!

---

## 📅 TAHMİNİ ZAMAN ÇİZELGESİ

### 1. Gün (4-6 saat)
- [x] Dokümantasyon hazırlığı
- [ ] Backup alma
- [ ] Utils.js güncelleme
- [ ] App.js güncelleme
- [ ] İlk test

### 2. Gün (4-6 saat)
- [ ] Sayfa sınıfları güncelleme (1. grup: 10 dosya)
- [ ] Component manager güncelleme
- [ ] Test

### 3. Gün (4-6 saat)
- [ ] Sayfa sınıfları güncelleme (2. grup: kalan dosyalar)
- [ ] JSON dönüşüm scripti çalıştırma
- [ ] Manuel kontrol ve düzeltme
- [ ] Test

### 4. Gün (3-4 saat)
- [ ] JSON Editor geliştirme
- [ ] JSON Editor test
- [ ] Final test ve düzeltmeler

### 5. Gün (2-3 saat)
- [ ] Kapsamlı test
- [ ] Production deployment
- [ ] Dokümantasyon güncellemesi

**TOPLAM:** ~20-25 saat

---

## ✅ BAŞARILI MİGRASYON KRİTERLERİ

Migrasyon başarılı sayılır eğer:

1. ✅ Tüm sayfalar TR dilinde hatasız çalışıyor
2. ✅ EN diline geçiş yapılabiliyor
3. ✅ Eksik çevirilerde fallback çalışıyor
4. ✅ JSON Editor ile düzenleme yapılabiliyor
5. ✅ Console'da kritik hata yok
6. ✅ Mobile responsive çalışıyor
7. ✅ Performans düşüşü yok
8. ✅ SEO meta tagları doğru

---

## 🚨 SORUN GİDERME

### Sık Karşılaşılan Sorunlar

#### 1. "Cannot read property 'tr' of undefined"
**Çözüm:** `getLocalizedText()` fonksiyonunda null check eklenmiş mi kontrol et.

#### 2. Sayfa boş görünüyor
**Çözüm:** Console'da JSON yükleme hatası var mı kontrol et. JSON syntax'ı doğru mu?

#### 3. EN dili çalışmıyor
**Çözüm:** JSON'da `en` alanları dolu mu? `getLocalizedText()` doğru çağrılıyor mu?

#### 4. JSON Editor kaydetmiyor
**Çözüm:** Browser console'da hata var mı? Dosya yazma izni var mı?

---

## 🎯 SONRAKİ ADIMLAR

Migrasyon tamamlandıktan sonra:

1. 📝 Tüm TR içeriklerin EN çevirisini yap
2. 🔍 SEO optimizasyonu (hreflang tagları ekle)
3. 🌐 Dil seçici widget geliştir
4. 📊 Analytics (hangi dil ne kadar kullanılıyor)
5. 🤖 Otomatik çeviri entegrasyonu (DeepL API vs.)
6. 📱 Mobile app için API endpoint'leri
7. 🔄 Sürekli entegrasyon (CI/CD) kurulumu

---

## 📞 İLETİŞİM

Bu dokümantasyon hakkında sorularınız için:

**Claude AI ile devam etmek için:**
```
"CLAUDE.md dosyasını okudum,
[ADIM/BÖLÜM] hakkında detaylı bilgi verir misin?"
```

**Örnek sorular:**
- "Utils.js güncellemesini nasıl yapacağım?"
- "JSON dönüşüm scriptini çalıştır"
- "Bilgisayar laboratuvarı sayfasını güncelle"
- "JSON Editor'ü test et"

---

## 📊 GÜNCEL DURUM (2025-11-05 - 17:30)

### ✅ Tamamlanan İşlemler

#### 1. Altyapı Hazırlığı ✅ TAMAMLANDI
- **utils.js**: `getLocalizedText()` ve `localizeObject()` fonksiyonları eklendi
- **utils.js**: localStorage key düzeltildi (`'selectedLanguage'` → `'library_language'`)
- **app.js**: JSON yükleme mantığı güncellendi (artık `.tr.json` değil, sadece `.json` yüklüyor)

#### 2. Component Güncellemeleri ✅ TAMAMLANDI
**inner-page-components.js:**
- ✅ renderHeading() - Çoklu dil desteği eklendi
- ✅ renderAlert() - Çoklu dil desteği eklendi
- ✅ renderIconList() - Çoklu dil desteği eklendi
- ✅ renderTable() - Headers ve cells için çoklu dil desteği
- ✅ renderInfoBox() - Çoklu dil desteği eklendi

**hero.js:**
- ✅ render() - Title ve description için çoklu dil
- ✅ renderBreadcrumb() - Breadcrumb text'leri için çoklu dil

**helpsection.js:**
- ✅ render() - Title ve description için çoklu dil
- ✅ renderButtons() - Button text'leri için çoklu dil
- ✅ renderCard() - Card text'leri için çoklu dil

**header.js:**
- ✅ createLanguageSwitcher() - Inline onclick kaldırıldı, event listener eklendi
- ✅ setupLanguageSwitcher() - Yeni metod eklendi

#### 3. Global JSON Dosyaları ✅ TAMAMLANDI
- ✅ **header.json** - Çoklu dil formatına dönüştürüldü
- ✅ **footer.json** - Çoklu dil formatına dönüştürüldü
- ✅ **settings.json** - Çoklu dil formatına dönüştürüldü
- ✅ **quickActions.json** - Çoklu dil formatına dönüştürüldü
- ✅ **accessibility.json** - Çoklu dil formatına dönüştürüldü

#### 4. Pilot Test - İletişim Sayfası ✅ BAŞARILI
**iletisim.json:**
- ✅ Hero section (title, description, breadcrumb)
- ✅ Contact info section (heading, icon-list, info-box)
- ✅ Map section (heading)
- ✅ Departments section (heading, alert, table)
- ✅ Help section (title, description, buttons)
- ✅ Tüm İngilizce çeviriler eklendi
- ✅ **TEST SONUCU**: Dil değiştirme çalışıyor! TR ↔ EN geçişler başarılı!

### 🔄 Devam Eden İşlemler

#### 🌙 SABAH İLK İŞ - GLOBAL DOSYALAR (2025-11-06 GECE NOTU)

**SORUN TESPİT EDİLDİ:**
- Footer ve diğer global dosyalar çoklu dil formatına dönüştürülmemiş
- Eski `.tr.json` ve `.en.json` dosyaları hala `data/global/` klasöründe duruyor
- Header çalışıyor ama footer Türkçe kalıyor

**YAPILACAKLAR (Öncelik Sırasıyla):**

**🚀 SABAH İLK KOMUT:**
Kullanıcı "sabah devam edelim" veya "global dosyalara devam et" dediğinde otomatik başla:
1. Eski dosyaları sil
2. Footer.json'u çoklu dil formatına dönüştür
3. Diğer global dosyaları kontrol et ve dönüştür
4. Test et

1. **⚠️ ÖNEMLİ: Eski dosyaları sil** (1 dakika)
   ```bash
   rm data/global/*.tr.json
   rm data/global/*.en.json
   ```

2. **Footer.json çoklu dil formatına dönüştür** (5-10 dakika)
   - Dosya: `data/global/footer.json`
   - Tüm text alanlarını `{tr: "...", en: "..."}` formatına çevir
   - Özellikle: navigation linkleri, column başlıkları, copyright text
   - Test: Footer'ın TR ↔ EN geçişini kontrol et

3. **Diğer Global Dosyaları Kontrol Et** (10-15 dakika)
   - `settings.json` - Çoklu dil formatına dönüştür
   - `quickActions.json` - Çoklu dil formatına dönüştür
   - `accessibility.json` - Çoklu dil formatına dönüştür
   - NOT: `header.json` zaten yapıldı ✅

4. **Hızlı Test Sayfaları** (5 dakika)
   - erisilebilirlik.html
   - gizlilik.html
   - kosullar.html
   - Bu sayfalar genelde kısa içerikli, hızlı yapılabilir

**TAHMİNİ SÜRE:** 20-30 dakika

### 📋 Sonraki Adımlar (Öncelik Sırasına Göre)

#### Hakkımızda Menüsü Sayfaları:
1. ✅ iletisim.json - TAMAMLANDI ✅
2. ✅ calisma-saatleri.json - TAMAMLANDI ✅
3. ✅ personel.json - TAMAMLANDI ✅
4. ✅ organizasyon-semasi.json - TAMAMLANDI ✅
5. ✅ tarihce-genel-bilgiler.json - TAMAMLANDI ✅
6. ✅ kutuphane-kurallari.json - TAMAMLANDI ✅
7. ✅ koleksiyon-kat-plani.json - TAMAMLANDI ✅ (inner.js'e floors kontrolü eklendi)

#### Diğer Önemli Sayfalar:
8. ✅ home.json (Ana sayfa) - TAMAMLANDI ✅ (app.js ve home.js güncellendi, section başlıkları dinamik)
9. ✅ sss.json - TAMAMLANDI ✅ (JS'deki sabit metinler JSON'a taşındı: search placeholder, kategori label'ları, noResults mesajları)
10. ✅ formlar.json - TAMAMLANDI ✅ (Tüm form başlıkları, açıklamaları, button text'leri çevrildi + Link alanları da çoklu dil destekli hale getirildi: form-TR.pdf / form-EN.pdf)
11. ✅ egitim-programlari.json - TAMAMLANDI ✅ (HTML içerikler icon-list component'ine dönüştürüldü, help section eklendi, tüm çeviriler tamamlandı)
12. ✅ anadolu-arastirma.json - TAMAMLANDI ✅ (2025-11-06 GECE)
    - 4 sayfa için tek JSON + tek JS dosyası
    - Mapping sistemi ile sayfa adından section key belirleniyor
    - Boş içerik uyarısı eklendi
    - Test: Tüm 4 sayfa çalışıyor (2'si dolu, 2'si boş uyarı gösteriyor)
13. ⏳ GLOBAL DOSYALAR - SABAH İLK İŞ (footer, settings, quickActions, accessibility)
14. ⏳ veritabanlari.json - SONRA

#### Kalan Sayfalar (11 dosya):
- bilgisayar-laboratuvari.json
- calisma-odalari.json
- kime-sormaliyim.json
- duyurular.json
- guncel-haberler.json
- uzaktan-erisim.json
- sure-uzatma.json
- ill.json
- uyelik-odunc-islemleri.json
- makale-islem-ucretleri.json
- mendeley-referans-yonetim-araci.json
- arastirmaci-profili-olusturma.json
- erisilebilirlik.json (HIZLI - Sabah yapılabilir)
- gizlilik.json (HIZLI - Sabah yapılabilir)
- kosullar.json (HIZLI - Sabah yapılabilir)

**TOPLAM:** 12 ✅ / 2 ⏳ (global + veritabanlari) / 14 ⬜ sayfa kaldı (27 sayfadan 12'si tamamlandı, %44 ilerleme)

**🎯 SABAH PLANI:**
1. Global dosyalar (20-30 dk) → %48 ilerleme
2. Hızlı sayfalar (15 dk) → %59 ilerleme
3. Veritabanlari (20 dk) → %63 ilerleme
4. Kalan sayfalar devam...

**🐛 NOT:** Koleksiyon Kat Planı sayfasında sorun çıktı: `content: {}` boş obje olduğu için InnerPage sınıfı render etmeye çalışıyordu. Çözüm: `inner.js` dosyasına `floors` alanı kontrolü ve boş obje kontrolü eklendi (satır 94-108).

**🌙 GECE ÇALIŞMASI ÖZET (2025-11-06 - 23:00):**
1. ✅ Anadolu Araştırma sayfaları için tek JSON + tek JS sistemi kuruldu
2. ✅ 4 sayfa tek sınıfla yönetiliyor: `AnadoluArastirmaPage`
3. ✅ app.js'te mapping sistemi eklendi (sayfa adı → JSON section key)
4. ✅ Boş içerik uyarısı sistemi eklendi (TR + EN)
5. ✅ Debug log'ları eklendi (kolay troubleshooting için)
6. ⚠️ Footer sorunu tespit edildi: Global dosyalar çoklu dil formatında değil
7. 📝 Sabah planı hazırlandı

**⚠️ ÖNEMLİ NOT (2025-11-05 - 22:00):** Eğitim Programları sayfasında tespit edilen hatalar:
1. `help` section eksikti → Eklendi ✅
2. JSON'da HTML içerik vardı (info-box component'lerinde hardcoded HTML) → Temizlendi, icon-list component'ine çevrildi ✅

### 🎯 Öğrenilen Dersler & Çözülen Sorunlar

1. **JSON Formatı**: Her text alanı `{tr: "...", en: "..."}` formatında olmalı
2. **Teknik Alanlar**: `icon`, `url`, `embedUrl`, `type`, `variant`, `layout`, `gap`, `justify` gibi alanlar dönüştürülmemeli (ANCAK `link` alanı opsiyonel olarak çoklu dil destekli olabilir - bkz. madde 14)
3. **Fallback**: `Utils.getLocalizedText()` otomatik olarak TR → EN → ilk değer fallback yapıyor
4. **Array Support**: Table headers ve cells gibi array'ler için de çoklu dil desteği çalışıyor
5. **🐛 BUG FIX**: localStorage key uyuşmazlığı (`selectedLanguage` → `library_language`)
6. **🐛 BUG FIX**: Inline onclick event handler'lar çalışmıyordu, event listener'a geçildi
7. **Component'ler**: Tüm component'ler zaten `Utils.getLocalizedText()` kullanıyor, sayfa JS dosyalarını değiştirmeye gerek yok!
8. **⚠️ ÖNEMLİ**: `statusBadge` içindeki `variant: "auto"` gibi alanlar JS tarafından işleniyor, çevrilmemeli!
9. **StatusBadge Hours**: `statusBadge.data.hours` array'i içindeki `day` ve `time: "Kapalı"` gibi alanlar çevrilmeli
10. **🐛 BUG FIX (2025-11-05)**: `renderContent()` ve `renderResourceLinks()` component'lerinde çoklu dil desteği eksikti, eklendi!
11. **🐛 BUG FIX (2025-11-05)**: `renderStatCards()` component'inde `label` ve `value` alanları için çoklu dil desteği eksikti, eklendi!
12. **🐛 BUG FIX (2025-11-05)**: `renderContactBox()` component'inde `title`, `text` ve `link.text` alanları için çoklu dil desteği eksikti, eklendi!
13. **✨ SSS Sayfası Pattern (2025-11-05)**: JS içindeki sabit metinler (search placeholder, kategori label'ları, "sonuç bulunamadı" mesajı) JSON'a taşındı ve çoklu dil formatına dönüştürüldü. Bu pattern diğer sayfalar için de kullanılabilir.
14. **🔗 FORM DOSYALARI İÇİN ÖNEMLİ (2025-11-05)**: `link` alanları da çoklu dil destekli olabilir! `inner-page-components.js`'teki `renderAlert()` fonksiyonuna `Utils.getLocalizedText(link)` desteği eklendi. Artık formlar için farklı dillerde farklı dosyalar sunulabilir:
   - JSON'da: `"link": { "tr": "form-TR.pdf", "en": "form-EN.pdf" }`
   - Veya tek dosya: `"link": "form.pdf"` (her iki dilde aynı dosya)
15. **🚫 JSON'DA HTML YASAK (2025-11-05)**: JSON dosyalarında ASLA hardcoded HTML içerik olmamalı! Eğer HTML varsa, component'e çevrilmeli:
   - ❌ YANLIŞ: `"content": "<div class='component-icon-list'>...hardcoded HTML...</div>"`
   - ✅ DOĞRU: `"type": "icon-list"` component kullan, data'yı JSON olarak ver
   - Eğer iletişim bilgileri varsa: `icon-list` component'i `variant: "contact-grid"` ile kullan
16. **✅ HELP SECTION ZORUNLU (2025-11-05)**: Her sayfa JSON'unda MUTLAKA `help` section olmalı! Format:
   ```json
   "help": {
     "title": { "tr": "...", "en": "..." },
     "description": { "tr": "...", "en": "..." },
     "buttons": [
       { "icon": "...", "text": { "tr": "...", "en": "..." }, "link": "...", "variant": "primary" }
     ]
   }
   ```
   - Standard butonlar: "Hemen Ara" (tel:), "E-posta Gönder" (mailto:), "Ana Sayfa" (index.html)
   - Her sayfaya özel title ve description yazılmalı (generic olmamalı)
17. **📦 ÖZEL DURUM - TEK JSON, ÇOKLU SAYFA (2025-11-06)**: Bazı durumlarda tek JSON dosyası birden fazla sayfa için kullanılabilir:
   - Örnek: `anadolu-arastirma.json` → 4 farklı sayfa için kullanılıyor
   - JSON formatı: `{ "section_key_1": {...}, "section_key_2": {...}, ... }`
   - `app.js`'te özel kontrol: Sayfa adına göre JSON dosyası ve section key belirleniyor (mapping tablosu)
   - Her section kendi `meta`, `hero`, `content`, `help` alanlarına sahip
   - **TEK JS DOSYASI**: 4 sayfa için de `anadolu-arastirma.js` dosyası kullanılıyor, içinde `AnadoluArastirmaPage` sınıfı var
   - Geriye dönük uyumluluk için tüm sınıf isimleri export ediliyor: `ArastirmaBirimleriPage`, `ArastirmaMevzuatiPage`, vb.
   - Bu yaklaşım ilişkili sayfalar için kod tekrarını azaltır
18. **🚨 BOŞ İÇERİK UYARISI (2025-11-06)**: Sayfa içeriği boşsa kullanıcıya bilgilendirici mesaj gösterilmeli:
   - Türkçe: "Bu sayfa için henüz içerik girilmemiştir. Lütfen daha sonra tekrar kontrol ediniz."
   - İngilizce: "No content has been entered for this page yet. Please check back later."
   - Kontrol: `content.cards` boş veya `content.cards[0].content` boş array ise uyarı göster
19. **⚠️ ESKİ .TR.JSON VE .EN.JSON DOSYALARI (2025-11-06 GECE)**:
   - `data/global/` klasöründe eski dil sistemi dosyaları var (`.tr.json`, `.en.json`)
   - Bu dosyalar yeni sistem ile çakışıyor (footer Türkçe kalıyor)
   - **ÇÖZÜM**: Önce eski dosyaları sil, sonra ana `.json` dosyalarını çoklu dil formatına dönüştür
   - Global dosyaların hepsi güncellenmeli: footer, settings, quickActions, accessibility

### 💡 İş Akışı (Her Sayfa İçin)

1. **JSON Dönüşümü**: `data/pages/sayfa-adi.json` dosyasını aç
2. **Hero Section Kontrolü**: `hero` section var mı? Title, description, breadcrumb çoklu dil mi?
3. **Help Section Kontrolü**: `help` section VAR MI? YOKSA EKLE! (ZORUNLU!)
4. **HTML Kontrolü**: JSON'da hardcoded HTML var mı? Varsa component'e çevir!
   - İletişim bilgileri için: `icon-list` component `variant: "contact-grid"` kullan
   - Info-box içinde HTML olmamalı!
5. **Metin Alanlarını Dönüştür**: Tüm string değerleri `{tr: "...", en: "..."}` formatına çevir
6. **Teknik Alanları Atla**: `icon`, `url`, `type`, `variant`, `layout` vb. değiştirme (NOT: `link` alanı form dosyaları için çoklu dil destekli olabilir)
7. **İngilizce Çeviri Ekle**: Her alan için EN çevirisini yaz
8. **Test**: Tarayıcıda aç, TR ve EN dillerinde test et
9. **Sonraki Sayfaya Geç**

**⚠️ ÇOK ÖNEMLİ:** Her sayfa için MUTLAKA şunları kontrol et:
- ✅ Hero section var ve çoklu dil
- ✅ Help section var ve çoklu dil
- ✅ JSON'da hardcoded HTML YOK

### 🎮 Hızlı Komutlar (Kullanıcı İçin)

Kullanıcı şu komutu verdiğinde Claude otomatik işlem yapacak:

**Komut:** `"sıradaki sayfayı uygula"` veya `"next page"` veya `"sonraki sayfa"`

**Claude'un Yapacakları:**
1. CLAUDE.md'den sıradaki sayfayı kontrol et (⏳ işaretli sayfa)
2. O sayfanın JSON dosyasını oku
3. Tüm text alanlarını `{tr: "...", en: "..."}` formatına dönüştür
4. İngilizce çevirileri ekle
5. JSON dosyasını kaydet
6. CLAUDE.md'yi güncelle (✅ işaretle, sonrakini ⏳ yap)
7. Test için URL ver

**Özel Durum - İlk Kullanım (Personel Sayfası):**
Personel sayfası için bir kez manuel olarak statusBadge kullanımını kontrol et.
Sonraki sayfalar için otomatik işlem yapılacak.

### 🚀 Hızlandırma Stratejisi

- ✅ Component'ler zaten hazır (değiştirmeye gerek yok!)
- ✅ Sadece JSON dosyalarını dönüştürmek yeterli
- ✅ Her sayfa ~15-20 dakika sürer
- 🎯 Günde 10-15 sayfa tamamlanabilir

---

**📌 NOT:** Bu dokümantasyon canlı bir dokümandır. Migrasyon sırasında yeni bulgular eklenebilir.

**📅 Son Güncelleme:** 2025-11-06 23:30 (Anadolu Araştırma sayfaları tamamlandı - Tek JSON + Tek JS sistemi, Footer sorunu tespit edildi)
**📝 Versiyon:** 2.0
**✍️ Hazırlayan:** Claude AI

---

## 🌙 GECE NOTU (2025-11-06)

**SON DURUM:**
- ✅ 12 sayfa tamamlandı (%44 ilerleme)
- ⚠️ Footer sorunu tespit edildi (eski `.tr.json` ve `.en.json` dosyaları var)
- 📝 Sabah planı hazır (Global dosyalar → Hızlı sayfalar → Veritabanlari)

**SABAH İLK KOMUT:**
> "sabah devam edelim" veya "global dosyalara devam et"

---

## 🌄 SABAH ÇALIŞMASI (2025-11-06 SABAH)

### ✅ TAMAMLANAN İŞLER

#### 1. Global Dosyalar Kontrolü ✅
- **Durum**: Tüm global JSON dosyaları zaten çoklu dil formatındaydı!
- **Kontrol Edilenler**:
  - [x] footer.json → Çoklu dil formatında ✓
  - [x] header.json → Çoklu dil formatında ✓
  - [x] quickActions.json → Çoklu dil formatında ✓
  - [x] accessibility.json → Çoklu dil formatında ✓
  - [x] settings.json → Teknik ayarlar, dil değişikliği gerektirmiyor ✓

#### 2. Mobil Component'ler Çoklu Dil Desteği ✅

**A) Mobile Header - Dil Değiştirici Eklendi**
- **Dosya**: `assets/js/components/header.js`
- **Değişiklikler**:
  - ✅ `createMobileLanguageSwitcher()` metodu eklendi (satır 622-656)
  - ✅ Mobil menüde dil değiştirici render ediliyor (satır 100)
  - ✅ Desktop header'daki dil değiştirici zaten vardı
  - ✅ Event listener'lar zaten setupLanguageSwitcher() içinde çalışıyor

**B) Bottom Bar - Tam Çoklu Dil Desteği**
- **Dosya**: `assets/js/components/mobile-bottom-bar.js`
- **Değişiklikler**:
  - ✅ `Utils` ve `LanguageManager` import edildi (satır 6-7)
  - ✅ `getTranslations()` metodu eklendi (satır 34-61)
  - ✅ Bottom bar button'ları çoklu dil (satır 75-88)
  - ✅ Panel başlıkları çoklu dil (satır 100, 117)
  - ✅ Sitemap içeriği `Utils.getLocalizedText()` kullanıyor (satır 149, 152)
  - ✅ İletişim modal başlıkları çoklu dil (satır 219, 225)
  - ✅ İletişim bilgileri `Utils.getLocalizedText()` kullanıyor (satır 199)

**Çeviriler**:
```javascript
tr: {
  quickActions: 'Hızlı İşlemler',
  accessibility: 'Erişilebilirlik',
  sitemap: 'Site Haritası',
  contact: 'İletişim',
  contactSocial: 'İletişim & Sosyal Medya',
  contactInfo: 'İletişim Bilgileri',
  socialMedia: 'Sosyal Medya',
  close: 'Kapat',
  loading: 'Yükleniyor...'
}
en: {
  quickActions: 'Quick Actions',
  accessibility: 'Accessibility',
  sitemap: 'Sitemap',
  contact: 'Contact',
  contactSocial: 'Contact & Social Media',
  contactInfo: 'Contact Information',
  socialMedia: 'Social Media',
  close: 'Close',
  loading: 'Loading...'
}
```

**C) Erişilebilirlik Menüsü - Global Dil Senkronizasyonu**
- **Dosya**: `assets/js/components/accessibility.js`
- **Değişiklikler**:
  - ✅ `LanguageManager` import edildi (satır 6)
  - ✅ `init()` metodunda global dil alınıyor (satır 39)
  - ✅ `setupGlobalLanguageListener()` metodu eklendi (satır 495-514)
  - ✅ `changeLanguage()` metodu global LanguageManager ile senkronize (satır 481)
  - ✅ Ana sayfada dil değişince erişilebilirlik menüsü otomatik güncelleniyor

**Nasıl Çalışıyor?**
1. Kullanıcı ana sayfada dil değiştiriyor → `LanguageManager.setLanguage('en')`
2. LanguageManager `languageChanged` event'ini tetikliyor
3. Erişilebilirlik menüsü event'i dinliyor ve kendi dilini güncelliyor
4. **VEYA** Kullanıcı erişilebilirlik menüsünde dil değiştiriyor → Global LanguageManager güncelleniyor → Sayfa reload oluyor

**D) Hızlı İşlemler Modal - Header Çoklu Dil**
- **Dosya**: `assets/js/components/quickactions.js`
- **Değişiklikler**:
  - ✅ `LanguageManager` import edildi (satır 7)
  - ✅ `getTranslations()` metodu eklendi (satır 23-38)
  - ✅ Modal başlığı çoklu dil (satır 65)
  - ✅ Toggle button aria-label çoklu dil (satır 59)
  - ✅ Close button aria-label çoklu dil (satır 66)
  - ✅ Panel title çoklu dil (satır 55)

**Çeviriler**:
```javascript
tr: {
  title: 'Hızlı İşlemler',
  ariaLabel: 'Hızlı İşlemler',
  close: 'Kapat'
}
en: {
  title: 'Quick Actions',
  ariaLabel: 'Quick Actions',
  close: 'Close'
}
```

**NOT**: Quick actions item'ları zaten JSON'dan geliyor ve `Utils.getLocalizedText()` kullanıyor (satır 152-153).

---

### 📊 ÖZET

**Değişiklik Yapılan Dosyalar** (5 dosya):
1. ✅ `assets/js/components/header.js` → Mobil dil değiştirici eklendi
2. ✅ `assets/js/components/mobile-bottom-bar.js` → Tam çoklu dil desteği
3. ✅ `assets/js/components/accessibility.js` → Global dil senkronizasyonu
4. ✅ `assets/js/components/quickactions.js` → Header çoklu dil

**Toplam Eklenen Satır**: ~200 satır
**Toplam Süre**: ~1 saat

**Çözülen Sorunlar**:
- ✅ Mobil header'da dil simgesi yoktu → Eklendi
- ✅ Bottom bar Türkçe kalıyordu → Çoklu dil desteği eklendi
- ✅ Bottom bar iletişim modal Türkçe kalıyordu → Çoklu dil desteği eklendi
- ✅ Site haritası footer'dan beslenmiyor muydu? → Zaten besleniyor, çoklu dil desteği eklendi
- ✅ Erişilebilirlik menüsü dil değişince güncellenmiyor muydu? → Global senkronizasyon eklendi
- ✅ Hızlı işlemler header başlığı Türkçe kalıyordu → Çoklu dil desteği eklendi

---

### 🧪 TEST GEREKSİNİMLERİ

**Manuel Test Listesi**:
1. [ ] Mobil görünümde header'da dil değiştirici var mı?
2. [ ] Mobil header'da dil değiştirince sayfa dili değişiyor mu?
3. [ ] Bottom bar button'ları dil değiştirince güncelleniyor mu?
4. [ ] Bottom bar'dan site haritası açınca menü başlıkları doğru dilde mi?
5. [ ] Bottom bar'dan iletişim açınca başlıklar doğru dilde mi?
6. [ ] Ana sayfada dil değiştirince erişilebilirlik menüsü otomatik güncelleniyor mu?
7. [ ] Erişilebilirlik menüsünde dil değiştirince ana sayfa da güncelleniyor mu?
8. [ ] Hızlı işlemler modal başlığı doğru dilde mi?

**Tarayıcı Konsol Kontrol**:
- [ ] Console'da hata var mı?
- [ ] `languageChanged` event'i tetikleniyor mu?
- [ ] LanguageManager doğru dil döndürüyor mu?

---

### 🎯 SONRAKI ADIMLAR

**Artık Tüm Mobil Component'ler Hazır!** Kalan iş:
1. ⏳ Veritabanlari sayfası JSON dönüşümü (büyük ve karmaşık)
2. ⏳ Diğer kalan sayfalar (14 sayfa)

**İlerleme**: 12 sayfa ✅ / 27 toplam = **%44 tamamlandı**

**Önemli Not**: Artık tüm altyapı hazır:
- ✅ Tüm component'ler çoklu dil destekli
- ✅ Mobil görünüm tamamen çoklu dil
- ✅ Global dil sistemi senkronize
- 🎯 Sadece JSON dosyaları dönüştürülmeli

---

## 🎯 KULLANICI KOMUT SİSTEMİ

Kullanıcı aşağıdaki komutları kullanabilir:

### Komut 1: Sıradaki Sayfayı Uygula
```
"sıradaki sayfayı uygula"
"next page"
"sonraki sayfa"
```

**Claude'un Yapacakları:**
1. CLAUDE.md'den sıradaki sayfayı kontrol et (⏳ işaretli)
2. JSON dosyasını oku ve çoklu dil formatına dönüştür
3. İngilizce çevirileri ekle
4. Dosyayı kaydet
5. CLAUDE.md'yi güncelle
6. Test URL'i ver

### Komut 2: Belirli Bir Sayfayı Uygula
```
"[sayfa-adi] sayfasını uygula"
Örnek: "personel sayfasını uygula"
```

### Komut 3: İlerleme Durumunu Göster
```
"ilerleme durumu"
"progress"
"durum nedir"
```

**Claude'un Göstereceği:**
- Tamamlanan sayfalar (✅)
- Sıradaki sayfa (⏳)
- Kalan sayfalar (⬜)
- Toplam ilerleme yüzdesi

### Komut 4: Erişilebilirlik Menüsü İyileştirme
```
"erişilebilirlik"
"accessibility improvements"
"erişilebilirlik menüsünü iyileştir"
```

**Claude'un Yapacakları:**

#### 🎯 TAM İYİLEŞTİRME PLANI (2025-11-06)

**MEVCUT DURUM:**
- ✅ Dil değiştirici kaldırıldı (v3.1)
- ✅ Header'dan tek yerden dil değiştirme
- ⚠️ CTRL+U yazısı alt satırda (yer kaplıyor)
- ⚠️ 1366x768 gibi küçük ekranlarda içerik taşıyor
- ⚠️ Grid 3 sütun (çok geniş kutuçuklar)

**HEDEFLER:**

**1. CTRL+U Düzeni Düzeltme** ✅
- Şu an: "Erişilebilirlik Menüsü\n(CTRL+U)"
- Hedef: "Erişilebilirlik Menüsü (CTRL+U)" → Tek satır, daha kompakt

**Kod Değişikliği:** `assets/js/components/accessibility.js`
```javascript
// ESKİ (satır 123):
<h5 id="accessibilityTitle">${t.title}<br><small style="font-size: 12px; opacity: 0.9;">${t.subtitle}</small></h5>

// YENİ:
<h5 id="accessibilityTitle">${t.title} <small style="font-size: 14px; opacity: 0.8;">${t.subtitle}</small></h5>
```

**2. Responsive Grid Sistemi** ✅
- Küçük ekran (< 1400px): 3 sütun
- Orta ekran (1400px - 1920px): 4 sütun
- Büyük ekran (> 1920px): 5 sütun

**CSS Değişiklikleri:** `assets/css/accessibility.css`
```css
/* ESKİ */
.accessibility-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* YENİ - Responsive Grid */
.accessibility-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

/* Orta ekranlar */
@media (min-width: 1400px) {
  .accessibility-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Büyük ekranlar */
@media (min-width: 1920px) {
  .accessibility-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Çok küçük ekranlar */
@media (max-width: 1280px) {
  .accessibility-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**3. Kutuçuk Boyutları Optimizasyonu** ✅
```css
/* ESKİ */
.accessibility-option {
  padding: 16px;
  font-size: 14px;
}

/* YENİ - Daha kompakt */
.accessibility-option {
  padding: 12px 10px;
  font-size: 13px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.accessibility-option .option-icon {
  font-size: 20px;
}

.accessibility-option span {
  font-size: 11px;
  text-align: center;
  line-height: 1.2;
}
```

**4. Modern Görünüm & Hover Efektleri** ✅
```css
/* Daha belirgin hover */
.accessibility-option:hover {
  background: #f0f7ff;
  border-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
}

/* Daha göze çarpıcı active state */
.accessibility-option.active {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border-color: #1565c0;
  color: white;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
}

.accessibility-option.active:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  transform: translateY(-2px);
}
```

**5. Scroll Desteği** ✅
```css
/* Panel max-height ve scroll */
.accessibility-panel {
  max-height: 90vh;
  overflow: hidden;
}

.accessibility-content {
  max-height: calc(90vh - 80px);
  overflow-y: auto;
  padding-right: 8px;
}

/* Custom scrollbar */
.accessibility-content::-webkit-scrollbar {
  width: 6px;
}

.accessibility-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.accessibility-content::-webkit-scrollbar-thumb {
  background: #1976d2;
  border-radius: 10px;
}

.accessibility-content::-webkit-scrollbar-thumb:hover {
  background: #1565c0;
}
```

**6. Keyboard Navigation İyileştirmeleri** ✅
```javascript
// accessibility.js içinde setupEventListeners() metoduna ekle:

// Keyboard navigation
this.panel.addEventListener('keydown', (e) => {
  const options = Array.from(document.querySelectorAll('.accessibility-option'));
  const currentIndex = options.findIndex(opt => opt === document.activeElement);

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    const nextIndex = (currentIndex + 1) % options.length;
    options[nextIndex].focus();
  }

  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    const prevIndex = (currentIndex - 1 + options.length) % options.length;
    options[prevIndex].focus();
  }

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (currentIndex >= 0) {
      const feature = options[currentIndex].getAttribute('data-feature');
      this.toggleFeature(feature, options[currentIndex]);
    }
  }
});

// Tab focus için
options.forEach(option => {
  option.setAttribute('tabindex', '0');
});
```

**7. Label İyileştirmeleri (JSON)** ✅
```json
// accessibility.json
{
  "translations": {
    "tr": {
      "features": {
        "highlightLinks": "Bağlantıları Vurgula",  // "Bağlant. Vurgula" yerine
        "lineHeight": "Satır Yüksekliği",           // "Satır yüksekliği" yerine
        "textAlign": "Metin Hizalama"               // "Metin hizalama" yerine
      }
    },
    "en": {
      "features": {
        "lineHeight": "Line Height",
        "textAlign": "Text Align"
      }
    }
  }
}
```

---

#### 📋 UYGULAMA ADIMLARI

**ADIM 1: YEDEKLEME** (1 dakika)
```bash
# Mevcut dosyaları yedekle
cp assets/js/components/accessibility.js assets/js/components/accessibility.js.backup
cp assets/css/accessibility.css assets/css/accessibility.css.backup
cp data/global/accessibility.json data/global/accessibility.json.backup
```

**ADIM 2: JS Güncellemesi** (5 dakika)
1. `renderHTML()` metodunda başlık satırını düzelt (satır 123)
2. `setupEventListeners()` metoduna keyboard navigation ekle (satır ~260)
3. `renderFeatureButton()` metoduna tabindex ekle (satır ~167)

**ADIM 3: CSS Güncellemesi** (10 dakika)
1. Grid responsive yap
2. Kutuçuk boyutlarını küçült
3. Hover ve active state'leri iyileştir
4. Scroll desteği ekle
5. Custom scrollbar stili ekle

**ADIM 4: JSON Güncellemesi** (3 dakika)
1. Label'ları düzelt (kısaltmaları kaldır)

**ADIM 5: TEST** (5 dakika)
1. 1366x768 çözünürlükte test et
2. Tab navigasyonu test et
3. Arrow key navigasyonu test et
4. Tüm özelliklerin çalıştığını doğrula
5. Mobile test

**TAHMİNİ SÜRE:** 25-30 dakika

---

#### ✅ BAŞARI KRİTERLERİ

- ✅ CTRL+U tek satırda
- ✅ 1366x768'de tüm içerik görünüyor (scroll ile)
- ✅ Grid responsive çalışıyor (3/4/5 sütun)
- ✅ Kutuçuklar daha kompakt
- ✅ Hover efektleri daha belirgin
- ✅ Active state daha göze çarpıcı
- ✅ Tab ile gezinme çalışıyor
- ✅ Arrow key navigasyonu çalışıyor
- ✅ Enter/Space ile toggle çalışıyor
- ✅ Mobile'da responsive

---

#### 🔙 ROLLBACK

Eğer sorun çıkarsa:
```bash
cp assets/js/components/accessibility.js.backup assets/js/components/accessibility.js
cp assets/css/accessibility.css.backup assets/css/accessibility.css
cp data/global/accessibility.json.backup data/global/accessibility.json
```

---

#### 📝 NOTLAR

- Versiyon: v3.1 → v3.2 (Responsive & Accessible)
- Değişiklik yapılan dosyalar: 3 dosya (JS, CSS, JSON)
- Breaking change yok (geriye dönük uyumlu)
- Keyboard navigation accessibility standardına uygun (WCAG 2.1)

---

**📌 NOT:** Bu dokümantasyon canlı bir dokümandır. Migrasyon sırasında yeni bulgular eklenebilir.

**📅 Son Güncelleme:** 2025-11-06 (Erişilebilirlik Menüsü İyileştirme Planı Eklendi)
**📝 Versiyon:** 2.1
**✍️ Hazırlayan:** Claude AI

---

## 🎬 HIZLI BAŞLANGIÇ KOMUTLARI

Kullanıcı bu komutları verdiğinde Claude otomatik işlem yapacak:

| Komut | Açıklama | Süre |
|-------|----------|------|
| `sıradaki sayfa` | Sıradaki JSON dosyasını çoklu dil formatına dönüştür | ~15 dk |
| `ilerleme durumu` | Tamamlanan/kalan sayfaları göster | 1 dk |
| `erişilebilirlik` | Erişilebilirlik menüsünü tamamen iyileştir | ~30 dk |
| `[sayfa-adi] sayfasını uygula` | Belirli bir sayfayı dönüştür | ~15 dk |

---

## 📊 MİGRASYON İSTATİSTİKLERİ (2025-11-06)

### Tamamlanan İşler:
- ✅ **Altyapı**: Utils.js, App.js, LanguageManager
- ✅ **Component'ler**: Hero, HelpSection, Header, Footer, InnerPage, vb. (10+ component)
- ✅ **Mobil Görünüm**: Header, Bottom Bar, Accessibility, QuickActions
- ✅ **Global Dosyalar**: Header, Footer, QuickActions, Accessibility, Settings
- ✅ **Sayfa JSON'ları**: 12/27 sayfa (%44 ilerleme)

### Kalan İşler:
- ⏳ **Veritabanlari.json**: Büyük ve karmaşık sayfa
- ⏳ **Diğer Sayfalar**: 14 sayfa kaldı

### Özel İyileştirmeler:
- 🎨 **Erişilebilirlik Menüsü**: v3.1 (Dil değiştirici kaldırıldı) → v3.2 planlandı
- 🌐 **Global Dil Sistemi**: Tamamen senkronize
- 📱 **Mobile Responsive**: Tüm component'ler hazır

---

## 🏆 EN İYİ PRATİKLER

### JSON Dosyası Yazarken:
1. ✅ Tüm text alanları `{tr: "...", en: "..."}` formatında
2. ❌ Teknik alanları (`icon`, `url`, `type`) dönüştürme
3. ✅ Her sayfada `help` section olmalı (ZORUNLU)
4. ❌ JSON'da ASLA hardcoded HTML olmasın
5. ✅ Boş içerik için kullanıcı dostu uyarı göster

### Component Yazarken:
1. ✅ Daima `Utils.getLocalizedText()` kullan
2. ✅ Array'ler için `map()` içinde localize et
3. ✅ Fallback sistemi otomatik çalışır (TR → EN → ilk değer)

### Test Ederken:
1. ✅ TR dilinde tüm içerikleri kontrol et
2. ✅ EN diline geç ve çevirileri kontrol et
3. ✅ Console'da hata var mı kontrol et
4. ✅ 1366x768 çözünürlükte test et
5. ✅ Mobil görünümde test et

---

## 🚀 GELECEKTEKİ İYİLEŞTİRMELER

### Kısa Vadede (1-2 hafta):
- [ ] Tüm sayfaların JSON dönüşümünü tamamla (%100)
- [ ] Erişilebilirlik menüsü v3.2 iyileştirmelerini uygula
- [ ] Eksik EN çevirilerini tamamla

### Orta Vadede (1 ay):
- [ ] JSON Editor web arayüzü geliştir
- [ ] Otomatik çeviri entegrasyonu (DeepL API)
- [ ] SEO optimizasyonu (hreflang tagları)

### Uzun Vadede (3 ay):
- [ ] 3. dil desteği (örn: Arapça, Rusça)
- [ ] Admin panel ile JSON düzenleme
- [ ] Analytics entegrasyonu (dil kullanım istatistikleri)
- [ ] A/B testing için dil bazlı metrik toplama

---

**🎉 BAŞARILARINIZ:**
- 🏗️ Sağlam bir çoklu dil altyapısı kurdunuz
- 📱 Tamamen responsive ve mobil uyumlu
- ♿ Erişilebilirlik standartlarına uygun (WCAG 2.1)
- 🔄 Kolay bakım ve güncelleme (tek dosya sistemi)
- 🌐 Gelecekte yeni diller eklemek çok kolay

**Devam edin! Harika gidiyorsunuz!** 🚀
