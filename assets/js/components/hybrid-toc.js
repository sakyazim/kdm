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

    // Position TOC after hero section
    this.positionAfterHero();

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

    // Debug logging
    console.log('✅ TOC rendered:', {
      sidebar: !!this.sidebar,
      drawer: !!this.drawer,
      grouped: this.grouped,
      itemCount: this.items.length
    });
  }

  /**
   * Position TOC sidebar after hero section
   */
  positionAfterHero() {
    if (!this.sidebar) return;

    let attempts = 0;
    const maxAttempts = 20; // 2 saniye (20 * 100ms)

    // Wait for hero to be rendered
    const waitForHero = () => {
      attempts++;
      const heroContainer = document.getElementById('hero-container');
      const pageContainer = document.querySelector('.page-container, .main-container, #main-content-container');

      if (heroContainer && pageContainer) {
        // Hero'nun sayfadaki toplam yüksekliğini ve pozisyonunu hesapla
        const heroRect = heroContainer.getBoundingClientRect();
        const heroTopFromPage = heroContainer.offsetTop;
        const heroHeight = heroRect.height;

        // Page container'ın sayfadaki pozisyonunu al
        const pageTopFromPage = pageContainer.offsetTop;

        // TOC'u page container ile aynı hizada başlat (hero'nun hemen altı)
        const tocInitialTop = pageTopFromPage;

        // Scroll tracking için hero bilgilerini sakla
        this.heroHeight = heroHeight;
        this.heroTop = heroTopFromPage;
        this.initialTocTop = tocInitialTop;

        // İlk pozisyonu ayarla
        this.sidebar.style.top = `${tocInitialTop}px`;
        this.sidebar.classList.add('toc-ready');

        // Scroll event listener ekle
        this.setupHeroScrollTracking();

        console.log('✅ TOC positioned after hero:', {
          heroHeight,
          heroTop: heroTopFromPage,
          pageTop: pageTopFromPage,
          tocInitialTop,
          attempts
        });
      } else if (attempts < maxAttempts) {
        // Hero henüz render edilmedi, tekrar dene
        setTimeout(waitForHero, 100);
      } else {
        // Max attempts aşıldı, default pozisyon kullan ve göster
        console.warn('⚠️ Hero container not found after max attempts, using default position');
        this.sidebar.style.top = '100px';
        this.sidebar.classList.add('toc-ready');
      }
    };

    // Hero render'ını bekle
    setTimeout(waitForHero, 100);
  }

  /**
   * Setup scroll tracking for hero section
   */
  setupHeroScrollTracking() {
    if (!this.sidebar) return;

    const updateTocPosition = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const headerHeight = 80; // Ortalama header yüksekliği

      // Hero tamamen geçildiyse (scroll > hero bottom - header)
      if (scrollY > (this.heroTop + this.heroHeight - headerHeight)) {
        // Sticky pozisyon - sabit menünün ALTINDAN (header yüksekliği + 20px)
        this.sidebar.style.top = 'calc(var(--header-height) + 20px)';
      } else {
        // Hero görünürken - page container ile aynı hizada
        // Scroll'a göre pozisyonu ayarla (min: header altı)
        const newTop = Math.max(100, this.initialTocTop - scrollY);
        this.sidebar.style.top = `${newTop}px`;
      }
    };

    // Scroll event listener
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateTocPosition();
          ticking = false;
        });
        ticking = true;
      }
    });

    // İlk pozisyonu ayarla
    updateTocPosition();
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
      // Simple sections - custom numbering logic
      let contentNumberCounter = 0;
      return `<ul class="${listClass}">
        ${this.items.map((section, index) => {
          // If section has icon, don't increment counter
          let displayNumber = index + 1;
          if (!section.icon) {
            contentNumberCounter++;
            displayNumber = contentNumberCounter;
          }
          return this.renderListItem(section, displayNumber, showNumbers);
        }).join('')}
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

    // Display content: use icon if available (FontAwesome, Bootstrap Icons or emoji), otherwise use number
    let displayContent = '';
    if (icon) {
      if (icon.includes('fa') || icon.includes('bi bi-')) {
        // FontAwesome or Bootstrap Icons
        displayContent = `<i class="${icon}"></i>`;
      } else {
        // Emoji - display directly without number wrapper
        displayContent = icon;
      }
    } else {
      displayContent = number;
    }

    return `
      <li>
        <a href="#${section.anchor}" data-section="${section.anchor}" class="toc-link">
          ${showNumbers ? `
            <div class="${numberClass}">
              ${displayContent}
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

    // Scroll events (optimized with requestAnimationFrame)
    if (this.settings.scrollSpy || this.settings.progressBar) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.updateTOCPosition(); // Hero scroll kontrolü
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
   * Update TOC position based on scroll (sticky after hero)
   */
  updateTOCPosition() {
    if (!this.sidebar) return;

    const heroContainer = document.getElementById('hero-container');
    const pageContainer = document.querySelector('.page-container');

    if (!heroContainer || !pageContainer) return;

    const scrollY = window.scrollY;
    const heroBottom = heroContainer.getBoundingClientRect().bottom + scrollY;
    const pageTop = pageContainer.getBoundingClientRect().top + scrollY;

    // Hero'nun altına geçtiyse TOC sticky olsun (sabit menünün altı)
    if (scrollY >= pageTop - 20) {
      this.sidebar.style.top = 'calc(var(--header-height) + 20px)';
    } else {
      // Hero görünürken TOC'u hero sonrasında tut (min: header altı)
      const tocTop = Math.max(pageTop - scrollY + 20, 100);
      this.sidebar.style.top = `${tocTop}px`;
    }
  }

  /**
   * Setup footer detection for smart hiding
   */
  setupFooterDetection() {
    // Try to find help-section first, fallback to footer
    this.footer = document.querySelector('#help-container, .help-section, footer, #footer-container, .footer');

    if (!this.footer || !this.sidebar) {
      console.log('Footer/Help section or sidebar not found, skipping detection');
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
          // Footer/Help section visible → Hide sidebar
          this.sidebar.classList.add('toc-hidden-by-footer');
        } else {
          // Footer/Help section not visible → Show sidebar
          this.sidebar.classList.remove('toc-hidden-by-footer');
        }
      });
    }, observerOptions);

    this.footerObserver.observe(this.footer);
    console.log('✅ Smart hiding detection initialized for:', this.footer.id || this.footer.className);
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
   * GLOBAL - TOC anchor'larından otomatik section bulma
   */
  updateActiveSection() {
    // TOC'daki tüm anchor'ları al
    const tocLinks = document.querySelectorAll('.toc-link[data-section]');
    const sectionIds = Array.from(tocLinks).map(link => link.getAttribute('data-section'));

    // Bu ID'lere sahip DOM elementlerini bul
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter(el => el !== null);

    if (sections.length === 0) {
      // Fallback: data-toc-section attribute'u olan elementler
      const fallbackSections = document.querySelectorAll('[data-toc-section]');
      sections.push(...Array.from(fallbackSections));
    }

    let currentSection = '';
    const threshold = 150;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();

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
