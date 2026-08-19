/**
 * Anadolu Üniversitesi Kütüphane - Erişilebilirlik Beyanı Sayfası
 * JSON-Based Content System ile oluşturuldu
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class ErisilebilirlikPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('ErisilebilirlikPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();
    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('ErisilebilirlikPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/erisilebilirlik.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('Erisilebilirlik data loaded successfully');

        // QuickAccess section'larını yeniden cache et
        setTimeout(() => {
          if (this.app && this.app.quickAccess) {
            this.app.quickAccess.cacheSectionElements();
            console.log('✅ QuickAccess sections refreshed after content load');
          }
        }, 100);
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
        title: 'Erişilebilirlik Beyanı',
        description: 'Anadolu Üniversitesi Kütüphanesi, tüm kullanıcılarının bilgi kaynaklarına eşit ve engelsiz erişimini sağlamaya kararlıdır.',
        icon: 'bi bi-universal-access'
      },
      content: [],
      helpSection: {
        title: 'Erişilebilirlik konusunda yardıma mı ihtiyacınız var?',
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
    const container = document.getElementById('main-content-container');

    if (!container) {
      console.warn('Main content container not found');
      return;
    }

    // JSON'dan içeriği render et
    this.renderContent(this.pageData.content);
  }

  /**
   * JSON'dan içeriği render et
   * Her section için otomatik card wrapper oluştur
   */
  renderContent(contentSections) {
    const container = document.getElementById('main-content-container');
    if (!container || !contentSections || contentSections.length === 0) {
      console.error('Content container veya data bulunamadı!');
      return;
    }

    let html = '';

    // Her section için card wrapper oluştur
    contentSections.forEach(section => {
      html += `
        <section class="section-card" id="${section.id}">
          <div id="${section.id}-components"></div>
        </section>
      `;
    });

    container.innerHTML = html;

    // Her section'ın bileşenlerini render et
    contentSections.forEach(section => {
      const sectionContainer = document.getElementById(`${section.id}-components`);
      if (sectionContainer && section.components) {
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
    });

    Utils.log(`${contentSections.length} sections rendered with card wrappers`);
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

export default ErisilebilirlikPage;
