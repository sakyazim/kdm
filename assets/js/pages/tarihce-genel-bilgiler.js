/**
 * Anadolu Üniversitesi Kütüphane - Tarihçe ve Genel Bilgiler Sayfası
 * Global Component Sistemi ile
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class TarihceGenelBilgilerPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('TarihceGenelBilgilerPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();
    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('TarihceGenelBilgilerPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/tarihce-genel-bilgiler.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('Tarihçe ve Genel Bilgiler data loaded successfully');
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
        title: 'Tarihçe ve Genel Bilgiler',
        description: 'Kütüphane hakkında bilgi edinin.',
        icon: 'bi bi-clock-history'
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
    const container = document.getElementById('main-content-container');

    if (!container) {
      console.warn('Main content container not found');
      return;
    }

    if (!this.pageData.content || this.pageData.content.length === 0) {
      console.warn('Content data not found');
      return;
    }

    this.renderContent(this.pageData.content);
  }

  /**
   * Component-based content rendering
   */
  renderContent(contentSections) {
    const container = document.getElementById('main-content-container');
    let html = '<div class="content-wrapper">';

    contentSections.forEach((section, sectionIndex) => {
      const { id, components } = section;

      if (!components || components.length === 0) {
        return;
      }

      // İlk component heading mi kontrol et
      const firstComponent = components[0];
      const isFirstHeading = firstComponent.type === 'heading';

      // Section card başlat
      html += `<div class="section-card" ${id ? `id="${id}"` : ''}>`;

      // İlk component heading ise direkt render et
      if (isFirstHeading) {
        html += ComponentRenderer.render(firstComponent);

        // Kalan componentler varsa section-card-body içine al
        if (components.length > 1) {
          html += '<div class="section-card-body">';
          for (let i = 1; i < components.length; i++) {
            html += ComponentRenderer.render(components[i]);
          }
          html += '</div>';
        }
      } else {
        // İlk component heading değilse tüm componentleri section-card-body içine al
        html += '<div class="section-card-body">';
        components.forEach(component => {
          html += ComponentRenderer.render(component);
        });
        html += '</div>';
      }

      html += '</div>'; // section-card sonu
    });

    html += '</div>'; // content-wrapper sonu

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

export default TarihceGenelBilgilerPage;
