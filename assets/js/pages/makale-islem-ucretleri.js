/**
 * Anadolu Üniversitesi Kütüphane - Makale İşlem Ücretleri (APC) Sayfası
 * Global Hybrid TOC Component ile
 * Version: 2.0
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import HybridTOC from '../components/hybrid-toc.js';  // ← YENİ: Global TOC

export class MakaleIslemUcretleriPage {
  constructor(app) {
    this.app = app;
    this.data = app.data;
    this.config = app.config;
    this.pageData = null;

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('MakaleIslemUcretleriPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();

    // TOC'yi başlat (YENİ: Global component kullanımı)
    if (this.pageData.toc && this.pageData.toc.enabled) {
      HybridTOC.init(this.pageData.toc);
    }

    await this.setupContent();
    await this.setupHelpSection();

    // Adaptive layout sistemi - Container Query fallback
    this.setupAdaptiveLayout();

    Utils.log('MakaleIslemUcretleriPage initialized');
  }

  /**
   * Adaptive Layout System
   * Container Query desteği yoksa JavaScript fallback
   */
  setupAdaptiveLayout() {
    // Container Query desteği kontrolü
    const supportsContainerQueries = 'container' in document.documentElement.style;

    if (!supportsContainerQueries) {
      console.log('⚠️ Container Queries desteklenmiyor, JavaScript fallback kullanılıyor');
      this.initLayoutObserver();
    } else {
      console.log('✅ Container Queries destekleniyor');
    }
  }

  /**
   * Layout Observer - İçerik alanı genişliğini izler
   */
  initLayoutObserver() {
    const pageContainer = document.querySelector('.page-container');
    const desktopSidebar = document.querySelector('.toc-desktop-sidebar');
    const mobileToggle = document.querySelector('.toc-mobile-toggle');
    const mobileDrawer = document.querySelector('.toc-mobile-drawer');
    const overlay = document.querySelector('.toc-overlay');

    if (!pageContainer) return;

    const checkLayout = () => {
      const containerWidth = pageContainer.offsetWidth;
      const BREAKPOINT = 1050; // Container 1050px altında drawer moda geç

      if (containerWidth < BREAKPOINT) {
        // Drawer moduna geç
        if (desktopSidebar) desktopSidebar.style.display = 'none';
        if (mobileToggle) mobileToggle.style.display = 'flex';
        if (mobileDrawer) mobileDrawer.style.display = 'flex';
        if (overlay) overlay.style.display = 'block';
        pageContainer.style.paddingLeft = '20px';
      } else {
        // Sidebar moduna geç
        if (desktopSidebar) desktopSidebar.style.display = 'block';
        if (mobileToggle) mobileToggle.style.display = 'none';
        if (mobileDrawer) mobileDrawer.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        pageContainer.style.paddingLeft = '300px';
      }
    };

    // ResizeObserver kullan (modern tarayıcılar)
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(checkLayout);
      resizeObserver.observe(pageContainer);
    } else {
      // Fallback: window resize eventi
      checkLayout();
      window.addEventListener('resize', Utils.debounce(checkLayout, 150));
    }

    // İlk kontrol
    checkLayout();
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/makale-islem-ucretleri.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('APC data loaded successfully');
      } else {
        console.warn('Failed to load page data');
        this.loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading page data:', error);
      this.loadFallbackData();
    }
  }

  loadFallbackData() {
    this.pageData = {
      hero: {
        title: 'Makale İşlem Ücretleri (APC)',
        description: 'APC hizmetleri hakkında bilgi edinin.',
        icon: 'bi bi-cash-coin'
      },
      toc: { enabled: false },
      generalInfo: {},
      requirements: {},
      publishers: [],
      contact: {},
      helpSection: {
        title: 'Daha fazla bilgi almak ister misiniz?',
        description: 'Bizimle iletişime geçin.',
        buttons: []
      }
    };
  }

  async setupHeroSection() {
    if (!this.pageData.hero) {
      console.warn('Hero data not found');
      return;
    }

    await this.heroManager.init(this.pageData.hero);
  }

  async setupContent() {
    const container = document.getElementById('apc-content');

    if (!container) {
      console.warn('APC content container not found');
      return;
    }

    if (!this.pageData) {
      console.error('Page data not loaded');
      return;
    }

    this.renderMainContent(this.pageData);
    this.initCardAnimations();
  }

  renderMainContent(data) {
    const container = document.getElementById('apc-content');

    if (!data) {
      console.error('No data provided to renderMainContent');
      return;
    }

    let html = '';

    // Genel Bilgi
    if (data.generalInfo) {
      html += this.renderGeneralInfo(data.generalInfo);
    }

    // Gerekli Şartlar
    if (data.requirements) {
      html += this.renderRequirements(data.requirements);
    }

    // Yayıncılar
    if (data.publishers && Array.isArray(data.publishers)) {
      data.publishers.forEach(publisher => {
        html += this.renderPublisher(publisher);
      });
    }

    // İletişim
    if (data.contact) {
      html += this.renderContact(data.contact);
    }

    container.innerHTML = html;
  }

  renderGeneralInfo(info) {
    let html = `
      <div id="${info.id}" class="info-card">
        <div class="card-header">
          <i class="${info.icon}"></i>
          ${Utils.getLocalizedText(info.title)}
        </div>
        <div class="card-body">
          <p class="lead">${Utils.mdToHtml(Utils.getLocalizedText(info.content.intro))}</p>
    `;

    // Info boxes
    if (info.content.infoBoxes) {
      info.content.infoBoxes.forEach(box => {
        html += `
          <div class="info-box">
            <div class="info-title">
              <i class="${box.icon}"></i>
              ${Utils.getLocalizedText(box.title)}
            </div>
            <p>${Utils.mdToHtml(Utils.getLocalizedText(box.text))}</p>
          </div>
        `;
      });
    }

    html += `
          <p>${Utils.mdToHtml(Utils.getLocalizedText(info.content.description))}</p>
        </div>
      </div>
    `;

    return html;
  }

  renderRequirements(req) {
    let html = `
      <div id="${req.id}" class="info-card">
        <div class="card-header">
          <i class="${req.icon}"></i>
          ${Utils.getLocalizedText(req.title)}
        </div>
        <div class="card-body">
          <p>${Utils.getLocalizedText(req.intro)}</p>
          <ul class="requirements-list">
    `;

    req.items.forEach(item => {
      html += `
        <li>
          <i class="${item.icon}"></i>
          <div>
            <strong>${Utils.getLocalizedText(item.title)}</strong> ${Utils.mdToHtml(Utils.getLocalizedText(item.description))}
          </div>
        </li>
      `;
    });

    html += `
          </ul>
        </div>
      </div>
    `;

    return html;
  }

  renderPublisher(pub) {
    let html = `
      <div id="${pub.id}" class="publisher-card">
        <div class="publisher-header">
          <h3 class="publisher-name">${pub.emoji} ${Utils.getLocalizedText(pub.name)}</h3>
          <div>
    `;

    // Badges
    if (pub.badges) {
      pub.badges.forEach(badge => {
        html += `<span class="price-badge price-${badge.type}">${Utils.getLocalizedText(badge.text)}</span>`;
      });
    }

    // Token info
    if (pub.tokenInfo) {
      html += `
        <div class="token-counter mt-2">
          <small>${Utils.getLocalizedText(pub.tokenInfo.label)}</small>
          <span class="token-number">${pub.tokenInfo.count.toLocaleString('tr-TR')}</span>
        </div>
      `;
    }

    html += `
          </div>
        </div>
        <div class="publisher-content">
          <p>${Utils.mdToHtml(Utils.getLocalizedText(pub.description))}</p>
    `;

    // Warnings
    if (pub.warnings) {
      pub.warnings.forEach(warning => {
        html += `
          <div class="warning-box">
            <div class="warning-title">
              <i class="${warning.icon}"></i>
              ${Utils.getLocalizedText(warning.title)}
            </div>
            <ul class="mb-0">
        `;
        warning.items.forEach(item => {
          html += `<li>${Utils.mdToHtml(Utils.getLocalizedText(item))}</li>`;
        });
        html += `
            </ul>
          </div>
        `;
      });
    }

    // Info Boxes
    if (pub.infoBoxes) {
      pub.infoBoxes.forEach(box => {
        html += `
          <div class="info-box">
            <div class="info-title">
              <i class="${box.icon}"></i>
              ${Utils.getLocalizedText(box.title)}
            </div>
            <p>${Utils.mdToHtml(Utils.getLocalizedText(box.text))}</p>
          </div>
        `;
      });
    }

    // Guidelines
    if (pub.guidelines) {
      html += `<div class="guidelines-list">`;
      pub.guidelines.forEach(guide => {
        html += `
          <div class="guideline-item">
            <div class="guideline-number">${guide.number}</div>
            <div>${Utils.mdToHtml(Utils.getLocalizedText(guide.text))}</div>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Resources
    if (pub.resources) {
      html += `<div class="resource-links">`;
      pub.resources.forEach(res => {
        html += `
          <a href="${res.url}" target="_blank" class="resource-link">
            <div class="resource-icon">
              <i class="${res.icon}"></i>
            </div>
            <div class="resource-content">
              <h6>${Utils.getLocalizedText(res.title)}</h6>
              <small>${Utils.mdToHtml(Utils.getLocalizedText(res.description))}</small>
            </div>
          </a>
        `;
      });
      html += `</div>`;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  renderContact(contact) {
    let html = `
      <div id="${contact.id}" class="contact-section">
        <h4><i class="${contact.icon}"></i> ${Utils.getLocalizedText(contact.title)}</h4>
        <p>${Utils.mdToHtml(Utils.getLocalizedText(contact.description))}</p>
        <div class="contact-info">
    `;

    contact.items.forEach(item => {
      html += `
        <a href="${item.url}" class="contact-item">
          <i class="${item.icon}"></i>
          <div>
            <strong>${Utils.getLocalizedText(item.name)}</strong><br>
            <small>${item.email || item.phone}</small>
          </div>
        </a>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  initCardAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
          entry.target.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);
        }
      });
    }, observerOptions);

    // Tüm publisher card'ları ve info card'ları gözlemle
    document.querySelectorAll('.publisher-card, .info-card').forEach(card => {
      observer.observe(card);
    });
  }

  async setupHelpSection() {
    if (!this.pageData.helpSection) {
      console.warn('Help section data not found');
      return;
    }

    await this.helpSectionManager.init(this.pageData.helpSection);
  }
}

export default MakaleIslemUcretleriPage;
