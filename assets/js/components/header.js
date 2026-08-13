/**
 * Anadolu Üniversitesi Kütüphane - Header Manager
 * Header, navigasyon ve scroll davranışı
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';
import { NavigationActiveManager } from '../utils/navigation-active-manager.js';

export class HeaderManager {
  constructor() {
    this.header = null;
    this.lastScrollTop = 0;
    this.headerData = null;
  }

  /**
   * Header'ı yükle ve başlat
   * @param {Object} headerData - Header JSON verisi
   */
  async init(headerData) {
    this.headerData = headerData;
    await this.loadHeader();
    this.setupScrollBehavior();
    this.setupDropdowns();
    this.setupHeaderOffset();

    // Desktop setup
    this.setupDropdownInteractions(); // Desktop hover

    // Mobile menu setup
    this.setupMobileMenu();

    // Aktif menü öğelerini işaretle
    this.setActiveNavigation();

    // Resize'da yeniden kontrol et
    window.addEventListener('resize', Utils.debounce(() => {
      this.setupDropdownInteractions();
    }, 250));

    Utils.log('HeaderManager initialized');
  }

  /**
   * Header HTML'ini yükle
   */
  async loadHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    const header = this.headerData;
    
    // Logo fallback SVG
    const logoFallback = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='50' viewBox='0 0 200 50'><rect width='200' height='50' fill='%231F4C8A' rx='5'/></svg>`;
    
    // Çoklu dil desteği
    const logoAlt = Utils.getLocalizedText(header?.logo?.alt || 'Anadolu Üniversitesi Kütüphane');
    const logoText = Utils.getLocalizedText(header?.logo?.text || '');

    headerContainer.innerHTML = `
      <header class="main-header sticky-header">
        <div class="container">
          <nav class="navbar navbar-expand-lg">
            <div class="container-fluid">
              <a class="navbar-brand" href="index.html">
                <img src="${header?.logo?.src || 'assets/images/au-logo.png'}"
                     alt="${logoAlt}"
                     class="logo-img"
                     onerror="this.src='${logoFallback}'">
              </a>

              <!-- Mobile Menu Toggle Button -->
              <button class="mobile-menu-btn" aria-label="Menüyü Aç">
                <span></span>
                <span></span>
                <span></span>
              </button>

              <ul class="navbar-nav ms-auto">
                ${header?.navigation ? header.navigation.map(item => this.createMenuItem(item)).join('') : this.getDefaultMenuItems()}
                ${this.createLanguageSwitcher(header?.languageSwitcher)}
              </ul>
            </div>
          </nav>
        </div>

        <!-- Mobile Menu Overlay & Panel -->
        <div class="mobile-menu-overlay"></div>
        <div class="mobile-menu-panel">
          <div class="mobile-menu-header">
            <img src="${header?.logo?.src || 'assets/images/au-logo.png'}" alt="${logoAlt}" class="mobile-menu-logo">
            <button class="mobile-menu-close" aria-label="Menüyü Kapat">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <nav class="mobile-menu-content">
            ${this.createMobileMenuItems(header?.navigation)}
            ${this.createMobileLanguageSwitcher(header?.languageSwitcher)}
          </nav>
        </div>
      </header>
    `;

    this.header = headerContainer.querySelector('.main-header');

    if (header?.backgroundColor) {
      this.header.style.backgroundColor = header.backgroundColor;
    }

    this.setupDropdownInteractions();
    this.setupLanguageSwitcher();
  }

  /**
   * Menü item'ı oluştur
   * @param {Object} item - Menü item verisi
   * @returns {string} HTML string
   */
  createMenuItem(item) {
    // Çoklu dil desteği
    const title = Utils.getLocalizedText(item.title);

    if (item.dropdown && item.dropdown.length > 0) {
      const dropdownItems = item.dropdown.map(dropItem => {
        const dropTitle = Utils.getLocalizedText(dropItem.title);
        return `<li><a class="dropdown-item" href="${dropItem.url}"><i class="${dropItem.icon}"></i> ${dropTitle}</a></li>`;
      }).join('');

      return `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="${item.url || '#'}" id="${item.id}" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="${item.icon} me-1"></i> ${title} <i class="bi bi-chevron-down rotate-icon"></i>
          </a>
          <ul class="dropdown-menu${item.dropdown.length > 5 ? ' wide-dropdown' : ''}" aria-labelledby="${item.id}">
            ${dropdownItems}
          </ul>
        </li>
      `;
    } else {
      return `
        <li class="nav-item">
          <a class="nav-link" href="${item.url || '#'}" aria-current="page">
            <i class="${item.icon} me-1"></i> ${title}
          </a>
        </li>
      `;
    }
  }

  /**
   * Varsayılan menü items
   * @returns {string} HTML string
   */
  getDefaultMenuItems() {
    return `
      <li class="nav-item">
        <a class="nav-link" href="https://libra.anadolu.edu.tr">
          <i class="bi bi-search me-1"></i> KATALOG
        </a>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="e-kaynaklar" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-collection me-1"></i> E-KAYNAKLAR <i class="bi bi-chevron-down rotate-icon"></i>
        </a>
        <ul class="dropdown-menu" aria-labelledby="e-kaynaklar">
          <li><a class="dropdown-item" href="databases.html"><i class="bi bi-database"></i> VERİTABANLARI</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-search"></i> BÜTÜNLEŞİK ARAMA</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-archive"></i> KURUMSAL AKADEMİK ARŞİV</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-wifi"></i> UZAKTAN ERİŞİM</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-unlock"></i> AÇIK KÜTÜPHANE</a></li>
        </ul>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="arastirma" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-file-text me-1"></i> ARAŞTIRMA <i class="bi bi-chevron-down rotate-icon"></i>
        </a>
        <ul class="dropdown-menu wide-dropdown" aria-labelledby="arastirma">
          <li><a class="dropdown-item" href="#"><i class="bi bi-cash-coin"></i> MAKALE İŞLEM ÜCRETLERİ (APC)</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-journal-text"></i> REFERANS YÖNETİM ARACI (MENDELEY)</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-person-badge"></i> ARAŞTIRMACI PROFİLİ OLUŞTURMA</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-pc-display"></i> BİLGİSAYAR LABORATUVARI</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-door-open"></i> ÇALIŞMA ODALARI</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-file-text"></i> ANADOLU ÜNİVERSİTESİ ARAŞTIRMA MEVZUATI</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-building"></i> ANADOLU ÜNİVERSİTESİ ARAŞTIRMA BİRİMLERİ</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-newspaper"></i> ARAŞTIRMALARDAN HABERLER</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-megaphone"></i> ARAŞTIRMA DUYURULARI</a></li>
        </ul>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="rehber" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-info-circle me-1"></i> REHBER <i class="bi bi-chevron-down rotate-icon"></i>
        </a>
        <ul class="dropdown-menu" aria-labelledby="rehber">
          <li><a class="dropdown-item" href="#"><i class="bi bi-book"></i> ÜYELİK VE ÖDÜNÇ İŞLEMLERİ</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-arrow-left-right"></i> KÜTÜPHANELERASI İŞBİRLİĞİ (ILL)</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-question-circle"></i> KİME SORMALIYIM</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="sss.html"><i class="bi bi-question"></i> SIKÇA SORULAN SORULAR (SSS)</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-file-earmark-text"></i> FORMLAR</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-mortarboard"></i> EĞİTİM PROGRAMLARI</a></li>
        </ul>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="hakkimizda" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-building me-1"></i> HAKKIMIZDA <i class="bi bi-chevron-down rotate-icon"></i>
        </a>
        <ul class="dropdown-menu" aria-labelledby="hakkimizda">
          <li><a class="dropdown-item" href="#"><i class="bi bi-envelope"></i> İLETİŞİM</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-clock"></i> ÇALIŞMA SAATLERİ</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="personel.html"><i class="bi bi-people"></i> PERSONEL</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-diagram-3"></i> ORGANİZASYON ŞEMASI</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="tarihce.html"><i class="bi bi-info-circle"></i> TARİHÇE & GENEL BİLGİLER</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-clipboard-check"></i> KURALLAR</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-stack"></i> KOLEKSİYON (KAT PLANI)</a></li>
          <li class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-file-bar-graph"></i> İSTATİSTİKLER VE RAPORLAR</a></li>
        </ul>
      </li>
    `;
  }

  /**
   * Mobil menü öğelerini oluştur
   * @param {Array} navigation - Navigasyon verisi
   * @returns {string} HTML string
   */
  createMobileMenuItems(navigation) {
    if (!navigation || navigation.length === 0) {
      // Varsayılan menüyü kullan - getDefaultMenuItems'dan parse et
      const defaultMenuHTML = this.getDefaultMenuItems();
      return this.parseMobileMenuFromDesktop(defaultMenuHTML);
    }

    return navigation.map(item => {
      // Çoklu dil desteği
      const title = Utils.getLocalizedText(item.title);

      if (item.dropdown && item.dropdown.length > 0) {
        const dropdownItems = item.dropdown.map(subItem => {
          const subTitle = Utils.getLocalizedText(subItem.title);
          return `
            <a href="${subItem.url}" class="mobile-submenu-link">
              <i class="${subItem.icon}"></i>
              ${subTitle}
            </a>
          `;
        }).join('');

        return `
          <div class="mobile-menu-item">
            <button class="mobile-menu-link" type="button">
              <i class="${item.icon}"></i>
              <span>${title}</span>
              <i class="bi bi-chevron-down mobile-menu-arrow"></i>
            </button>
            <div class="mobile-submenu">
              ${dropdownItems}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="mobile-menu-item">
            <a href="${item.url}" class="mobile-menu-link">
              <i class="${item.icon}"></i>
              <span>${title}</span>
            </a>
          </div>
        `;
      }
    }).join('');
  }

  /**
   * Desktop menüsünden mobil menü parse et (fallback)
   * @param {string} desktopHTML - Desktop menü HTML
   * @returns {string} Mobil menü HTML
   */
  parseMobileMenuFromDesktop(desktopHTML) {
    // Basit parsing - daha sonra geliştirilebilir
    return `
      <div class="mobile-menu-item">
        <a href="https://libra.anadolu.edu.tr" class="mobile-menu-link">
          <i class="bi bi-search"></i>
          <span>KATALOG</span>
        </a>
      </div>
      <div class="mobile-menu-item">
        <button class="mobile-menu-link" type="button">
          <i class="bi bi-collection"></i>
          <span>E-KAYNAKLAR</span>
          <i class="bi bi-chevron-down mobile-menu-arrow"></i>
        </button>
        <div class="mobile-submenu">
          <a href="databases.html" class="mobile-submenu-link">
            <i class="bi bi-database"></i>
            VERİTABANLARI
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-search"></i>
            BÜTÜNLEŞİK ARAMA
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-archive"></i>
            KURUMSAL AKADEMİK ARŞİV
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-wifi"></i>
            UZAKTAN ERİŞİM
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-unlock"></i>
            AÇIK KÜTÜPHANE
          </a>
        </div>
      </div>
      <div class="mobile-menu-item">
        <button class="mobile-menu-link" type="button">
          <i class="bi bi-file-text"></i>
          <span>ARAŞTIRMA</span>
          <i class="bi bi-chevron-down mobile-menu-arrow"></i>
        </button>
        <div class="mobile-submenu">
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-cash-coin"></i>
            MAKALE İŞLEM ÜCRETLERİ (APC)
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-journal-text"></i>
            REFERANS YÖNETİM ARACI (MENDELEY)
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-person-badge"></i>
            ARAŞTIRMACI PROFİLİ OLUŞTURMA
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-pc-display"></i>
            BİLGİSAYAR LABORATUVARI
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-door-open"></i>
            ÇALIŞMA ODALARI
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-file-text"></i>
            ANADOLU ÜNİVERSİTESİ ARAŞTIRMA MEVZUATI
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-building"></i>
            ANADOLU ÜNİVERSİTESİ ARAŞTIRMA BİRİMLERİ
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-newspaper"></i>
            ARAŞTIRMALARDAN HABERLER
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-megaphone"></i>
            ARAŞTIRMA DUYURULARI
          </a>
        </div>
      </div>
      <div class="mobile-menu-item">
        <button class="mobile-menu-link" type="button">
          <i class="bi bi-info-circle"></i>
          <span>REHBER</span>
          <i class="bi bi-chevron-down mobile-menu-arrow"></i>
        </button>
        <div class="mobile-submenu">
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-book"></i>
            ÜYELİK VE ÖDÜNÇ İŞLEMLERİ
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-arrow-left-right"></i>
            KÜTÜPHANELERASI İŞBİRLİĞİ (ILL)
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-question-circle"></i>
            KİME SORMALIYIM
          </a>
          <a href="sss.html" class="mobile-submenu-link">
            <i class="bi bi-question"></i>
            SIKÇA SORULAN SORULAR (SSS)
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-file-earmark-text"></i>
            FORMLAR
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-mortarboard"></i>
            EĞİTİM PROGRAMLARI
          </a>
        </div>
      </div>
      <div class="mobile-menu-item">
        <button class="mobile-menu-link" type="button">
          <i class="bi bi-building"></i>
          <span>HAKKIMIZDA</span>
          <i class="bi bi-chevron-down mobile-menu-arrow"></i>
        </button>
        <div class="mobile-submenu">
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-envelope"></i>
            İLETİŞİM
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-clock"></i>
            ÇALIŞMA SAATLERİ
          </a>
          <a href="personel.html" class="mobile-submenu-link">
            <i class="bi bi-people"></i>
            PERSONEL
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-diagram-3"></i>
            ORGANİZASYON ŞEMASI
          </a>
          <a href="tarihce.html" class="mobile-submenu-link">
            <i class="bi bi-info-circle"></i>
            TARİHÇE & GENEL BİLGİLER
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-clipboard-check"></i>
            KURALLAR
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-stack"></i>
            KOLEKSİYON (KAT PLANI)
          </a>
          <a href="#" class="mobile-submenu-link">
            <i class="bi bi-file-bar-graph"></i>
            İSTATİSTİKLER VE RAPORLAR
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Dropdown hover interactions - DESKTOP ONLY
   */
  setupDropdownInteractions() {
    document.querySelectorAll('.navbar-nav .dropdown').forEach(dropdown => {
      dropdown.addEventListener('mouseenter', () => {
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        if (dropdownMenu && window.innerWidth > 991) {
          dropdownMenu.style.display = 'block';
          dropdown.querySelector('.rotate-icon')?.classList.add('rotated');
        }
      });

      dropdown.addEventListener('mouseleave', () => {
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        if (dropdownMenu && window.innerWidth > 991) {
          dropdownMenu.style.display = 'none';
          dropdown.querySelector('.rotate-icon')?.classList.remove('rotated');
        }
      });
    });
  }

  /**
   * Mobil menü kurulumu
   */
  setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const menuPanel = document.querySelector('.mobile-menu-panel');
    const menuOverlay = document.querySelector('.mobile-menu-overlay');
    const menuClose = document.querySelector('.mobile-menu-close');
    const menuItems = document.querySelectorAll('.mobile-menu-link');

    if (!menuBtn || !menuPanel || !menuOverlay) return;

    // Menü aç/kapat
    const toggleMenu = (open) => {
      if (open) {
        menuPanel.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        menuPanel.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    };

    // Hamburger butonu
    menuBtn.addEventListener('click', () => toggleMenu(true));

    // Kapat butonu
    if (menuClose) {
      menuClose.addEventListener('click', () => toggleMenu(false));
    }

    // Overlay tıklama
    menuOverlay.addEventListener('click', () => toggleMenu(false));

    // ESC tuşu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuPanel.classList.contains('active')) {
        toggleMenu(false);
      }
    });

    // Accordion davranışı
    menuItems.forEach(item => {
      if (item.tagName === 'BUTTON') {
        item.addEventListener('click', () => {
          const parent = item.closest('.mobile-menu-item');
          const submenu = parent.querySelector('.mobile-submenu');
          const arrow = item.querySelector('.mobile-menu-arrow');

          if (!submenu) return;

          const isOpen = submenu.classList.contains('active');

          // Tüm alt menüleri kapat
          document.querySelectorAll('.mobile-submenu').forEach(sub => {
            sub.classList.remove('active');
          });
          document.querySelectorAll('.mobile-menu-arrow').forEach(arr => {
            arr.classList.remove('rotated');
          });

          // Eğer kapalıysa aç
          if (!isOpen) {
            submenu.classList.add('active');
            arrow.classList.add('rotated');
          }
        });
      }
    });

    Utils.log('Mobile menu initialized');
  }

  /**
   * Scroll behavior - header hide/show
   */
  setupScrollBehavior() {
    if (!this.header) return;

    const throttledScroll = Utils.throttle(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > this.lastScrollTop && scrollTop > 100) {
        // Scroll down
        this.header.classList.add('header-hide');
        this.header.classList.remove('header-visible');
      } else {
        // Scroll up
        this.header.classList.remove('header-hide');
        this.header.classList.add('header-visible');
      }

      this.lastScrollTop = scrollTop;
    }, 100);

    window.addEventListener('scroll', throttledScroll);
  }

  /**
   * Create language switcher button
   * @param {Object} switcherConfig - Language switcher configuration
   * @returns {string} HTML string
   */
  createLanguageSwitcher(switcherConfig) {
    if (!switcherConfig || !switcherConfig.enabled) {
      return '';
    }

    const currentLang = LanguageManager.getCurrentLanguage();
    const languages = switcherConfig.languages || LanguageManager.getAvailableLanguages();
    const flagType = switcherConfig.flagType || 'emoji'; // 'emoji' veya 'svg'

    // Mevcut dilin bayrağını bul
    const currentLanguage = languages.find(lang => lang.code === currentLang);

    // Bayrak tipine göre flag HTML oluştur
    let currentFlagHtml = '';
    if (flagType === 'svg' && currentLanguage?.flagIcon) {
      currentFlagHtml = `<img src="${currentLanguage.flagIcon}" alt="${currentLanguage.name}" class="language-flag-icon" onerror="this.style.display='none'">`;
    } else if (currentLanguage?.flag) {
      currentFlagHtml = `<span class="language-flag-btn">${currentLanguage.flag}</span>`;
    } else {
      currentFlagHtml = '<i class="bi bi-globe"></i>';
    }

    return `
      <li class="nav-item dropdown language-switcher">
        <a class="nav-link dropdown-toggle" href="#" id="languageDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          ${currentFlagHtml}
          <span class="language-label">${currentLang.toUpperCase()}</span>
          <i class="bi bi-chevron-down rotate-icon"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
          ${languages.map(lang => {
            // Dropdown için bayrak HTML
            let dropdownFlagHtml = '';
            if (flagType === 'svg' && lang.flagIcon) {
              dropdownFlagHtml = `<img src="${lang.flagIcon}" alt="${lang.name}" class="language-flag-icon-dropdown" onerror="this.style.display='none'">`;
            } else if (lang.flag) {
              dropdownFlagHtml = `<span class="language-flag">${lang.flag}</span>`;
            }

            return `
              <li>
                <a class="dropdown-item language-switch-btn ${lang.code === currentLang ? 'active' : ''}"
                   href="#"
                   data-language="${lang.code}">
                  ${dropdownFlagHtml}
                  <span class="language-name">${lang.name || lang.label}</span>
                </a>
              </li>
            `;
          }).join('')}
        </ul>
      </li>
    `;
  }

  /**
   * Create mobile language switcher
   * @param {Object} switcherConfig - Language switcher configuration
   * @returns {string} HTML string
   */
  createMobileLanguageSwitcher(switcherConfig) {
    if (!switcherConfig || !switcherConfig.enabled) {
      return '';
    }

    const currentLang = LanguageManager.getCurrentLanguage();
    const languages = switcherConfig.languages || LanguageManager.getAvailableLanguages();
    const flagType = switcherConfig.flagType || 'emoji'; // 'emoji' veya 'svg'

    // Mevcut dil bayrağı
    const currentLanguage = languages.find(lang => lang.code === currentLang);
    let currentFlagHtml = '';
    if (flagType === 'svg' && currentLanguage?.flagIcon) {
      currentFlagHtml = `<img src="${currentLanguage.flagIcon}" alt="${currentLanguage.name}" class="language-flag-icon-mobile" onerror="this.style.display='none'">`;
    } else if (currentLanguage?.flag) {
      currentFlagHtml = currentLanguage.flag;
    } else {
      currentFlagHtml = '<i class="bi bi-globe"></i>';
    }

    const languageButtons = languages.map(lang => {
      let flagHtml = '';
      if (flagType === 'svg' && lang.flagIcon) {
        flagHtml = `<img src="${lang.flagIcon}" alt="${lang.name}" class="language-flag-icon-mobile-menu" onerror="this.style.display='none'">`;
      } else if (lang.flag) {
        flagHtml = `<span class="mobile-flag-emoji">${lang.flag}</span>`;
      } else {
        flagHtml = '<i class="bi bi-globe"></i>';
      }

      return `
        <a href="#"
           class="mobile-submenu-link language-switch-btn"
           data-language="${lang.code}">
          ${flagHtml}
          ${lang.name || lang.label}
        </a>
      `;
    }).join('');

    return `
      <div class="mobile-menu-item mobile-language-switcher">
        <button class="mobile-menu-link" type="button">
          ${currentFlagHtml}
          <span>${currentLang.toUpperCase()}</span>
          <i class="bi bi-chevron-down mobile-menu-arrow"></i>
        </button>
        <div class="mobile-submenu">
          ${languageButtons}
        </div>
      </div>
    `;
  }

  /**
   * Setup language switcher event listeners
   */
  setupLanguageSwitcher() {
    const languageSwitchBtns = document.querySelectorAll('.language-switch-btn');

    languageSwitchBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const languageCode = btn.getAttribute('data-language');

        if (languageCode) {
          console.log(`Switching language to: ${languageCode}`);
          LanguageManager.setLanguage(languageCode, true);
        }
      });
    });

    Utils.log('Language switcher event listeners attached');
  }

  /**
   * Dropdown setup
   */
  setupDropdowns() {
    // Bootstrap dropdown olaylarını dinle
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      dropdown.addEventListener('show.bs.dropdown', (e) => {
        Utils.log('Dropdown opened', e.target);
      });

      dropdown.addEventListener('hide.bs.dropdown', (e) => {
        Utils.log('Dropdown closed', e.target);
      });
    });
  }

  /**
   * Header offset ayarla (main-container için margin-top)
   */
  setupHeaderOffset() {
    const setOffset = () => {
      const main = document.querySelector('.main-container');
      if (this.header && main) {
        main.style.marginTop = this.header.offsetHeight + 'px';
      }
    };

    setOffset();
    window.addEventListener('resize', Utils.debounce(setOffset, 250));
  }

  /**
   * Aktif navigasyon öğelerini işaretle
   */
  setActiveNavigation() {
    // Desktop header için aktiflik ayarla
    NavigationActiveManager.setActiveItems('.main-header', {
      skipHomepage: true,          // Anasayfada aktiflik yok
      skipExternalLinks: true,     // Dış linkler aktif olmasın
      skipLanguageSwitcher: false, // Dil değiştirici dahil değil (ayrı yönetilir)
      markParentDropdown: true     // Üst menü de aktif olsun
    });

    // Mobil menü için aktiflik ayarla
    NavigationActiveManager.setActiveItems('.mobile-menu-panel', {
      skipHomepage: true,          // Anasayfada aktiflik yok
      skipExternalLinks: true,     // Dış linkler aktif olmasın
      skipLanguageSwitcher: false, // Dil değiştirici dahil değil (ayrı yönetilir)
      markParentDropdown: true     // Üst menü de aktif olsun
    });

    // Mevcut dili işaretle
    const currentLang = LanguageManager.getCurrentLanguage();
    NavigationActiveManager.setActiveLanguage('.main-header', currentLang);

    Utils.log('HeaderManager: Aktif navigasyon ayarlandı (Desktop + Mobile)');
  }

  /**
   * Header'ı yeniden yükle
   * @param {Object} newHeaderData - Yeni header verisi
   */
  async reload(newHeaderData) {
    this.headerData = newHeaderData;
    await this.loadHeader();
    this.setupDropdownInteractions();
    this.setActiveNavigation();
  }
}

export default HeaderManager;