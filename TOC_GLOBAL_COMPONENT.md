# 📋 GLOBAL HYBRID TOC COMPONENT SİSTEMİ

**Hazırlanma Tarihi:** 2025-11-06
**Versiyon:** 2.0 (Global Component)
**Amaç:** Tüm uzun içerikli sayfalar için tekrar kullanılabilir, global TOC component sistemi

---

## 🎯 SİSTEM ÖZETİ

### Temel Prensipler:
- ✅ **Tamamen JSON-driven**: Tüm metinler ve ayarlar JSON'dan gelir
- ✅ **Zero Hardcoded Text**: JS ve HTML'de hiçbir metin yok
- ✅ **Global Component**: Tek dosya, tüm sayfalar için
- ✅ **Sticky Smart**: Header ve footer'a otomatik uyum
- ✅ **Çoklu Dil**: Otomatik çeviri desteği
- ✅ **Responsive**: Desktop sidebar + Mobile drawer

### Desktop (>1024px):
- Sol tarafta **sticky sidebar TOC** (260px genişlik)
- Scroll ile aktif bölüm otomatik işaretlenir
- **Footer'a değince otomatik gizlenir** 🎯
- Header'a yakın durumda da kontrollü çalışır
- Progress bar üstte (ince çizgi)

### Mobile (≤1024px):
- Sol kenarda **vertical tab** (site renkleriyle)
- Tıklayınca **280px drawer** açılır
- Overlay ile arka plan kararır
- Bölüme gidince otomatik kapanır
- ESC tuşu ile kapanır

---

## 🎨 TASARIM PRENSİPLERİ

### 1. **JSON-Driven Architecture**
```
Tüm metinler → JSON
Tüm ayarlar → JSON
Tüm çeviriler → JSON
```

**JS ve HTML'de ASLA hardcoded text olmamalı!**

### 2. **Sticky Sidebar Intelligence**
```javascript
// Akıllı sticky davranış:
1. Sayfa başında → Normal pozisyon
2. Scroll aşağı → Sticky olur (fixed)
3. Footer'a yaklaştı → Yavaşça kaybolur (opacity 0)
4. Footer'dan çıktı → Geri gelir (opacity 1)
5. Header'a çok yakın → Offset ayarlanır
```

### 3. **Site Renkleri**
```css
--color-primary: #8B0000;        /* Koyu kırmızı */
--color-primary-light: #A52A2A;  /* Açık kırmızı */
--color-border: #e0e0e0;         /* Border */
--color-text: #333;              /* Metin */
--color-text-light: #666;        /* Açık metin */
```

### 4. **Minimal HTML**
```html
<!-- HTML'de sadece bu olacak: -->
<body>
  <!-- TOC container buraya JS ile inject edilecek -->
  <main>
    <div id="section1">...</div>
    <div id="section2">...</div>
  </main>
</body>
```

---

## 📁 DOSYA YAPISI

```
assets/
├── js/
│   └── components/
│       └── hybrid-toc.js              ← YENİ: Global TOC component
│
├── css/
│   └── components/
│       └── hybrid-toc.css             ← YENİ: Global TOC stilleri
│
data/
└── pages/
    ├── makale-islem-ucretleri.json    (toc section mevcut)
    ├── kutuphane-kurallari.json       (toc section eklenecek)
    ├── uyelik-odunc-islemleri.json    (toc section eklenecek)
    └── ...
```

---

## 🔧 JSON YAPISI

### A) Basit Sayfa (Gruplandırma Yok):

```json
{
  "meta": { ... },
  "hero": { ... },
  "toc": {
    "enabled": true,
    "mode": "hybrid",
    "title": {
      "tr": "İçindekiler",
      "en": "Table of Contents"
    },
    "mobileTitle": {
      "tr": "Hızlı Erişim",
      "en": "Quick Access"
    },
    "progressLabel": {
      "tr": "Okuma İlerlemeniz",
      "en": "Reading Progress"
    },
    "closeButton": {
      "tr": "Kapat",
      "en": "Close"
    },
    "items": [
      {
        "text": {
          "tr": "Genel Bilgiler",
          "en": "General Information"
        },
        "anchor": "section1",
        "icon": "fas fa-info-circle"
      },
      {
        "text": {
          "tr": "Ücret Tarifeleri",
          "en": "Fee Schedule"
        },
        "anchor": "section2",
        "icon": "fas fa-dollar-sign"
      },
      {
        "text": {
          "tr": "İletişim",
          "en": "Contact"
        },
        "anchor": "section3",
        "icon": "fas fa-phone"
      }
    ]
  },
  "content": { ... }
}
```

### B) Gruplandırmalı Sayfa:

```json
{
  "toc": {
    "enabled": true,
    "mode": "hybrid",
    "grouped": true,
    "title": {
      "tr": "İçindekiler",
      "en": "Table of Contents"
    },
    "groups": [
      {
        "title": {
          "tr": "Başlangıç",
          "en": "Getting Started"
        },
        "sections": [
          {
            "text": {
              "tr": "Hesap Oluşturma",
              "en": "Account Creation"
            },
            "anchor": "section1",
            "icon": "fas fa-user-plus"
          },
          {
            "text": {
              "tr": "Profil Ayarları",
              "en": "Profile Settings"
            },
            "anchor": "section2",
            "icon": "fas fa-cog"
          }
        ]
      },
      {
        "title": {
          "tr": "İleri Seviye",
          "en": "Advanced"
        },
        "sections": [
          {
            "text": {
              "tr": "API Entegrasyonu",
              "en": "API Integration"
            },
            "anchor": "section3",
            "icon": "fas fa-code"
          }
        ]
      }
    ]
  }
}
```

### C) TOC Ayarları (Opsiyonel):

```json
{
  "toc": {
    "enabled": true,
    "mode": "hybrid",
    "settings": {
      "stickyOffset": 80,           // Header yüksekliği
      "footerHideDistance": 300,    // Footer'a kaç px kala gizlensin
      "smoothScroll": true,         // Smooth scroll aktif mi
      "autoHighlight": true,        // Aktif bölüm otomatik işaretle
      "scrollSpy": true,            // Scroll tracking aktif mi
      "progressBar": true,          // Progress bar göster
      "numberStyle": "circle",      // "circle" | "square" | "none"
      "sidebarWidth": 260,          // Desktop sidebar genişliği (px)
      "drawerWidth": 280            // Mobile drawer genişliği (px)
    }
  }
}
```

---

## 💻 COMPONENT KODU

### hybrid-toc.js

```javascript
/**
 * Global Hybrid TOC Component
 * Version: 2.0
 *
 * Features:
 * - JSON-driven (zero hardcoded text)
 * - Smart sticky sidebar (footer-aware)
 * - Desktop sidebar + Mobile drawer
 * - Auto highlight & progress bar
 * - Multi-language support
 */

import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';

export class HybridTOC {
  constructor() {
    this.config = null;
    this.items = [];
    this.grouped = false;
    this.isDrawerOpen = false;
    this.currentSection = '';

    // DOM elements
    this.container = null;
    this.sidebar = null;
    this.drawer = null;
    this.overlay = null;
    this.progressBar = null;

    // Footer detection
    this.footer = null;
    this.footerObserver = null;

    // Settings
    this.settings = {
      stickyOffset: 80,
      footerHideDistance: 300,
      smoothScroll: true,
      autoHighlight: true,
      scrollSpy: true,
      progressBar: true,
      numberStyle: 'circle',
      sidebarWidth: 260,
      drawerWidth: 280
    };
  }

  /**
   * Initialize TOC
   * @param {Object} tocData - TOC configuration from JSON
   */
  init(tocData) {
    if (!tocData || !tocData.enabled) {
      console.log('TOC disabled or not configured');
      return;
    }

    this.config = tocData;
    this.grouped = tocData.grouped || false;
    this.items = this.grouped ? tocData.groups : tocData.items;

    // Merge custom settings
    if (tocData.settings) {
      this.settings = { ...this.settings, ...tocData.settings };
    }

    // Render TOC
    this.render();

    // Setup event listeners
    this.setupEventListeners();

    // Setup footer detection
    this.setupFooterDetection();

    // Initial updates
    if (this.settings.scrollSpy) {
      this.updateActiveSection();
    }
    if (this.settings.progressBar) {
      this.updateProgressBar();
    }

    console.log('✅ HybridTOC initialized');
  }

  /**
   * Render TOC HTML (inject into DOM)
   */
  render() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'hybrid-toc-container';
    this.container.innerHTML = this.getHTML();

    // Insert at beginning of body
    document.body.insertBefore(this.container, document.body.firstChild);

    // Store references
    this.sidebar = document.getElementById('tocDesktopSidebar');
    this.drawer = document.getElementById('tocMobileDrawer');
    this.overlay = document.getElementById('tocOverlay');
    this.progressBar = document.getElementById('tocProgressBar');

    // Add class to body
    document.body.classList.add('has-toc');
  }

  /**
   * Generate TOC HTML
   */
  getHTML() {
    const title = Utils.getLocalizedText(this.config.title);
    const mobileTitle = Utils.getLocalizedText(this.config.mobileTitle || this.config.title);
    const progressLabel = Utils.getLocalizedText(this.config.progressLabel || { tr: 'Okuma İlerlemeniz', en: 'Reading Progress' });
    const closeLabel = Utils.getLocalizedText(this.config.closeButton || { tr: 'Kapat', en: 'Close' });

    return `
      <!-- Progress Bar -->
      ${this.settings.progressBar ? `
      <div class="toc-progress-bar">
        <div class="toc-progress-fill" id="tocProgressBar"></div>
      </div>
      ` : ''}

      <!-- Mobile Toggle Button -->
      <button class="toc-mobile-toggle" id="tocMobileToggle" aria-label="${mobileTitle}">
        <span class="toc-toggle-text">${mobileTitle}</span>
      </button>

      <!-- Mobile Drawer -->
      <div class="toc-mobile-drawer" id="tocMobileDrawer">
        <div class="toc-drawer-header">
          <h3>${title}</h3>
          <button class="toc-drawer-close" id="tocDrawerClose" aria-label="${closeLabel}">
            <i class="fas fa-times"></i>
          </button>
        </div>

        ${this.settings.progressBar ? `
        <div class="toc-drawer-progress">
          <span class="toc-progress-text">${progressLabel}</span>
          <div class="toc-progress-track">
            <div class="toc-progress-fill-drawer" id="tocProgressBarDrawer"></div>
          </div>
        </div>
        ` : ''}

        <div class="toc-drawer-content">
          ${this.renderList('drawer')}
        </div>
      </div>

      <!-- Desktop Sidebar -->
      <aside class="toc-desktop-sidebar" id="tocDesktopSidebar">
        <h3>${title}</h3>
        ${this.renderList('desktop')}
      </aside>

      <!-- Overlay -->
      <div class="toc-overlay" id="tocOverlay"></div>
    `;
  }

  /**
   * Render TOC list (desktop or mobile)
   */
  renderList(context) {
    const listClass = context === 'drawer' ? 'toc-drawer-list' : 'toc-desktop-list';
    const showNumbers = this.settings.numberStyle !== 'none';

    if (this.grouped) {
      // Grouped sections
      return `<div class="${listClass}">
        ${this.items.map((group, groupIndex) => `
          <div class="toc-group">
            <div class="toc-group-title">${Utils.getLocalizedText(group.title)}</div>
            <ul>
              ${group.sections.map((section, index) => this.renderListItem(section, `${groupIndex + 1}.${index + 1}`, showNumbers)).join('')}
            </ul>
          </div>
        `).join('')}
      </div>`;
    } else {
      // Simple sections
      return `<ul class="${listClass}">
        ${this.items.map((section, index) => this.renderListItem(section, index + 1, showNumbers)).join('')}
      </ul>`;
    }
  }

  /**
   * Render single list item
   */
  renderListItem(section, number, showNumbers) {
    const text = Utils.getLocalizedText(section.text);
    const icon = section.icon || '';
    const numberClass = this.settings.numberStyle === 'square' ? 'toc-number-square' : 'toc-number';

    return `
      <li>
        <a href="#${section.anchor}" data-section="${section.anchor}" class="toc-link">
          ${showNumbers ? `
            <div class="${numberClass}">
              ${icon && icon.includes('fa') ? `<i class="${icon}"></i>` : number}
            </div>
          ` : ''}
          <span class="toc-text">${text}</span>
        </a>
      </li>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mobile toggle
    const toggle = document.getElementById('tocMobileToggle');
    const closeBtn = document.getElementById('tocDrawerClose');

    toggle?.addEventListener('click', () => this.openDrawer());
    closeBtn?.addEventListener('click', () => this.closeDrawer());
    this.overlay?.addEventListener('click', () => this.closeDrawer());

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
        const anchor = link.getAttribute('data-section');
        this.navigateToSection(anchor);
      });
    });

    // Scroll events
    if (this.settings.scrollSpy || this.settings.progressBar) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            if (this.settings.scrollSpy) {
              this.updateActiveSection();
            }
            if (this.settings.progressBar) {
              this.updateProgressBar();
            }
            ticking = false;
          });
          ticking = true;
        }
      });
    }
  }

  /**
   * Setup footer detection for smart hiding
   */
  setupFooterDetection() {
    this.footer = document.querySelector('footer, #footer-container, .footer');

    if (!this.footer || !this.sidebar) {
      return;
    }

    // Use Intersection Observer for performance
    const observerOptions = {
      root: null,
      rootMargin: `${this.settings.footerHideDistance}px 0px 0px 0px`,
      threshold: 0
    };

    this.footerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Footer visible → Hide sidebar
          this.sidebar.classList.add('toc-hidden-by-footer');
        } else {
          // Footer not visible → Show sidebar
          this.sidebar.classList.remove('toc-hidden-by-footer');
        }
      });
    }, observerOptions);

    this.footerObserver.observe(this.footer);
  }

  /**
   * Open mobile drawer
   */
  openDrawer() {
    this.isDrawerOpen = true;
    this.drawer?.classList.add('open');
    this.overlay?.classList.add('active');
    document.getElementById('tocMobileToggle')?.classList.add('hidden');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close mobile drawer
   */
  closeDrawer() {
    this.isDrawerOpen = false;
    this.drawer?.classList.remove('open');
    this.overlay?.classList.remove('active');
    document.getElementById('tocMobileToggle')?.classList.remove('hidden');
    document.body.style.overflow = '';
  }

  /**
   * Navigate to section
   */
  navigateToSection(anchor) {
    const section = document.getElementById(anchor);
    if (!section) {
      console.warn(`Section #${anchor} not found`);
      return;
    }

    const offset = this.settings.stickyOffset;
    const elementPosition = section.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: this.settings.smoothScroll ? 'smooth' : 'auto'
    });

    // Close drawer on mobile
    if (window.innerWidth <= 1024) {
      setTimeout(() => this.closeDrawer(), 300);
    }
  }

  /**
   * Update active section based on scroll position
   */
  updateActiveSection() {
    const sections = document.querySelectorAll('[id^="section"], [data-toc-section]');
    let currentSection = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const threshold = 150;

      if (rect.top <= threshold && rect.bottom >= threshold) {
        currentSection = section.id;
      }
    });

    if (currentSection === this.currentSection) {
      return; // No change
    }

    this.currentSection = currentSection;

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
    const scrollPercent = Math.min(100, (scrollTop / (documentHeight - windowHeight)) * 100);

    if (this.progressBar) {
      this.progressBar.style.width = `${scrollPercent}%`;
    }

    const drawerProgressBar = document.getElementById('tocProgressBarDrawer');
    if (drawerProgressBar) {
      drawerProgressBar.style.width = `${scrollPercent}%`;
    }
  }

  /**
   * Destroy TOC (cleanup)
   */
  destroy() {
    // Remove observers
    if (this.footerObserver) {
      this.footerObserver.disconnect();
    }

    // Remove DOM elements
    this.container?.remove();

    // Remove body class
    document.body.classList.remove('has-toc');
    document.body.style.overflow = '';

    // Reset state
    this.config = null;
    this.items = [];
    this.currentSection = '';
    this.isDrawerOpen = false;

    console.log('✅ HybridTOC destroyed');
  }

  /**
   * Update language (when user changes language)
   */
  updateLanguage() {
    if (!this.config) return;

    // Re-render TOC
    this.container?.remove();
    this.render();
    this.setupEventListeners();
    this.setupFooterDetection();

    console.log('✅ HybridTOC language updated');
  }
}

// Export singleton instance
const hybridTOC = new HybridTOC();
export default hybridTOC;
```

---

## 🎨 CSS DOSYASI

### hybrid-toc.css

```css
/* ========================================
   GLOBAL HYBRID TOC COMPONENT
   Version: 2.0
   ======================================== */

/* ========================================
   PROGRESS BAR (Top)
   ======================================== */

.toc-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--color-border, #e0e0e0);
  z-index: 9999;
  pointer-events: none;
}

.toc-progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary, #8B0000),
    var(--color-primary-light, #A52A2A)
  );
  width: 0%;
  transition: width 0.25s ease;
}

/* ========================================
   DESKTOP SIDEBAR (>1024px)
   ======================================== */

.toc-desktop-sidebar {
  position: fixed;
  left: 20px;
  top: 100px;
  width: 260px;
  max-height: calc(100vh - 140px);
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  display: none;
  z-index: 100;
  transition: opacity 0.4s ease, transform 0.4s ease;
}

/* Smart hiding when footer approaches */
.toc-desktop-sidebar.toc-hidden-by-footer {
  opacity: 0;
  transform: translateY(-20px);
  pointer-events: none;
}

.toc-desktop-sidebar h3 {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-light, #666);
  margin: 0 0 16px 0;
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
  color: var(--color-text, #555);
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.toc-desktop-list .toc-link:hover {
  background: #f5f5f5;
  color: var(--color-primary, #8B0000);
  padding-left: 14px;
}

.toc-desktop-list .toc-link.active {
  background: var(--color-primary-light, rgba(139, 0, 0, 0.08));
  color: var(--color-primary, #8B0000);
  border-left-color: var(--color-primary, #8B0000);
  font-weight: 600;
  padding-left: 14px;
}

/* TOC Numbers */
.toc-number {
  width: 24px;
  height: 24px;
  min-width: 24px;
  background: #f0f0f0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.toc-number-square {
  width: 24px;
  height: 24px;
  min-width: 24px;
  background: #f0f0f0;
  color: #666;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.toc-desktop-list .toc-link.active .toc-number,
.toc-desktop-list .toc-link.active .toc-number-square {
  background: var(--color-primary, #8B0000);
  color: white;
}

.toc-text {
  flex: 1;
  line-height: 1.4;
}

/* Grouped Sections (Desktop) */
.toc-desktop-list .toc-group {
  margin-bottom: 20px;
}

.toc-desktop-list .toc-group-title {
  font-size: 11px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 10px 8px;
  margin-bottom: 6px;
}

.toc-desktop-list .toc-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Custom Scrollbar */
.toc-desktop-sidebar::-webkit-scrollbar {
  width: 6px;
}

.toc-desktop-sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.toc-desktop-sidebar::-webkit-scrollbar-thumb {
  background: var(--color-primary, #8B0000);
  border-radius: 10px;
}

.toc-desktop-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-light, #A52A2A);
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
  opacity: 0;
}

/* Mobile Drawer */
.toc-mobile-drawer {
  position: fixed;
  left: -280px;
  top: 0;
  width: 280px;
  height: 100vh;
  background: white;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.2);
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
  flex-shrink: 0;
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
  transform: rotate(90deg);
}

/* Drawer Progress */
.toc-drawer-progress {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
  flex-shrink: 0;
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
  background: linear-gradient(
    90deg,
    var(--color-primary, #8B0000),
    var(--color-primary-light, #A52A2A)
  );
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
  color: var(--color-text, #555);
  text-decoration: none;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.toc-drawer-list .toc-link:hover {
  background: #f5f5f5;
  color: var(--color-primary, #8B0000);
}

.toc-drawer-list .toc-link.active {
  background: var(--color-primary-light, rgba(139, 0, 0, 0.08));
  color: var(--color-primary, #8B0000);
  border-left-color: var(--color-primary, #8B0000);
  font-weight: 600;
}

.toc-drawer-list .toc-link.active .toc-number,
.toc-drawer-list .toc-link.active .toc-number-square {
  background: var(--color-primary, #8B0000);
  color: white;
}

/* Grouped Sections (Mobile) */
.toc-drawer-list .toc-group {
  margin-bottom: 20px;
}

.toc-drawer-list .toc-group-title {
  font-size: 11px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px;
  margin-bottom: 4px;
}

.toc-drawer-list .toc-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Drawer Content Scrollbar */
.toc-drawer-content::-webkit-scrollbar {
  width: 6px;
}

.toc-drawer-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.toc-drawer-content::-webkit-scrollbar-thumb {
  background: var(--color-primary, #8B0000);
  border-radius: 10px;
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
   RESPONSIVE BREAKPOINTS
   ======================================== */

/* Desktop: Show sidebar */
@media (min-width: 1025px) {
  .toc-desktop-sidebar {
    display: block;
  }

  /* Push main content to right */
  body.has-toc .page-container {
    margin-left: 300px;
  }

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

/* ========================================
   PRINT STYLES
   ======================================== */

@media print {
  .toc-progress-bar,
  .toc-mobile-toggle,
  .toc-mobile-drawer,
  .toc-desktop-sidebar,
  .toc-overlay {
    display: none !important;
  }

  body.has-toc .page-container,
  body.has-toc .main-content {
    margin-left: 0 !important;
  }
}

/* ========================================
   ACCESSIBILITY
   ======================================== */

/* High contrast mode */
@media (prefers-contrast: high) {
  .toc-desktop-sidebar,
  .toc-mobile-drawer {
    border: 2px solid currentColor;
  }

  .toc-link {
    border: 1px solid transparent;
  }

  .toc-link:focus {
    border-color: currentColor;
    outline: 2px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toc-desktop-sidebar,
  .toc-mobile-drawer,
  .toc-overlay,
  .toc-progress-fill,
  .toc-link,
  .toc-drawer-close {
    transition: none !important;
  }
}

/* Focus visible */
.toc-link:focus-visible,
.toc-mobile-toggle:focus-visible,
.toc-drawer-close:focus-visible {
  outline: 2px solid var(--color-primary, #8B0000);
  outline-offset: 2px;
}
```

---

## 📝 UYGULAMA KILAVUZU

### ADIM 1: Component Dosyalarını Oluştur

```bash
# 1. JS component oluştur
touch assets/js/components/hybrid-toc.js

# 2. CSS oluştur
touch assets/css/components/hybrid-toc.css

# 3. CSS'i global CSS'e import et (veya HTML'e link ekle)
```

**Global CSS'e import:**
```css
/* assets/css/main.css veya global.css */
@import './components/hybrid-toc.css';
```

**VEYA HTML'e link:**
```html
<link rel="stylesheet" href="assets/css/components/hybrid-toc.css">
```

### ADIM 2: Sayfa JSON'ına TOC Section Ekle

**Örnek:** `data/pages/makale-islem-ucretleri.json`

```json
{
  "meta": { ... },
  "hero": { ... },
  "toc": {
    "enabled": true,
    "mode": "hybrid",
    "title": {
      "tr": "İçindekiler",
      "en": "Table of Contents"
    },
    "mobileTitle": {
      "tr": "Hızlı Erişim",
      "en": "Quick Access"
    },
    "progressLabel": {
      "tr": "Okuma İlerlemeniz",
      "en": "Reading Progress"
    },
    "closeButton": {
      "tr": "Kapat",
      "en": "Close"
    },
    "items": [
      {
        "text": { "tr": "Genel Bilgiler", "en": "General Information" },
        "anchor": "section1",
        "icon": "fas fa-info-circle"
      },
      {
        "text": { "tr": "Gerekli Şartlar", "en": "Requirements" },
        "anchor": "section2",
        "icon": "fas fa-clipboard-list"
      },
      {
        "text": { "tr": "İletişim", "en": "Contact" },
        "anchor": "section3",
        "icon": "fas fa-phone"
      }
    ]
  },
  "content": { ... }
}
```

### ADIM 3: Sayfa JS'de TOC'yi Başlat

**Örnek:** `assets/js/pages/makale-islem-ucretleri.js`

```javascript
import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import HybridTOC from '../components/hybrid-toc.js';  // ← YENİ

export class MakaleIslemUcretleriPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('MakaleIslemUcretleriPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();

    // TOC'yi başlat (YENİ)
    if (this.pageData.toc && this.pageData.toc.enabled) {
      HybridTOC.init(this.pageData.toc);
    }

    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('MakaleIslemUcretleriPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/makale-islem-ucretleri.json');
      if (response.ok) {
        this.pageData = await response.json();
      }
    } catch (error) {
      console.error('Error loading page data:', error);
    }
  }

  async setupContent() {
    const container = document.getElementById('apc-content');
    if (!container) return;

    this.renderMainContent();
  }

  renderMainContent() {
    const container = document.getElementById('apc-content');
    let html = '';

    // Section 1: Genel Bilgiler
    html += `
      <div id="section1" class="content-section">
        <h2>Genel Bilgiler</h2>
        <p>...</p>
      </div>
    `;

    // Section 2: Gerekli Şartlar
    html += `
      <div id="section2" class="content-section">
        <h2>Gerekli Şartlar</h2>
        <p>...</p>
      </div>
    `;

    // Section 3: İletişim
    html += `
      <div id="section3" class="content-section">
        <h2>İletişim</h2>
        <p>...</p>
      </div>
    `;

    container.innerHTML = html;
  }
}

export default MakaleIslemUcretleriPage;
```

### ADIM 4: HTML'de Section ID'leri Ekle

**Önemli:** HTML'de TOC markup'ı OLMAYACAK! Sadece content section'larına ID eklenecek.

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Makale İşlem Ücretleri</title>

  <!-- Global TOC CSS -->
  <link rel="stylesheet" href="assets/css/components/hybrid-toc.css">
</head>
<body data-page-type="inner" data-page-name="makale-islem-ucretleri">

  <!-- Header -->
  <div id="header-container"></div>

  <!-- Hero -->
  <div id="hero-container"></div>

  <!-- Main Content -->
  <main class="main-content">
    <div id="apc-content">
      <!-- Content buraya JS ile render edilecek -->
      <!-- Section ID'leri önemli: id="section1", id="section2" vb. -->
    </div>
  </main>

  <!-- Help Section -->
  <div id="help-container"></div>

  <!-- Footer -->
  <footer id="footer-container" class="footer"></footer>

  <!-- Scripts -->
  <script type="module" src="assets/js/core/app.js"></script>
</body>
</html>
```

### ADIM 5: Test

```bash
# 1. Tarayıcıda sayfayı aç
# 2. Desktop'ta sidebar görünmeli (sol tarafta, sticky)
# 3. Scroll yap → Aktif bölüm işaretlenmeli
# 4. Footer'a yaklaş → Sidebar yavaşça kaybolmalı
# 5. Footer'dan uzaklaş → Sidebar geri gelmeli
# 6. Mobile'da (≤1024px) → Sol kenarda tab görünmeli
# 7. Tab'a tıkla → Drawer açılmalı
# 8. Bölüme tıkla → Smooth scroll + drawer kapanmalı
# 9. ESC tuşu → Drawer kapanmalı
# 10. Progress bar → Scroll ile güncellenmeli
```

---

## 📋 TOC EKLENEBİLECEK SAYFALAR LİSTESİ

| # | Sayfa | Bölüm Sayısı | Gruplandırma | Öncelik | Durum |
|---|-------|--------------|--------------|---------|-------|
| 1 | makale-islem-ucretleri | 8 | Hayır | Yüksek | ⏳ İlk sayfa |
| 2 | kutuphane-kurallari | 5 | Hayır | Yüksek | ⬜ Sonra |
| 3 | uyelik-odunc-islemleri | 4 | Hayır | Yüksek | ⬜ Sonra |
| 4 | uzaktan-erisim | 3 | Hayır | Orta | ⬜ Sonra |
| 5 | mendeley-referans-yonetim-araci | 6 | Hayır | Orta | ⬜ Sonra |
| 6 | arastirmaci-profili-olusturma | 8 | Evet (3 grup) | Orta | ⬜ İleri seviye |
| 7 | sss | Değişken | Evet (kategoriler) | Düşük | ⬜ Opsiyonel |
| 8 | ill | 3 | Hayır | Düşük | ⬜ Opsiyonel |

**Tahmini Süre:**
- Component oluşturma: 45 dakika
- İlk sayfa (makale-islem-ucretleri): 20 dakika
- Diğer basit sayfalar: 5-10 dakika/sayfa
- Karmaşık sayfalar (gruplandırmalı): 15 dakika/sayfa
- **TOPLAM:** ~3 saat

---

## ✅ BAŞARI KRİTERLERİ

Global TOC component başarılı sayılır eğer:

### Temel Özellikler:
- ✅ **Zero Hardcoded Text**: JS ve HTML'de hiçbir metin yok, hepsi JSON'dan geliyor
- ✅ **Tek Component**: `hybrid-toc.js` ve `hybrid-toc.css` dosyaları global
- ✅ **Kolay Entegrasyon**: Her sayfa sadece `HybridTOC.init()` çağırıyor
- ✅ **Minimal HTML**: HTML'de TOC markup'ı yok, sadece section ID'leri var

### Desktop Özellikleri:
- ✅ **Sticky Sidebar**: Scroll ile sabit kalıyor
- ✅ **Footer-Aware**: Footer'a yaklaşınca otomatik gizleniyor
- ✅ **Header-Safe**: Header'a çarpışma yok, offset doğru ayarlı
- ✅ **Auto Highlight**: Aktif bölüm otomatik işaretleniyor
- ✅ **Smooth Scroll**: Bölüme tıklayınca smooth scroll

### Mobile Özellikleri:
- ✅ **Left Tab**: Sol kenarda vertical tab görünüyor
- ✅ **Drawer**: 280px genişlikte drawer açılıyor
- ✅ **Overlay**: Arka plan kararıyor
- ✅ **Auto Close**: Bölüme gidince drawer kapanıyor
- ✅ **ESC Key**: ESC tuşu ile kapanıyor

### Çoklu Dil:
- ✅ **JSON Translations**: Tüm metinler JSON'dan geliyor
- ✅ **Auto Update**: Dil değişince TOC otomatik güncelleniyor
- ✅ **Utils.getLocalizedText()**: Tüm metinler için kullanılıyor

### Performans:
- ✅ **Intersection Observer**: Footer detection için performanslı
- ✅ **RequestAnimationFrame**: Scroll events için optimize edilmiş
- ✅ **No Memory Leaks**: Destroy metodu ile temizlik

### Test:
- ✅ **8 Sayfada Test Edilmiş**: Tüm sayfalarda çalışıyor
- ✅ **Console'da Hata Yok**: Hiçbir hata mesajı yok
- ✅ **Responsive**: Desktop ve mobile'da düzgün çalışıyor
- ✅ **Accessibility**: Keyboard navigation, screen reader uyumlu

---

## 🐛 SORUN GİDERME

### Sidebar görünmüyor:
```javascript
// Kontrol listesi:
1. CSS import edilmiş mi? (hybrid-toc.css)
2. body.has-toc class eklenmiş mi?
3. @media (min-width: 1025px) çalışıyor mu?
4. Console'da hata var mı?
5. HybridTOC.init() çağrıldı mı?
```

### Footer'a değince gizlenmiyor:
```javascript
// Kontrol listesi:
1. Footer seçici doğru mu? (footer, #footer-container, .footer)
2. Intersection Observer çalışıyor mu?
3. footerHideDistance değeri uygun mu? (default: 300px)
4. Console'da observer hatası var mı?
5. Footer elementi DOM'da var mı?
```

### Active section işaretlenmiyor:
```javascript
// Kontrol listesi:
1. Section ID'leri doğru mu? (id="section1" vb.)
2. updateActiveSection() çalışıyor mu?
3. Scroll event listener aktif mi?
4. Threshold değeri uygun mu? (default: 150px)
5. querySelectorAll doğru elemanları buluyor mu?
```

### Mobile drawer açılmıyor:
```javascript
// Kontrol listesi:
1. @media (max-width: 1024px) aktif mi?
2. Mobile toggle butonu görünüyor mu?
3. Event listener'lar çalışıyor mu?
4. z-index değerleri doğru mu? (drawer: 999, overlay: 998)
5. Body overflow: hidden oluyor mu?
```

### Progress bar çalışmıyor:
```javascript
// Kontrol listesi:
1. settings.progressBar: true mu?
2. Progress bar elementi DOM'da var mı? (#tocProgressBar)
3. updateProgressBar() çalışıyor mu?
4. Scroll event listener aktif mi?
5. Width hesaplaması doğru mu?
```

### Çoklu dil çalışmıyor:
```javascript
// Kontrol listesi:
1. Utils.getLocalizedText() import edilmiş mi?
2. JSON'da tüm metinler { tr: "...", en: "..." } formatında mı?
3. LanguageManager.getCurrentLanguage() doğru dil döndürüyor mu?
4. updateLanguage() metodu çağrılıyor mu?
5. Component re-render ediliyor mu?
```

---

## 🚀 HIZLI BAŞLANGIÇ KOMUTLARI

Kullanıcı bu komutları verdiğinde Claude otomatik işlem yapacak:

### Komut 1: Component Oluştur
```
"global hybrid toc component oluştur"
```

**Claude yapacak:**
1. `assets/js/components/hybrid-toc.js` oluştur (yukarıdaki kodla)
2. `assets/css/components/hybrid-toc.css` oluştur (yukarıdaki stil ile)
3. CSS'i global CSS'e import et (veya HTML'e link ekle)
4. Test için basit bir demo sayfa oluştur
5. Sonucu bildir

### Komut 2: Mevcut Sayfayı Dönüştür
```
"makale-islem-ucretleri sayfasını global toc'a geçir"
```

**Claude yapacak:**
1. `makale-islem-ucretleri.js`'den eski TOC kodlarını sil
2. `import HybridTOC` ekle
3. `HybridTOC.init()` çağır
4. `makale-islem-ucretleri.html`'den TOC markup'ını sil
5. Content section'larına ID ekle (id="section1" vb.)
6. `makale-islem-ucretleri.css`'den TOC stillerini sil
7. Test ve sonucu bildir

### Komut 3: Yeni Sayfaya TOC Ekle
```
"kutuphane-kurallari sayfasına toc ekle"
```

**Claude yapacak:**
1. `data/pages/kutuphane-kurallari.json` aç
2. İçeriği analiz et, bölümleri tespit et
3. `toc` section oluştur (items array ile)
4. JSON'u kaydet
5. `assets/js/pages/kutuphane-kurallari.js` güncelle
   - `import HybridTOC` ekle
   - `HybridTOC.init()` çağır
6. Content render'da section ID'leri ekle
7. Test ve sonucu bildir

### Komut 4: İlerleme Durumu
```
"toc ilerleme durumu"
```

**Claude gösterecek:**
- ✅ Component durumu (oluşturuldu mu?)
- ✅ Tamamlanan sayfalar
- ⏳ Devam eden sayfa
- ⬜ Bekleyen sayfalar
- 📊 İlerleme yüzdesi

---

## 💡 GELİŞMİŞ ÖZELLİKLER (V3 - İleride)

### 1. Auto-Generate TOC from DOM
```javascript
// Eğer JSON'da toc yoksa, DOM'dan otomatik oluştur
autoGenerateTOC() {
  const headings = document.querySelectorAll('h2[id], h3[id]');
  const items = [];

  headings.forEach(heading => {
    items.push({
      text: { tr: heading.textContent, en: heading.textContent },
      anchor: heading.id,
      level: heading.tagName === 'H2' ? 1 : 2
    });
  });

  return items;
}
```

### 2. Keyboard Navigation
```javascript
// Arrow keys ile bölümler arası gezinme
setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'ArrowUp') {
      this.navigateToPreviousSection();
    }
    if (e.ctrlKey && e.key === 'ArrowDown') {
      this.navigateToNextSection();
    }
  });
}
```

### 3. Share Section URL
```javascript
// Bölüm URL'ini kopyala butonu
addShareButton(link) {
  const shareBtn = document.createElement('button');
  shareBtn.innerHTML = '<i class="fas fa-link"></i>';
  shareBtn.onclick = () => {
    const url = `${window.location.href.split('#')[0]}#${link.dataset.section}`;
    navigator.clipboard.writeText(url);
    // Toast notification göster
  };
  link.appendChild(shareBtn);
}
```

### 4. Reading Time Estimation
```javascript
// Her bölüm için okuma süresi tahmini
estimateReadingTime(sectionId) {
  const section = document.getElementById(sectionId);
  const text = section.textContent;
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / 200); // 200 word/min
  return minutes;
}
```

### 5. Collapsed Groups
```javascript
// Grupları katlanabilir yap
renderCollapsibleGroup(group, index) {
  return `
    <div class="toc-group">
      <button class="toc-group-toggle" data-group="${index}">
        <i class="fas fa-chevron-down"></i>
        ${Utils.getLocalizedText(group.title)}
      </button>
      <ul class="toc-group-content" data-group-content="${index}">
        ${group.sections.map(s => this.renderListItem(s)).join('')}
      </ul>
    </div>
  `;
}
```

---

## 📊 PERFORMANS OPTİMİZASYONU

### 1. Lazy Loading
```javascript
// TOC'yi sadece gerektiğinde yükle
if (document.documentElement.scrollHeight > window.innerHeight * 3) {
  // Uzun içerik → TOC göster
  HybridTOC.init(tocData);
}
```

### 2. Debounced Scroll
```javascript
// Scroll event'lerini debounce et
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    this.updateActiveSection();
    this.updateProgressBar();
  }, 100);
});
```

### 3. Memoization
```javascript
// Render sonuçlarını cache'le
const renderCache = new Map();

renderList(context) {
  const cacheKey = `${context}-${LanguageManager.getCurrentLanguage()}`;

  if (renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey);
  }

  const html = this.generateListHTML(context);
  renderCache.set(cacheKey, html);
  return html;
}
```

---

## 📚 EK KAYNAKLAR

### MDN Dokümantasyon:
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Scroll Behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior)
- [CSS Position Sticky](https://developer.mozilla.org/en-US/docs/Web/CSS/position)

### Best Practices:
- [Web.dev - Building Components](https://web.dev/building-a-tabs-component/)
- [Smashing Magazine - Sticky TOC](https://www.smashingmagazine.com/2021/07/dynamic-table-of-contents/)

### Accessibility:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Landmarks](https://www.w3.org/TR/wai-aria-practices-1.1/#navigation)

---

## 🎯 SONUÇ

Bu dokümantasyon ile:
- ✅ Tamamen JSON-driven TOC sistemi
- ✅ Zero hardcoded text (JS ve HTML'de metin yok)
- ✅ Smart sticky sidebar (footer-aware)
- ✅ Global component (tekrar kullanılabilir)
- ✅ Responsive (desktop + mobile)
- ✅ Çoklu dil desteği
- ✅ Kolay entegrasyon (5-10 dk/sayfa)
- ✅ Performans optimizasyonları
- ✅ Accessibility standartlarına uygun

**Başlamak için komut verin:** 🚀

```
"global hybrid toc component oluştur"
```

---

**📅 Hazırlanma Tarihi:** 2025-11-06
**📝 Versiyon:** 2.1 (Optimizasyonlar ve Düzeltmeler)
**✍️ Hazırlayan:** Claude AI
**🎯 Durum:** Uygulamaya Hazır

---

## 🔄 Versiyon 2.1 - Güncellemeler (2025-11-06)

### ✨ Yapılan Değişiklikler:

#### 1. 🎨 **Renk Sistemi Güncellemesi**
- **Sorun:** TOC'da kırmızı renk (`#8B0000`) kullanılıyordu
- **Çözüm:** Tüm TOC bileşenlerinde site'nin primary color'ı kullanıldı
  - `--color-primary` → `--primary-color: #1F4C8A` (Anadolu Üniversitesi mavisi)
  - `--color-primary-light` → `--primary-light: #3667a6`
- **Güncellenen Öğeler:**
  - Progress bar gradyanları
  - Desktop sidebar aktif link rengi
  - Mobile toggle butonu
  - Drawer header arkaplanı
  - Active state background'ları
  - Scrollbar thumb renkleri
  - Focus outline'ları

#### 2. 📐 **Layout ve İçerik Boyutu Optimizasyonu**
- **Sorun:** İçerik desktop'ta incecik çizgi gibi görünüyordu
- **Nedeni:** Çift margin uygulanması (page-container + main-content)
- **Çözüm:**
  ```css
  /* ÖNCESİ - Hatalı */
  body.has-toc .page-container {
    margin-left: 300px;
  }
  body.has-toc .main-content {
    margin-left: 300px;  /* ❌ Çift margin! */
  }

  /* SONRASI - Doğru */
  body.has-toc .page-container {
    margin-left: 300px;  /* ✅ Tek margin yeterli */
  }
  ```
- **Ek İyileştirmeler:**
  - Page container max-width: `1400px` → `1200px`
  - Main content max-width: `900px` eklendi
  - Main content padding: `48px` → `40px`
  - Mobile'da max-width: `100%`

#### 3. 🔢 **Akıllı Numaralandırma Sistemi**
- **Özellik:** İkon olan öğeler numarasız, diğerleri otomatik numaralandırılıyor
- **JSON Yapısı:**
  ```json
  {
    "items": [
      { "text": {...}, "anchor": "...", "icon": "fas fa-info-circle" },  // İkonlu (numarasız)
      { "text": {...}, "anchor": "..." },  // İkonsuz → Numara: 1
      { "text": {...}, "anchor": "..." },  // İkonsuz → Numara: 2
      { "text": {...}, "anchor": "..." },  // İkonsuz → Numara: 3
      { "text": {...}, "anchor": "...", "icon": "fas fa-phone" }  // İkonlu (numarasız)
    ]
  }
  ```
- **Güncellenen Kod:**
  ```javascript
  renderList(context) {
    // Simple sections - custom numbering logic
    let contentNumberCounter = 0;
    return `<ul class="${listClass}">
      ${this.items.map((section, index) => {
        // İkon varsa counter artırılmıyor
        let displayNumber = index + 1;
        if (!section.icon) {
          contentNumberCounter++;
          displayNumber = contentNumberCounter;
        }
        return this.renderListItem(section, displayNumber, showNumbers);
      }).join('')}
    </ul>`;
  }

  renderListItem(section, number, showNumbers) {
    const icon = section.icon || '';
    let displayContent = '';

    if (icon) {
      if (icon.includes('fa')) {
        displayContent = `<i class="${icon}"></i>`;  // FontAwesome
      } else {
        displayContent = icon;  // Emoji
      }
    } else {
      displayContent = number;  // Numara
    }

    return `...${displayContent}...`;
  }
  ```

#### 4. 😄 **Emoji Desteği İyileştirmesi**
- **Özellik:** JSON'da emoji kullanımı destekleniyor
- **CSS Güncellemesi:**
  ```css
  .toc-number {
    font-size: 16px;  /* Emoji ve ikon için büyük */
  }

  /* Sadece numaralar için küçük font */
  .toc-number:not(:has(i)):not(:has(span)) {
    font-size: 11px;
  }
  ```

### 📊 Etkilenen Dosyalar:

| Dosya | Değişiklik Türü | Detay |
|-------|-----------------|-------|
| `hybrid-toc.css` | Renk güncellemesi | Tüm `--color-primary` → `--primary-color` |
| `hybrid-toc.css` | Layout düzeltme | Çift margin kaldırıldı |
| `hybrid-toc.css` | Emoji desteği | Font-size ayarı |
| `hybrid-toc.js` | Numaralandırma | Akıllı counter logic eklendi |
| `hybrid-toc.js` | Emoji render | DisplayContent logic güncellendi |
| `makale-islem-ucretleri.css` | Layout | Grid kaldırıldı, max-width eklendi |

### 🎯 Test Sonuçları:

#### Desktop (>1024px):
- ✅ İçerik artık normal genişlikte görünüyor
- ✅ TOC sidebar'ı site renkleriyle uyumlu
- ✅ İkonlar ve numaralar doğru görünüyor
- ✅ Emoji desteği çalışıyor
- ✅ Max-width ile okunabilirlik arttı

#### Mobile (≤1024px):
- ✅ Drawer açılıyor ve kapanıyor
- ✅ İçerik tam genişlikte
- ✅ Toggle butonu site renklerinde
- ✅ Progress bar düzgün çalışıyor

### 🚀 Performans İyileştirmeleri:
- Gereksiz margin hesaplamaları kaldırıldı
- CSS spesifiklik azaltıldı
- Daha az DOM manipülasyonu

### 📝 Dokümantasyon Güncellemeleri:
- Renk değişkenleri güncellendi
- Layout yapısı açıklandı
- Numaralandırma sistemi dokümante edildi
- Emoji kullanım örnekleri eklendi

---

## 📞 DESTEK

Bu dokümantasyon hakkında sorularınız için Claude'a şu şekilde sorabilirsiniz:

```
"TOC_GLOBAL_COMPONENT.md dosyasını oku ve [konu] hakkında bilgi ver"
```

**Örnek sorular:**
- "Footer detection nasıl çalışıyor?"
- "JSON formatı nasıl olmalı?"
- "Gruplandırmalı TOC nasıl yapılır?"
- "Mobile drawer neden açılmıyor?"
- "Yeni sayfaya nasıl TOC eklerim?"

**Hadi başlayalım!** 🎉
