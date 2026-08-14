/**
 * Anadolu Üniversitesi Kütüphane - Araştırmacı Profili Oluşturma Sayfası
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import HybridTOC from '../components/hybrid-toc.js';

export class ArastirmaciProfiliOlusturmaPage {
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
    Utils.log('ArastirmaciProfiliOlusturmaPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();

    // TOC'yi başlat (hero sonrasında, content öncesinde)
    if (this.pageData.toc && this.pageData.toc.enabled) {
      HybridTOC.init(this.pageData.toc);
      Utils.log('HybridTOC initialized for researcher profile page');
    }

    await this.setupContent();
    await this.setupHelpSection();

    Utils.log('ArastirmaciProfiliOlusturmaPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/arastirmaci-profili-olusturma.json');
      if (response.ok) {
        this.pageData = await response.json();

        // Veriyi global olarak sakla
        window.researcherProfileData = this.pageData;

        Utils.log('Researcher profile data loaded successfully');
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
        title: 'Araştırmacı Profili Oluşturma',
        description: 'Araştırmacı profilleri hakkında bilgi edinin.',
        icon: 'bi bi-person-badge'
      },
      benefits: {},
      basicSteps: {},
      tips: {},
      comparison: {},
      platforms: {},
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
    const container = document.getElementById('researcher-profile-content');

    if (!container) {
      console.warn('Researcher profile content container not found');
      return;
    }

    this.renderMainContent(this.pageData);
    this.initCardAnimations();
    this.initStepToggles();
  }

  // Ana içeriği render et
  renderMainContent(data) {
    const container = document.getElementById('researcher-profile-content');
    if (!container) {
      console.error('Researcher profile content container bulunamadı!');
      return;
    }

    let html = '';

    // Benefits
    html += this.renderBenefits(data.benefits);

    // Basic Steps
    html += this.renderBasicSteps(data.basicSteps);

    // Tips
    html += this.renderTips(data.tips);

    // Comparison Table
    html += this.renderComparisonTable(data.comparison);

    // Platform Sections
    html += this.renderPlatformSections(data.platforms);

    // Contact
    html += this.renderContact(data.contact);

    container.innerHTML = html;
  }

  // Faydaları render et
  renderBenefits(benefits) {
    let html = `
      <div id="${benefits.id}" class="info-card">
        <div class="card-header">
          ${benefits.title}
        </div>
        <div class="card-body">
          <div class="benefits-list">
    `;

    benefits.content.forEach(item => {
      html += `
        <div class="benefit-item">
          <div class="benefit-number">${item.number}</div>
          <div class="benefit-content">
            <div class="benefit-title">${item.title}</div>
            <div class="benefit-description">${Utils.mdToHtml(Utils.getLocalizedText(item.description))}</div>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  }

  // Temel adımları render et
  renderBasicSteps(basicSteps) {
    let html = `
      <div id="${basicSteps.id}" class="info-card">
        <div class="card-header">
          ${basicSteps.title}
        </div>
        <div class="card-body">
          <p>${basicSteps.intro}</p>
          <div class="basic-steps-list">
    `;

    basicSteps.platforms.forEach(platform => {
      html += `
        <div class="basic-step-card">
          <h4>${platform.title}</h4>
          <ol>
      `;
      platform.steps.forEach(step => {
        html += `<li>${step}</li>`;
      });
      html += `
          </ol>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  }

  // İpuçlarını render et
  renderTips(tips) {
    let html = `
      <div id="${tips.id}" class="info-card">
        <div class="card-header">
          ${tips.title}
        </div>
        <div class="card-body">
    `;

    tips.items.forEach(item => {
      html += `
        <div class="tip-item">
          <i class="${item.icon}"></i>
          <strong>${item.title}:</strong> ${Utils.mdToHtml(Utils.getLocalizedText(item.text))}
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // Karşılaştırma tablosunu render et
  renderComparisonTable(comparison) {
    let html = `
      <div id="${comparison.id}" class="info-card">
        <div class="card-header">
          ${comparison.title}
        </div>
        <div class="card-body">
          <table class="comparison-table">
            <thead>
              <tr>
    `;

    comparison.table.headers.forEach(header => {
      html += `<th>${header}</th>`;
    });

    html += `
              </tr>
            </thead>
            <tbody>
    `;

    comparison.table.rows.forEach(row => {
      html += `<tr>`;
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += `</tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    return html;
  }

  // Platform bölümlerini render et
  renderPlatformSections(platforms) {
    let html = '';

    // Render ORCID sections
    platforms.orcid.forEach(section => {
      html += this.renderPlatformSection(section);
    });

    // Render WoS sections
    platforms.wos.forEach(section => {
      html += this.renderPlatformSection(section);
    });

    // Render Scopus sections
    platforms.scopus.forEach(section => {
      html += this.renderPlatformSection(section);
    });

    // Render Google Scholar sections
    platforms.googleScholar.forEach(section => {
      html += this.renderPlatformSection(section);
    });

    return html;
  }

  // Platform bölümünü render et
  renderPlatformSection(section) {
    let html = `
      <div id="${section.id}" class="platform-section ${section.platformClass} ${section.hasDivider ? 'has-divider' : ''}">
        <div class="platform-header">
          <div>
            <h2>${section.title}</h2>
            ${section.subtitle ? `<p>${section.subtitle}</p>` : ''}
          </div>
        </div>
        <div class="platform-content">
    `;

    // Content
    if (section.content) {
      html += Utils.mdToHtml(Utils.getLocalizedText(section.content));
    }

    // Info Boxes
    if (section.infoBoxes) {
      section.infoBoxes.forEach(box => {
        html += `
          <div class="info-box">
            <div class="info-title">
              <i class="${box.icon}"></i>
              ${box.title}
            </div>
            <p>${Utils.mdToHtml(Utils.getLocalizedText(box.text))}</p>
          </div>
        `;
      });
    }

    // Warnings
    if (section.warnings) {
      section.warnings.forEach(warning => {
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
    }

    // Benefits
    if (section.benefits) {
      html += '<div class="benefits-list">';
      section.benefits.forEach(benefit => {
        html += `
          <div class="benefit-item">
            <div class="benefit-number">${benefit.number}</div>
            <div class="benefit-content">
              <div class="benefit-title">${benefit.title}</div>
              <div class="benefit-description">${Utils.mdToHtml(Utils.getLocalizedText(benefit.description))}</div>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    // Steps
    if (section.steps) {
      section.steps.forEach(step => {
        html += `
          <div class="step-card">
            <div class="step-header">
              <div class="step-number">${step.number}</div>
              <span>${step.title}</span>
              <i class="fas fa-chevron-down ms-auto"></i>
            </div>
            <div class="step-content">
              ${Utils.mdToHtml(Utils.getLocalizedText(step.content))}
        `;

        // Info Boxes in steps
        if (step.infoBoxes) {
          step.infoBoxes.forEach(box => {
            html += `
              <div class="info-box">
                <div class="info-title">
                  <i class="${box.icon}"></i>
                  ${box.title}
                </div>
                <p>${Utils.mdToHtml(Utils.getLocalizedText(box.text))}</p>
              </div>
            `;
          });
        }

        // Warnings in steps
        if (step.warnings) {
          step.warnings.forEach(warning => {
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
        }

        html += `
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // İletişim bölümünü render et
  renderContact(contact) {
    let html = `
      <div id="${contact.id}" class="contact-section">
        <h4>${contact.title}</h4>
        <p>${Utils.mdToHtml(Utils.getLocalizedText(contact.description))}</p>
        <div class="contact-info">
    `;

    contact.items.forEach(item => {
      html += `
        <a href="${item.url}" class="contact-item">
          <i class="${item.icon}"></i>
          <div>
            <strong>${item.name}</strong><br>
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

  // Adım geçişlerini başlat
  initStepToggles() {
    // Step card toggle functionality
    document.querySelectorAll('.step-header').forEach(header => {
      header.addEventListener('click', function() {
        const stepContent = this.nextElementSibling;
        const icon = this.querySelector('.fa-chevron-down');

        stepContent.classList.toggle('show');

        if (stepContent.classList.contains('show')) {
          icon.style.transform = 'rotate(180deg)';
        } else {
          icon.style.transform = 'rotate(0deg)';
        }
      });
    });
  }

  // Card animasyonlarını başlat
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

    // Tüm platform card'ları ve info card'ları gözlemle
    document.querySelectorAll('.platform-section, .info-card').forEach(card => {
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

export default ArastirmaciProfiliOlusturmaPage;
