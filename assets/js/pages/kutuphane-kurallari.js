/**
 * Anadolu Üniversitesi Kütüphane - Kütüphane Kuralları Sayfası
 * Global Component Sistemi ile
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class KutuphaneKurallariPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('KutuphaneKurallariPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();
    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('KutuphaneKurallariPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/kutuphane-kurallari.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('Library rules data loaded successfully');
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
        title: 'Kütüphane Kullanım Kuralları',
        description: 'Kütüphane kuralları hakkında bilgi edinin.',
        icon: 'bi bi-book'
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
    const container = document.getElementById('library-rules-content');

    if (!container) {
      console.warn('Library rules content container not found');
      return;
    }

    this.renderContent(this.pageData.content);
  }

  /**
   * Ana içeriği render et - Component-based yapı
   * @param {Array} contentSections - Section dizisi
   */
  renderContent(contentSections) {
    const container = document.getElementById('library-rules-content');
    if (!container) {
      console.error('Content container not found!');
      return;
    }

    let html = '';

    contentSections.forEach(section => {
      const { id, components } = section;

      // Section wrapper başlat
      html += `<section id="${id}" class="section-card">`;

      // İlk component heading mi kontrol et
      const firstComponent = components[0];
      const isFirstHeading = firstComponent && firstComponent.type === 'heading';

      if (isFirstHeading) {
        // İlk heading'i render et
        html += ComponentRenderer.render(firstComponent);

        // Geri kalan componentler section-card-body içinde
        if (components.length > 1) {
          html += '<div class="section-card-body">';
          components.slice(1).forEach(component => {
            html += ComponentRenderer.render(component);
          });
          html += '</div>';
        }
      } else {
        // Heading yoksa tüm componentleri section-card-body içinde render et
        html += '<div class="section-card-body">';
        components.forEach(component => {
          html += ComponentRenderer.render(component);
        });
        html += '</div>';
      }

      html += `</section>`;
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

export default KutuphaneKurallariPage;
