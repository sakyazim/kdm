/**
 * Anadolu Üniversitesi Kütüphane - Mendeley Referans Yönetim Aracı Sayfası
 * Global Hybrid TOC Component ile
 * Version: 2.0
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import HybridTOC from '../components/hybrid-toc.js';  // ← YENİ: Global TOC

export class MendeleyReferansYonetimAraciPage {
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
    Utils.log('MendeleyReferansYonetimAraciPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();

    // TOC'yi başlat (YENİ: Global component kullanımı)
    if (this.pageData.toc && this.pageData.toc.enabled) {
      HybridTOC.init(this.pageData.toc);
    }

    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('MendeleyReferansYonetimAraciPage initialized');
  }

  /**
   * Sayfa verilerini yükle
   */
  async loadPageData() {
    try {
      const response = await fetch('data/pages/mendeley-referans-yonetim-araci.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('Mendeley page data loaded', this.pageData);
      } else {
        Utils.error('Failed to load Mendeley page data');
      }
    } catch (error) {
      Utils.error('Error loading Mendeley page data:', error);
    }
  }

  /**
   * Hero section'ı kur
   */
  async setupHeroSection() {
    if (!this.pageData?.hero) {
      Utils.warn('No hero data found');
      return;
    }

    await this.heroManager.init(this.pageData.hero);
  }

  /**
   * İçeriği kur
   */
  async setupContent() {
    const container = document.getElementById('mendeley-content');
    if (!container) {
      Utils.error('Mendeley content container not found');
      return;
    }

    this.renderSections(container);
  }

  /**
   * Tüm sections'ları render et
   */
  renderSections(container) {
    if (!this.pageData?.sections) {
      Utils.warn('No sections data found');
      return;
    }

    let html = '';

    this.pageData.sections.forEach(section => {
      html += this.renderSection(section);
    });

    container.innerHTML = html;
  }

  /**
   * Tek bir section'ı render et
   */
  renderSection(section) {
    let html = `
      <div id="${section.id}" class="info-card">
        <div class="card-header ${section.headerClass || ''}">
          ${section.title}
        </div>
        <div class="card-body">
    `;

    // Lead text
    if (section.content.lead) {
      html += `<p class="lead">${Utils.mdToHtml(Utils.getLocalizedText(section.content.lead))}</p>`;
    }

    // Regular text
    if (section.content.text) {
      html += `<p>${Utils.mdToHtml(Utils.getLocalizedText(section.content.text))}</p>`;
    }

    // Features grid
    if (section.content.features) {
      html += this.renderFeatures(section.content.features);
    }

    // Info boxes
    if (section.content.infoBoxes) {
      html += this.renderInfoBoxes(section.content.infoBoxes);
    }

    // Steps
    if (section.content.steps) {
      html += this.renderSteps(section.content.steps);
    }

    // CTA
    if (section.content.cta) {
      html += this.renderCTA(section.content.cta);
    }

    // Warnings
    if (section.content.warnings) {
      html += this.renderWarnings(section.content.warnings);
    }

    // Benefits
    if (section.content.benefits) {
      html += this.renderBenefits(section.content.benefits);
    }

    // Resources
    if (section.content.resources) {
      html += this.renderResources(section.content.resources);
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Features grid render
   */
  renderFeatures(features) {
    let html = '<div class="features-list">';

    features.forEach(feature => {
      html += `
        <div class="feature-item">
          <div class="feature-icon">${feature.icon}</div>
          <div class="feature-title">${feature.title}</div>
          <div class="feature-description">${Utils.mdToHtml(Utils.getLocalizedText(feature.description))}</div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Info boxes render
   */
  renderInfoBoxes(infoBoxes) {
    let html = '';

    infoBoxes.forEach(box => {
      html += `          <div class="info-box">
          <div class="info-title">
            <i class="${box.icon}"></i>
            ${box.title}
          </div>
          <p>${Utils.mdToHtml(Utils.getLocalizedText(box.text))}</p>
        </div>
      `;
    });

    return html;
  }

  /**
   * Steps (Process) render
   */
  renderSteps(steps) {
    let html = '<div class="process-steps">';

    steps.forEach((step, index) => {
      html += `
        <div class="process-step">
          <div class="step-number">${index + 1}</div>            <div class="step-content">
            <div class="step-title">${step.title}</div>
            <p>${Utils.mdToHtml(Utils.getLocalizedText(step.text))}</p>
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * CTA Section render
   */
  renderCTA(cta) {
    let html = `
      <div class="cta-section">
        <h3>${cta.title}</h3>          <p>${Utils.mdToHtml(Utils.getLocalizedText(cta.text))}</p>
        <div class="cta-buttons">
    `;

    cta.buttons.forEach(button => {
      html += `
        <a href="${button.url}" target="_blank" class="btn ${button.class}">
          <i class="${button.icon}"></i>
          ${button.text}
        </a>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Warning boxes render
   */
  renderWarnings(warnings) {
    let html = '';

    warnings.forEach(warning => {
      html += `
        <div class="warning-box">
          <div class="warning-title">
            <i class="${warning.icon}"></i>
            ${warning.title}
          </div>
          <p>${Utils.mdToHtml(Utils.getLocalizedText(warning.text))}</p>
        </div>
      `;
    });

    return html;
  }

  /**
   * Benefits list render
   */
  renderBenefits(benefits) {
    let html = `
      <h5 class="fw-bold mt-4 mb-3">${benefits.title}</h5>
      <ul class="benefits-list">
    `;

    benefits.items.forEach(item => {
      html += `<li>${item}</li>`;
    });

    html += '</ul>';
    return html;
  }

  /**
   * Resources render
   */
  renderResources(resources) {
    let html = '<div class="resource-links">';

    resources.forEach(resource => {
      const disabledClass = resource.disabled ? 'disabled' : '';
      const onclickAttr = resource.alert
        ? `onclick="alert('${resource.alert}'); return false;"`
        : '';

      html += `
        <a href="${resource.url}"
           target="${resource.disabled ? '_self' : '_blank'}"
           class="resource-link ${disabledClass}"
           ${onclickAttr}>
          <div class="resource-icon">
            <i class="${resource.icon}"></i>
          </div>
          <div class="resource-content">
            <h5>${resource.title}</h5>
            <p>${Utils.mdToHtml(Utils.getLocalizedText(resource.description))}</p>
            ${resource.note ? `<small class="text-muted">${Utils.mdToHtml(Utils.getLocalizedText(resource.note))}</small>` : ''}
          </div>
        </a>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Help section'ı kur
   */
  async setupHelpSection() {
    if (!this.pageData?.helpSection) {
      Utils.warn('No help section data found');
      return;
    }

    await this.helpSectionManager.init(this.pageData.helpSection);
  }

  /**
   * Dil değiştiğinde güncelle
   */
  async updateLanguage() {
    Utils.log('Updating Mendeley page language...');

    // Sayfa verilerini yeniden yükle
    await this.loadPageData();

    // Hero'yu güncelle
    await this.setupHeroSection();

    // TOC'yi güncelle
    if (this.pageData.toc && this.pageData.toc.enabled) {
      HybridTOC.updateLanguage();
    }

    // İçeriği güncelle
    await this.setupContent();

    // Help section'ı güncelle
    await this.setupHelpSection();

    Utils.log('Mendeley page language updated');
  }

  /**
   * Sayfa temizleme
   */
  destroy() {
    Utils.log('Destroying MendeleyReferansYonetimAraciPage...');

    // TOC'yi temizle
    if (HybridTOC) {
      HybridTOC.destroy();
    }

    // Container'ları temizle
    const container = document.getElementById('mendeley-content');
    if (container) {
      container.innerHTML = '';
    }

    Utils.log('MendeleyReferansYonetimAraciPage destroyed');
  }
}

export default MendeleyReferansYonetimAraciPage;
