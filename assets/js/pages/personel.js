/**
 * Anadolu Üniversitesi Kütüphane - Personel Sayfası
 * Global Component Sistemi ile Refactor Edilmiştir
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class PersonelPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('PersonelPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();
    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('PersonelPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/personel.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('Personel data loaded successfully');
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
        title: 'Personel',
        description: 'Kütüphane personeli ve bölümler hakkında bilgi edinin.',
        icon: 'bi bi-people'
      },
      content: [],
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
    const container = document.getElementById('personel-content');

    if (!container) {
      console.warn('Personel content container not found');
      return;
    }

    this.renderContent(this.pageData.content);
  }

  /**
   * Ana içerik render metodu - ComponentRenderer kullanır
   */
  renderContent(contentSections) {
    const container = document.getElementById('personel-content');
    if (!container) {
      console.error('Personel content container not found');
      return;
    }

    let html = '';

    contentSections.forEach(section => {
      const { components } = section;

      if (!components || components.length === 0) {
        return;
      }

      // İlk component heading mi kontrol et
      const firstComponent = components[0];
      const isFirstHeading = firstComponent.type === 'heading';

      // Alert section'lar için card wrapper kullanma
      const isAlertSection = components.every(c => c.type === 'alert');

      if (isAlertSection) {
        // Alert section'lar direkt render edilir
        html += components.map(component => ComponentRenderer.render(component)).join('');
      } else {
        // Normal section - card wrapper ekle
        html += '<div class="section-card">';

        if (isFirstHeading) {
          // İlk heading direkt render edilir
          html += ComponentRenderer.render(firstComponent);

          // Geri kalan componentler card-body içinde
          if (components.length > 1) {
            html += '<div class="section-card-body">';
            html += components.slice(1).map(component =>
              ComponentRenderer.render(component)
            ).join('');
            html += '</div>';
          }
        } else {
          // Heading yoksa tüm componentler card-body içinde
          html += '<div class="section-card-body">';
          html += components.map(component =>
            ComponentRenderer.render(component)
          ).join('');
          html += '</div>';
        }

        html += '</div>'; // section-card kapanış
      }
    });

    container.innerHTML = html;
  }

  async setupHelpSection() {
    if (!this.pageData.helpSection) {
      console.warn('Help section data not found');
      return;
    }

    await this.helpSectionManager.init(this.pageData.helpSection);
  }
}

export default PersonelPage;
