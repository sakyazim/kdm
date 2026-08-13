/**
 * Mobile Bottom Bar Component
 * Sticky bottom navigation bar with 4 buttons and panels
 */

import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';

export class MobileBottomBar {
  constructor() {
    this.bottomBar = null;
    this.overlay = null;
    this.activePanel = null;
    this.footerData = null;
  }

  /**
   * Initialize the bottom bar
   * @param {Object} footerData - Footer data for sitemap and contact info
   */
  async init(footerData = null) {
    this.footerData = footerData;

    // Only run on mobile (but always render, just hide with CSS on desktop)
    this.render();
    this.setupEventListeners();

    console.log('MobileBottomBar initialized');
  }

  /**
   * Get translations for bottom bar
   */
  getTranslations() {
    const currentLang = LanguageManager.getCurrentLanguage();
    const translations = {
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
      },
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
    };
    return translations[currentLang] || translations.tr;
  }

  /**
   * Render the bottom bar HTML
   */
  render() {
    const t = this.getTranslations();

    const bottomBarHTML = `
      <!-- Mobile Bottom Bar -->
      <div class="mobile-bottom-bar">
        <div class="bottom-bar-grid">
          <button class="bottom-bar-btn" data-action="quick-actions">
            <i class="bi bi-lightning-charge-fill"></i>
            <span>${t.quickActions}</span>
          </button>
          <button class="bottom-bar-btn" data-action="accessibility">
            <i class="bi bi-universal-access"></i>
            <span>${t.accessibility}</span>
          </button>
          <button class="bottom-bar-btn" data-panel="sitemap">
            <i class="bi bi-map-fill"></i>
            <span>${t.sitemap}</span>
          </button>
          <button class="bottom-bar-btn" data-panel="contact-social">
            <i class="bi bi-telephone-fill"></i>
            <span>${t.contact}</span>
          </button>
        </div>
      </div>

      <!-- Bottom Bar Overlay -->
      <div class="bottom-bar-overlay"></div>

      <!-- Sitemap Panel -->
      <div class="bottom-bar-panel" data-panel-id="sitemap">
        <div class="bottom-bar-panel-header">
          <h3 class="bottom-bar-panel-title">
            <i class="bi bi-map-fill"></i>
            ${t.sitemap}
          </h3>
          <button class="bottom-bar-panel-close" aria-label="${t.close}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="bottom-bar-panel-content">
          ${this.renderSitemapContent()}
        </div>
      </div>

      <!-- Contact & Social Media Panel -->
      <div class="bottom-bar-panel" data-panel-id="contact-social">
        <div class="bottom-bar-panel-header">
          <h3 class="bottom-bar-panel-title">
            <i class="bi bi-telephone-fill"></i>
            ${t.contactSocial}
          </h3>
          <button class="bottom-bar-panel-close" aria-label="${t.close}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="bottom-bar-panel-content">
          ${this.renderContactSocialContent()}
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', bottomBarHTML);

    // Cache elements
    this.bottomBar = document.querySelector('.mobile-bottom-bar');
    this.overlay = document.querySelector('.bottom-bar-overlay');
  }


  /**
   * Render Sitemap content
   */
  renderSitemapContent() {
    const t = this.getTranslations();

    if (!this.footerData || !this.footerData.columns) {
      return `<p style="text-align: center; padding: 20px;">${t.loading}</p>`;
    }

    return this.footerData.columns.map(column => {
      // Çoklu dil desteği
      const columnTitle = Utils.getLocalizedText(column.title);

      const linksHTML = column.links.map(link => {
        const linkText = Utils.getLocalizedText(link.text);
        return `
          <li>
            <a href="${link.url}">
              <i class="bi bi-arrow-right-short"></i>
              ${linkText}
            </a>
          </li>
        `;
      }).join('');

      return `
        <div class="panel-link-group">
          <h4 class="panel-link-group-title">${columnTitle}</h4>
          <ul class="panel-link-list">
            ${linksHTML}
          </ul>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Contact & Social Media content
   */
  renderContactSocialContent() {
    const t = this.getTranslations();

    const defaultContact = [
      { icon: 'bi-telephone-fill', text: '0 222 335 05 80 / 1730', url: 'tel:+902223350580' },
      { icon: 'bi-envelope-fill', text: 'library@anadolu.edu.tr', url: 'mailto:library@anadolu.edu.tr' },
      { icon: 'bi-geo-alt-fill', text: { tr: 'Anadolu Üniversitesi, Eskişehir', en: 'Anadolu University, Eskisehir' }, url: 'https://goo.gl/maps/YJrNZmkJFVGACbL99' }
    ];

    const defaultSocial = [
      { icon: 'bi-facebook', url: 'https://facebook.com/anadoluuniversitesi', title: 'Facebook' },
      { icon: 'bi-twitter-x', url: 'https://twitter.com/anadoluuni', title: 'Twitter' },
      { icon: 'bi-instagram', url: 'https://instagram.com/anadoluuniversitesi', title: 'Instagram' },
      { icon: 'bi-youtube', url: 'https://youtube.com/@anadoluuniversitesi', title: 'YouTube' },
      { icon: 'bi-linkedin', url: 'https://linkedin.com/school/anadolu-universitesi', title: 'LinkedIn' }
    ];

    const contactInfo = this.footerData?.contactInfo || defaultContact;
    const socialMedia = this.footerData?.socialMedia || defaultSocial;

    const contactHTML = contactInfo.map(contact => {
      // Çoklu dil desteği
      const contactText = Utils.getLocalizedText(contact.text);
      return `
        <li>
          <a href="${contact.url}" ${contact.target ? `target="${contact.target}"` : ''}>
            <i class="bi ${contact.icon}"></i>
            ${contactText}
          </a>
        </li>
      `;
    }).join('');

    const socialHTML = socialMedia.map(social => `
      <a href="${social.url}" class="social-link" aria-label="${social.title}" ${social.target ? `target="${social.target}"` : ''}>
        <i class="bi ${social.icon}"></i>
      </a>
    `).join('');

    return `
      <div class="contact-social-grid">
        <div class="contact-section">
          <h4><i class="bi bi-telephone-fill"></i> ${t.contactInfo}</h4>
          <ul class="contact-list">
            ${contactHTML}
          </ul>
        </div>
        <div class="social-section">
          <h4><i class="bi bi-share-fill"></i> ${t.socialMedia}</h4>
          <div class="social-grid">
            ${socialHTML}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const buttons = document.querySelectorAll('.bottom-bar-btn');
    const closeButtons = document.querySelectorAll('.bottom-bar-panel-close');
    const panels = document.querySelectorAll('.bottom-bar-panel');

    // Button clicks - open panels or trigger actions
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const panelId = button.dataset.panel;
        const action = button.dataset.action;

        // Eğer action varsa (quick actions, accessibility), mevcut fonksiyonları çağır
        if (action === 'quick-actions') {
          // Quick actions panelini DOM'dan direkt bul ve toggle et
          const qaPanel = document.querySelector('.quick-actions-panel');
          if (qaPanel) {
            qaPanel.classList.toggle('active');
          } else {
            console.warn('Quick actions panel not found in DOM!');
          }
          return;
        }

        if (action === 'accessibility') {
          // Accessibility manager'a direkt erişim
          if (window.libraryApp && window.libraryApp.accessibilityManager) {
            console.log('Accessibility manager found, toggling panel...');
            window.libraryApp.accessibilityManager.togglePanel();
            return;
          } else {
            console.warn('Accessibility manager not found!');
          }
        }

        // Panel açma
        if (panelId) {
          this.openPanel(panelId);
        }
      });
    });

    // Close button clicks
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.closeAllPanels();
      });
    });

    // Overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        this.closeAllPanels();
      });
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllPanels();
      }
    });

    console.log('MobileBottomBar event listeners attached');
  }

  /**
   * Open a specific panel
   * @param {string} panelId - Panel ID to open
   */
  openPanel(panelId) {
    // Close all panels first
    this.closeAllPanels();

    // Find and open the specific panel
    const panel = document.querySelector(`.bottom-bar-panel[data-panel-id="${panelId}"]`);
    const button = document.querySelector(`.bottom-bar-btn[data-panel="${panelId}"]`);

    if (panel && this.overlay) {
      panel.classList.add('active');
      this.overlay.classList.add('active');
      button?.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activePanel = panel;
    }
  }

  /**
   * Close all panels
   */
  closeAllPanels() {
    const panels = document.querySelectorAll('.bottom-bar-panel');
    const buttons = document.querySelectorAll('.bottom-bar-btn');

    panels.forEach(panel => panel.classList.remove('active'));
    buttons.forEach(button => button.classList.remove('active'));

    if (this.overlay) {
      this.overlay.classList.remove('active');
    }

    document.body.style.overflow = '';
    this.activePanel = null;
  }

  /**
   * Destroy the bottom bar
   */
  destroy() {
    if (this.bottomBar) {
      this.bottomBar.remove();
    }
    if (this.overlay) {
      this.overlay.remove();
    }
    document.querySelectorAll('.bottom-bar-panel').forEach(panel => panel.remove());
    document.body.style.overflow = '';
    document.body.style.paddingBottom = '';
  }
}

export default MobileBottomBar;
