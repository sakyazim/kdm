# 📋 UZUN METİNLİ SAYFALAR İÇİN HYBRİD TOC SİSTEMİ

**Hazırlanma Tarihi:** 2025-11-06
**Amaç:** Uzun içerikli sayfalar için Desktop Sticky Sidebar + Mobile Left Drawer navigasyon sistemi

---

## 🎯 SİSTEM ÖZETİ

### Desktop (>1024px):
- Sol tarafta sticky sidebar TOC
- Scroll ile aktif bölüm otomatik işaretlenir
- Progress bar üstte

### Mobile (≤1024px):
- Sol kenarda vertical "İçindekiler" tab (site renk tonlamaları)
- Tıklayınca drawer açılır (**280px genişlik, içeriği kapatmaz**)
- Overlay ile arka plan kararır
- Bölüme gidince otomatik kapanır

---

## 🎨 TASARIM PRENSİPLERİ

1. **Site Renk Tonları:** Mavi (#1976d2, #42a5f5) yerine sitenin ana renkleri kullanılacak
2. **Drawer Genişliği:** 280px (kompakt, içeriği kapatmaz)
3. **Temiz Başlangıç:** Eski TOC kodları (mini-toc vs.) tamamen temizlenecek
4. **Gruplandırma Desteği:** Bazı sayfalarda (örn: arastirmaci-profili-olusturma) bölümler gruplandırılabilir

---

## 📋 UYGULAMA PLANI

### İlk Sayfa: makale-islem-ucretleri.html

**Adımlar:**
1. ✅ Eski TOC kodlarını temizle
2. ✅ JSON yapısını hazırla (sections + grouping desteği)
3. ✅ Component class oluştur (HybridTOC)
4. ✅ CSS ile site renkleri entegrasyonu
5. ✅ Test

---

## 📁 DOSYA YAPISI

```
assets/js/components/
└── hybrid-toc.js          (Yeni component)

assets/css/
└── hybrid-toc.css         (Yeni stil dosyası)

data/pages/
└── makale-islem-ucretleri.json  (TOC sections eklenmeli)

assets/js/pages/
└── makale-islem-ucretleri.js    (Sayfa class'ı)
```

---

## 🔧 JSON YAPISI

### Basit Sayfa (Gruplandırma Yok):

```json
{
  "meta": { ... },
  "hero": { ... },
  "toc": {
    "enabled": true,
    "sections": [
      {
        "id": "section1",
        "title": {
          "tr": "Genel Bilgiler",
          "en": "General Information"
        }
      },
      {
        "id": "section2",
        "title": {
          "tr": "Ücret Tarifeleri",
          "en": "Fee Schedule"
        }
      }
    ]
  },
  "content": { ... }
}
```

### Gruplandırmalı Sayfa:

```json
{
  "toc": {
    "enabled": true,
    "grouped": true,
    "groups": [
      {
        "title": {
          "tr": "Başlangıç",
          "en": "Getting Started"
        },
        "sections": [
          {
            "id": "section1",
            "title": {
              "tr": "Hesap Oluşturma",
              "en": "Account Creation"
            }
          },
          {
            "id": "section2",
            "title": {
              "tr": "Profil Ayarları",
              "en": "Profile Settings"
            }
          }
        ]
      },
      {
        "title": {
          "tr": "İleri Seviye",
          "en": "Advanced"
        },
        "sections": [...]
      }
    ]
  }
}
```

---

## 💻 COMPONENT KODU

### hybrid-toc.js

```javascript
import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';

/**
 * Hybrid TOC Component
 * Desktop: Sticky Sidebar
 * Mobile: Left Drawer
 */
export class HybridTOC {
  constructor() {
    this.isDrawerOpen = false;
    this.sections = [];
    this.grouped = false;
  }

  /**
   * Initialize TOC
   * @param {Object} tocData - TOC configuration from JSON
   */
  init(tocData) {
    if (!tocData || !tocData.enabled) {
      return;
    }

    this.grouped = tocData.grouped || false;
    this.sections = this.grouped ? tocData.groups : tocData.sections;

    this.render();
    this.setupEventListeners();
  }

  /**
   * Render TOC HTML
   */
  render() {
    // Create container
    const container = document.createElement('div');
    container.className = 'hybrid-toc-container';
    container.innerHTML = `
      <!-- Progress Bar -->
      <div class="toc-progress-bar">
        <div class="toc-progress-fill" id="tocProgressFill"></div>
      </div>

      <!-- Mobile Toggle Tab -->
      <button class="toc-mobile-toggle" id="tocMobileToggle" aria-label="İçindekiler">
        <span class="toc-toggle-text">İçindekiler</span>
      </button>

      <!-- Mobile Drawer -->
      <div class="toc-mobile-drawer" id="tocMobileDrawer">
        <div class="toc-drawer-header">
          <h3>${Utils.getLocalizedText({ tr: 'İçindekiler', en: 'Table of Contents' })}</h3>
          <button class="toc-drawer-close" id="tocDrawerClose" aria-label="Kapat">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="toc-drawer-progress">
          <span class="toc-progress-text">${Utils.getLocalizedText({ tr: 'Okuma İlerlemeniz', en: 'Reading Progress' })}</span>
          <div class="toc-progress-track">
            <div class="toc-progress-fill-drawer" id="tocProgressFillDrawer"></div>
          </div>
        </div>
        <div class="toc-drawer-content">
          ${this.renderTOCList('drawer')}
        </div>
      </div>

      <!-- Desktop Sidebar -->
      <aside class="toc-desktop-sidebar">
        <h3>${Utils.getLocalizedText({ tr: 'İçindekiler', en: 'Table of Contents' })}</h3>
        ${this.renderTOCList('desktop')}
      </aside>

      <!-- Overlay -->
      <div class="toc-overlay" id="tocOverlay"></div>
    `;

    // Insert at beginning of body
    document.body.insertBefore(container, document.body.firstChild);
  }

  /**
   * Render TOC list (for both desktop and mobile)
   */
  renderTOCList(context) {
    const listClass = context === 'drawer' ? 'toc-drawer-list' : 'toc-desktop-list';

    if (this.grouped) {
      // Grouped sections
      return `<div class="${listClass}">
        ${this.sections.map((group, groupIndex) => `
          <div class="toc-group">
            <div class="toc-group-title">${Utils.getLocalizedText(group.title)}</div>
            <ul>
              ${group.sections.map((section, index) => `
                <li>
                  <a href="#${section.id}" data-section="${section.id}" class="toc-link">
                    <span class="toc-number">${groupIndex + 1}.${index + 1}</span>
                    <span class="toc-text">${Utils.getLocalizedText(section.title)}</span>
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>`;
    } else {
      // Simple sections
      return `<ul class="${listClass}">
        ${this.sections.map((section, index) => `
          <li>
            <a href="#${section.id}" data-section="${section.id}" class="toc-link">
              <span class="toc-number">${index + 1}</span>
              <span class="toc-text">${Utils.getLocalizedText(section.title)}</span>
            </a>
          </li>
        `).join('')}
      </ul>`;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mobile toggle
    const toggle = document.getElementById('tocMobileToggle');
    const drawer = document.getElementById('tocMobileDrawer');
    const overlay = document.getElementById('tocOverlay');
    const closeBtn = document.getElementById('tocDrawerClose');

    toggle?.addEventListener('click', () => this.openDrawer());
    closeBtn?.addEventListener('click', () => this.closeDrawer());
    overlay?.addEventListener('click', () => this.closeDrawer());

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDrawerOpen) {
        this.closeDrawer();
      }
    });

    // TOC link clicks
    document.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        this.navigateToSection(sectionId);
      });
    });

    // Scroll tracking
    window.addEventListener('scroll', () => {
      this.updateActiveSection();
      this.updateProgressBar();
    });

    // Initial update
    this.updateActiveSection();
    this.updateProgressBar();
  }

  /**
   * Open mobile drawer
   */
  openDrawer() {
    this.isDrawerOpen = true;
    document.getElementById('tocMobileDrawer')?.classList.add('open');
    document.getElementById('tocOverlay')?.classList.add('active');
    document.getElementById('tocMobileToggle')?.classList.add('hidden');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  }

  /**
   * Close mobile drawer
   */
  closeDrawer() {
    this.isDrawerOpen = false;
    document.getElementById('tocMobileDrawer')?.classList.remove('open');
    document.getElementById('tocOverlay')?.classList.remove('active');
    document.getElementById('tocMobileToggle')?.classList.remove('hidden');
    document.body.style.overflow = ''; // Restore body scroll
  }

  /**
   * Navigate to section
   */
  navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const offset = 80; // Header height
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Close drawer if mobile
      if (window.innerWidth <= 1024) {
        setTimeout(() => this.closeDrawer(), 300);
      }
    }
  }

  /**
   * Update active section based on scroll
   */
  updateActiveSection() {
    const sections = document.querySelectorAll('[id^="section"]');
    let currentSection = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150 && rect.bottom >= 150) {
        currentSection = section.id;
      }
    });

    // Update active state
    document.querySelectorAll('.toc-link').forEach(link => {
      if (link.getAttribute('data-section') === currentSection) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Update progress bar
   */
  updateProgressBar() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

    const progressFill = document.getElementById('tocProgressFill');
    const drawerProgressFill = document.getElementById('tocProgressFillDrawer');

    if (progressFill) progressFill.style.width = `${scrollPercent}%`;
    if (drawerProgressFill) drawerProgressFill.style.width = `${scrollPercent}%`;
  }

  /**
   * Destroy TOC (cleanup)
   */
  destroy() {
    document.querySelector('.hybrid-toc-container')?.remove();
    document.body.style.overflow = '';
  }
}

// Export singleton instance
export default new HybridTOC();
```

---

## 🎨 CSS DOSYASI

### hybrid-toc.css

```css
/* ========================================
   HYBRID TOC STYLES
   ======================================== */

/* Progress Bar (Top) */
.toc-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--color-border, #e0e0e0);
  z-index: 9999;
}

.toc-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #8B0000), var(--color-primary-light, #A52A2A));
  width: 0%;
  transition: width 0.2s ease;
}

/* ========================================
   MOBILE DRAWER (≤1024px)
   ======================================== */

/* Mobile Toggle Tab (Left Side) */
.toc-mobile-toggle {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 100px;
  background: var(--color-primary, #8B0000);
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 998;
  transition: all 0.3s ease;
}

.toc-toggle-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.toc-mobile-toggle:hover {
  width: 44px;
  box-shadow: 3px 0 12px rgba(0, 0, 0, 0.2);
}

.toc-mobile-toggle.hidden {
  left: -40px;
}

/* Mobile Drawer */
.toc-mobile-drawer {
  position: fixed;
  left: -280px;
  top: 0;
  width: 280px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: none;
  flex-direction: column;
  overflow: hidden;
}

.toc-mobile-drawer.open {
  left: 0;
}

/* Drawer Header */
.toc-drawer-header {
  padding: 20px;
  background: var(--color-primary, #8B0000);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toc-drawer-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.toc-drawer-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.toc-drawer-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Drawer Progress */
.toc-drawer-progress {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.toc-progress-text {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toc-progress-track {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.toc-progress-fill-drawer {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #8B0000), var(--color-primary-light, #A52A2A));
  width: 0%;
  transition: width 0.3s ease;
}

/* Drawer Content */
.toc-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.toc-drawer-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-drawer-list li {
  margin-bottom: 4px;
}

.toc-drawer-list .toc-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  color: #555;
  text-decoration: none;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toc-drawer-list .toc-link:hover {
  background: #f0f0f0;
  color: var(--color-primary, #8B0000);
}

.toc-drawer-list .toc-link.active {
  background: var(--color-primary-light, rgba(139, 0, 0, 0.1));
  color: var(--color-primary, #8B0000);
  font-weight: 600;
  border-left: 3px solid var(--color-primary, #8B0000);
}

.toc-number {
  width: 24px;
  height: 24px;
  background: #f0f0f0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.toc-drawer-list .toc-link.active .toc-number {
  background: var(--color-primary, #8B0000);
  color: white;
}

/* Grouped Sections */
.toc-group {
  margin-bottom: 20px;
}

.toc-group-title {
  font-size: 12px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px;
  margin-bottom: 4px;
}

.toc-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Overlay */
.toc-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 998;
  display: none;
}

.toc-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* ========================================
   DESKTOP SIDEBAR (>1024px)
   ======================================== */

.toc-desktop-sidebar {
  position: fixed;
  left: 20px;
  top: 120px;
  width: 260px;
  max-height: calc(100vh - 140px);
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  display: none;
  z-index: 100;
}

.toc-desktop-sidebar h3 {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-border, #e0e0e0);
}

.toc-desktop-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-desktop-list li {
  margin-bottom: 6px;
}

.toc-desktop-list .toc-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  color: #555;
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.toc-desktop-list .toc-link:hover {
  background: #f0f0f0;
  color: var(--color-primary, #8B0000);
  padding-left: 14px;
}

.toc-desktop-list .toc-link.active {
  background: var(--color-primary-light, rgba(139, 0, 0, 0.1));
  color: var(--color-primary, #8B0000);
  border-left-color: var(--color-primary, #8B0000);
  font-weight: 600;
  padding-left: 14px;
}

.toc-desktop-list .toc-number {
  width: 22px;
  height: 22px;
  font-size: 11px;
}

/* Custom Scrollbar */
.toc-desktop-sidebar::-webkit-scrollbar,
.toc-drawer-content::-webkit-scrollbar {
  width: 6px;
}

.toc-desktop-sidebar::-webkit-scrollbar-track,
.toc-drawer-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.toc-desktop-sidebar::-webkit-scrollbar-thumb,
.toc-drawer-content::-webkit-scrollbar-thumb {
  background: var(--color-primary, #8B0000);
  border-radius: 10px;
}

/* ========================================
   RESPONSIVE BREAKPOINTS
   ======================================== */

/* Desktop: Show sidebar */
@media (min-width: 1025px) {
  .toc-desktop-sidebar {
    display: block;
  }

  /* Push main content to right */
  body.has-toc .page-container,
  body.has-toc .main-content {
    margin-left: 300px;
  }
}

/* Mobile: Show drawer elements */
@media (max-width: 1024px) {
  .toc-mobile-toggle {
    display: flex;
  }

  .toc-mobile-drawer {
    display: flex;
  }

  .toc-overlay {
    display: block;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .toc-mobile-drawer {
    width: calc(100vw - 40px);
    left: calc(-100vw + 40px);
  }

  .toc-toggle-text {
    font-size: 10px;
  }
}
```

---

## 📝 UYGULAMA TALİMATI

Kullanıcı aşağıdaki komutu verdiğinde otomatik işlem başlasın:

**KOMUT:** `"[sayfa-adi] için hybrid toc uygula"`

**Örnek:** `"makale-islem-ucretleri için hybrid toc uygula"`

### Claude'un Yapacakları:

1. **Temizlik:**
   - Eski TOC kodlarını bul ve sil (mini-toc, float-toc vs.)
   - İlgili CSS dosyalarından eski TOC stillerini temizle
   - Sayfa HTML'inden eski TOC markup'ını kaldır

2. **Component Oluşturma (İlk kez için):**
   - `assets/js/components/hybrid-toc.js` oluştur (yoksa)
   - `assets/css/hybrid-toc.css` oluştur (yoksa)

3. **JSON Güncelleme:**
   - `data/pages/[sayfa-adi].json` aç
   - İçeriği analiz et, bölümleri tespit et
   - `toc` section ekle (sections tanımla)
   - Her section için ID ve başlık belirle

4. **Sayfa JS Güncelleme:**
   - `assets/js/pages/[sayfa-adi].js` oluştur/güncelle
   - HybridTOC component'ini import et
   - `render()` metodunda TOC init et
   - Content render'da section ID'lerini ekle

5. **HTML Güncelleme:**
   - Content section'larına ID ekle (`id="section1"` vb.)
   - `<body>` tag'ine `has-toc` class ekle

6. **CSS Entegrasyonu:**
   - Site renk değişkenlerini kontrol et
   - `hybrid-toc.css`'i `main.css` veya `index.html`'e import et

7. **Test:**
   - Desktop'ta sidebar test
   - Mobile'da drawer test
   - Scroll tracking test
   - Progress bar test

---

## 🎨 SİTE RENKLERİ

CSS değişkenleri (mevcut sistemden alınacak):
```css
--color-primary: #8B0000;        /* Koyu kırmızı */
--color-primary-light: #A52A2A;  /* Açık kırmızı */
--color-border: #e0e0e0;         /* Border rengi */
```

**ÖNEMLİ:** Eğer site farklı renkler kullanıyorsa, CSS'teki `var(--color-primary)` değerlerini güncelleyin.

---

## 📋 SAYFA LİSTESİ (İleriki Uygulamalar)

### Uzun İçerikli Sayfalar (TOC Gerekli):
1. ✅ makale-islem-ucretleri.json (TAMAMLANDI - 2025-11-06)
   - ✅ JSON'a çoklu dil TOC section eklendi
   - ✅ JS'e hybrid TOC fonksiyonları eklendi
   - ✅ CSS'e hybrid TOC stilleri eklendi
   - ✅ Desktop: Sidebar TOC (280px, sticky)
   - ✅ Mobile: Sticky dropdown TOC (top)
   - ✅ Auto-highlight ve smooth scroll çalışıyor
2. ⬜ arastirmaci-profili-olusturma.json (Gruplandırmalı)
3. ⬜ kutuphane-kurallari.json
4. ⬜ uyelik-odunc-islemleri.json
5. ⬜ uzaktan-erisim.json
6. ⬜ mendeley-referans-yonetim-araci.json

### Gruplandırma Gerekebilecek Sayfalar:
- arastirmaci-profili-olusturma (Hesap Oluşturma / Profil Ayarları / Veri Girişi)

---

## ✅ BAŞARI KRİTERLERİ

- ✅ Desktop'ta sidebar görünüyor ve sticky çalışıyor
- ✅ Mobile'da sol kenarda tab görünüyor
- ✅ Drawer 280px genişlikte, içeriği kapatmıyor
- ✅ Site renkleri kullanılıyor (mavi yok)
- ✅ Scroll tracking çalışıyor (aktif bölüm işaretleniyor)
- ✅ Progress bar güncelleniyor
- ✅ ESC tuşu ile kapanıyor
- ✅ Smooth scroll çalışıyor
- ✅ Overlay tıklayınca kapanıyor
- ✅ Eski TOC kodları tamamen temizlenmiş
- ✅ Console'da hata yok

---

## 🔙 ROLLBACK PLANI

Eğer sorun çıkarsa:
1. `assets/js/components/hybrid-toc.js` sil
2. `assets/css/hybrid-toc.css` sil
3. JSON'dan `toc` section'ı sil
4. Sayfa JS'inden HybridTOC import'unu kaldır
5. HTML'den section ID'lerini ve `has-toc` class'ını kaldır

---

## 🐛 SORUN GİDERME

### Sidebar görünmüyor:
- `<body>` tag'inde `has-toc` class var mı?
- CSS import edilmiş mi?
- Console'da hata var mı?

### Drawer açılmıyor:
- Mobile toggle butonu görünüyor mu? (≤1024px)
- Event listener'lar çalışıyor mu?
- z-index değerleri doğru mu?

### Active section işaretlenmiyor:
- Section ID'leri doğru tanımlanmış mı? (`id="section1"` vb.)
- Scroll event listener çalışıyor mu?
- Section offset hesaplaması doğru mu?

### Progress bar çalışmıyor:
- `tocProgressFill` ve `tocProgressFillDrawer` elementleri mevcut mu?
- Scroll event listener çalışıyor mu?

---

## 💡 İYİLEŞTİRME FİKİRLERİ

### V2 Features (İleride eklenebilir):
1. **Smooth Indicator:** Aktif bölüm için animasyonlu gösterge
2. **Back to Top:** Sayfanın başına dön butonu
3. **Auto-collapse:** Desktop'ta çok uzun TOC'lar için otomatik grup katla
4. **Keyboard Navigation:** Arrow key ile bölümler arası gezinme
5. **Print Mode:** Yazdırma sırasında TOC'u gizle
6. **Share Section:** Bölüm URL'ini kopyala butonu

---

**📅 Son Güncelleme:** 2025-11-06
**📝 Versiyon:** 1.0
**✍️ Hazırlayan:** Claude AI

---

## 🚀 KULLANIM ÖRNEĞİ

Kullanıcı şu komutu veriyor:
```
"makale-islem-ucretleri için hybrid toc uygula"
```

Claude otomatik olarak:
1. ✅ Eski TOC kodlarını temizler
2. ✅ `hybrid-toc.js` ve `hybrid-toc.css` oluşturur
3. ✅ JSON'a TOC section'ı ekler
4. ✅ Sayfa JS'ini günceller
5. ✅ HTML'e section ID'leri ekler
6. ✅ Test eder ve sonucu bildirir

**Başlamak için komutu verin!** 🎯
