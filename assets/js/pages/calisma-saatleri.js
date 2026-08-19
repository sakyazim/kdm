/**
 * Anadolu Üniversitesi Kütüphane - Çalışma Saatleri Sayfası
 * JSON-Based Content System ile globalleştirildi
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class CalismaSaatleriPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('CalismaSaatleriPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();
    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('CalismaSaatleriPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/calisma-saatleri.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('Çalışma Saatleri data loaded successfully');

        // QuickAccess section'larını yeniden cache et
        setTimeout(() => {
          if (this.app && this.app.quickAccess) {
            this.app.quickAccess.cacheSectionElements();
            console.log('✅ QuickAccess sections refreshed after content load');
          }
        }, 100);
      } else {
        console.warn('Failed to load Çalışma Saatleri data');
        this.loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading Çalışma Saatleri data:', error);
      this.loadFallbackData();
    }
  }

  loadFallbackData() {
    this.pageData = {
      hero: {
        title: 'Çalışma Saatleri',
        description: 'Kütüphane bölümlerimizin çalışma saatleri ve iletişim bilgileri',
        icon: 'fas fa-clock'
      },
      content: [],
      helpSection: {
        title: 'Yardıma mı ihtiyacınız var?',
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
    const container = document.querySelector('.content-wrapper');

    if (!container) {
      console.warn('Content wrapper not found');
      return;
    }

    // Açık/Kapalı rozeti (tatil takvimi için) sayfa verisini renderer'a ver
    ComponentRenderer.registerPageData(this.pageData);

    // JSON'dan içeriği render et
    this.renderContent(this.pageData.content);
  }

  /**
   * JSON'dan içeriği render et
   * Her section için otomatik card wrapper oluştur
   */
  renderContent(contentSections) {
    const container = document.querySelector('.content-wrapper');
    if (!container || !contentSections || contentSections.length === 0) {
      console.error('Content container veya data bulunamadı!');
      return;
    }

    let html = '';

    // Her section için card wrapper oluştur
    contentSections.forEach(section => {
      // Alert section için özel durum - card wrapper olmadan
      if (section.id === 'alert-section') {
        html += `
          <section class="alert-section" id="${section.id}">
            <div id="${section.id}-components"></div>
          </section>
        `;
      } else {
        html += `
          <section class="section-card" id="${section.id}">
            <div id="${section.id}-components"></div>
          </section>
        `;
      }
    });

    container.innerHTML = html;

    // Her section'ın bileşenlerini render et
    contentSections.forEach(section => {
      const sectionContainer = document.getElementById(`${section.id}-components`);
      if (sectionContainer && section.components) {
        // Alert section için özel durum
        if (section.id === 'alert-section') {
          // Alert'leri direkt render et, card wrapper yok
          section.components.forEach(component => {
            ComponentRenderer.appendTo(`${section.id}-components`, component);
          });
        } else {
          // Normal section işlemi
          // İlk component heading mi kontrol et
          const firstComponent = section.components[0];
          const hasHeading = firstComponent && firstComponent.type === 'heading';

          // Heading varsa direkt render et
          if (hasHeading) {
            ComponentRenderer.appendTo(`${section.id}-components`, firstComponent);
          }

          // Geri kalan componentleri section-card-body içine al
          if (section.components.length > 1 || !hasHeading) {
            const bodyContainer = document.createElement('div');
            bodyContainer.className = 'section-card-body' + (section.layout ? ' layout-' + section.layout : '');
            bodyContainer.id = `${section.id}-body`;
            sectionContainer.appendChild(bodyContainer);

            // Heading'den sonraki componentleri body'ye render et
            const remainingComponents = hasHeading ? section.components.slice(1) : section.components;
            remainingComponents.forEach(component => {
              ComponentRenderer.appendTo(`${section.id}-body`, component);
            });
          }
        }
      }
    });

    Utils.log(`${contentSections.length} sections rendered with global component system`);
  }

  async setupHelpSection() {
    const helpData = this.pageData.helpSection || this.pageData.help;
    if (!helpData) {
      console.warn('Help section data not found');
      return;
    }

    await this.helpSectionManager.init(helpData);
  }
}

export default CalismaSaatleriPage;
