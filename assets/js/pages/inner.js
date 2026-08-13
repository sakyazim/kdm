/**
 * Anadolu Üniversitesi Kütüphane - Inner Page
 * Genel iç sayfalar için mantık ve bileşenler
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class InnerPage {
  constructor(app, pageName) {
    this.app = app;
    this.data = app.data;
    this.config = app.config;
    this.pageName = pageName;
    this.pageData = null;

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log(`InnerPage initializing: ${this.pageName}`);

    await this.loadPageData();
    await this.setupHeroSection();
    await this.setupContent();
    this.setupNavigation();
    await this.setupHelpSection();
    this.setupPageSpecific();

    Utils.log(`InnerPage initialized: ${this.pageName}`);
  }

  async loadPageData() {
    const consolidatedPages = {
      'anadolu-universitesi-arastirma-birimleri': 'arastirma_birimleri',
      'anadolu-universitesi-arastirma-mevzuati': 'arastirma_mevzuati',
      'anadolu-universitesi-arastirma-duyurulari': 'arastirma_duyurulari',
      'anadolu-universitesi-arastirmalardan-haberler': 'arastirmalardan_haberler',
      'arastirma-birimleri': 'arastirma_birimleri',
      'arastirma-mevzuati': 'arastirma_mevzuati',
      'arastirma-duyurulari': 'arastirma_duyurulari',
      'arastirmalardan-haberler': 'arastirmalardan_haberler'
    };

    const pageKey = consolidatedPages[this.pageName];

    if (pageKey) {
      const consolidatedData = await this.app.loadPageData('anadolu-arastirma');
      if (consolidatedData && consolidatedData[pageKey]) {
        this.pageData = consolidatedData[pageKey];
      } else {
        console.warn(`Data for '${pageKey}' not found in anadolu-arastirma.json`);
        this.pageData = null;
      }
    } else {
      this.pageData = await this.app.loadPageData(this.pageName);
    }

    if (!this.pageData) {
      console.warn(`Page data not found for: ${this.pageName}`);
      this.pageData = {
        hero: {
          title: this.getDefaultTitle(),
          description: 'Sayfa içeriği yükleniyor...'
        }
      };
    }
  }

  async setupHeroSection() {
    if (!this.pageData.hero) {
      console.warn('Hero data not found in page data');
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

    // Skip content rendering if page handles it with custom script
    // Check if page has custom content structure (like makale-islem-ucretleri, kime-sormaliyim, koleksiyon-kat-plani)
    if (!this.pageData.content && (this.pageData.quickNav || this.pageData.generalInfo || this.pageData.publishers || this.pageData.departments || this.pageData.floors)) {
      // Page has custom rendering logic in the HTML file
      return;
    }

    if (!this.pageData.content) {
      console.warn('Content data not found in page data');
      return;
    }

    // Check if content is an empty object - skip rendering
    if (typeof this.pageData.content === 'object' && !Array.isArray(this.pageData.content) && Object.keys(this.pageData.content).length === 0) {
      console.log('Content is empty object, skipping render (custom page logic expected)');
      return;
    }

    // Sayfa içeriğini render et
    this.renderContent(container, this.pageData.content);
  }

  renderContent(container, contentData) {
    // Check if contentData is using the new component-based structure
    if (Array.isArray(contentData)) {
      // New component-based structure
      let contentHtml = '';

      contentData.forEach(section => {
        if (section.components && Array.isArray(section.components)) {
          const sectionId = section.id || '';
          const sectionClass = section.className || '';

          // Find the first heading component (if any)
          let headingComponent = null;
          let otherComponents = [];

          section.components.forEach(comp => {
            if (comp.type === 'heading') {
              headingComponent = comp;
            } else {
              otherComponents.push(comp);
            }
          });

          // Wrap in section-card structure for integrated header+body look
          contentHtml += `
            <section class="section-card ${sectionClass}" ${sectionId ? `id="${sectionId}"` : ''}>
              ${headingComponent ? ComponentRenderer.render(headingComponent) : ''}
              ${otherComponents.length > 0 ? `
                <div class="section-card-body">
                  ${ComponentRenderer.renderMultiple(otherComponents)}
                </div>
              ` : ''}
            </section>
          `;
        }
      });

      container.innerHTML = contentHtml;
      return;
    }

    // Legacy support for old content structures
    if (contentData.html) {
      container.innerHTML = contentData.html;
      return;
    }

    let contentHtml = '';

    if (contentData.sections) {
      contentHtml = contentData.sections.map(section => {
        return `
          <section class="content-section">
            ${section.title ? `<h2>${section.title}</h2>` : ''}
            ${section.content || ''}
          </section>
        `;
      }).join('');
    } else if (contentData.cards) {
      contentHtml = contentData.cards.map(card => {
        let cardContent = '';
        if (Array.isArray(card.content)) {
          if (card.content.length === 0) {
            cardContent = '<p>Henüz bir bilgi girilmemiştir.</p>';
          } else {
            cardContent = `<ul>${card.content.map(item => {
              if (typeof item === 'string') {
                return `<li>${item}</li>`;
              } else if (typeof item === 'object' && item.text && item.link) {
                return `<li><a href="${item.link}" target="_blank">${item.text}</a></li>`;
              }
              return '';
            }).join('')}</ul>`;
          }
        } else if (card.content) {
          cardContent = `<p>${card.content}</p>`;
        } else {
            cardContent = '<p>Henüz bir bilgi girilmemiştir.</p>';
        }

        return `
          <div class="card mb-4">
            <div class="card-body">
              ${card.title ? `<h5 class="card-title">${card.title}</h5>` : ''}
              ${card.subtitle ? `<h6 class="card-subtitle mb-2 text-muted">${card.subtitle}</h6>` : ''}
              ${cardContent}
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = contentHtml;
  }

  setupNavigation() {
    // Navigation implementation (gerekirse)
  }

  async setupHelpSection() {
    const helpData = this.pageData.helpSection || this.pageData.help;
    if (!helpData) {
      console.warn('Help section data not found in page data');
      return;
    }

    await this.helpSectionManager.init(helpData);
  }

  setupPageSpecific() {
    // Page specific setup (alt sınıflar override edebilir)
  }

  getDefaultTitle() {
    return this.pageName.charAt(0).toUpperCase() + this.pageName.slice(1);
  }
}

export default InnerPage;