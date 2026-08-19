/**
 * Anadolu Üniversitesi Kütüphane - S.S.S. (Sıkça Sorulan Sorular) Sayfası
 * JSON-Based Content System ile yeniden yazıldı
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';
import { SearchFilterManager } from '../components/search-filter-manager.js';

export class SSSPage {
  constructor(app) {
    this.app = app;
    this.data = app.data;
    this.config = app.config;
    this.pageData = null;
    this.activeCategory = 'all';

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
    this.searchFilterManager = null; // Render'dan sonra init edilecek
  }

  async init() {
    Utils.log('SSSPage initializing...');

    await this.loadPageData();
    await this.setupHeroSection();
    await this.setupContent();
    await this.setupHelpSection();

    // Search Filter Manager'ı başlat (sticky için)
    this.searchFilterManager = new SearchFilterManager('.search-section');

    this.initializeSingleAccordionBehavior();

    Utils.log('SSSPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/sss.json');
      if (response.ok) {
        this.pageData = await response.json();

        // Veriyi global olarak sakla
        window.sssData = this.pageData;

        Utils.log('SSS data loaded successfully');
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
        title: 'S.S.S. - Sıkça Sorulan Sorular',
        description: 'Kütüphane hizmetleri hakkında bilgi edinin.',
        icon: 'bi bi-question-circle'
      },
      content: [],
      help: {
        title: 'Aradığınız soruyu bulamadınız mı?',
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
        const isSearchSection = section.id === 'search-section';

        // Search section özel durum - heading yok, direkt componentleri render et
        if (isSearchSection) {
          // Search data'yı pageData.search'den al
          const searchData = this.pageData.search;
          if (searchData) {
            this.renderSearchComponent(searchData, `${section.id}-components`);
          }
          return;
        }

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
            if (component.type === 'accordion') {
              this.renderAccordionComponent(component.data, `${section.id}-body`);
            } else {
              ComponentRenderer.appendTo(`${section.id}-body`, component);
            }
          });
        }
      }
    });

    // Search ve filtreleme işlevlerini başlat
    this.initializeSearch();
    this.initializeCategoryFilters();

    Utils.log(`${contentSections.length} sections rendered with card wrappers`);
  }

  /**
   * Search component'i render et
   */
  renderSearchComponent(searchData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Kategori butonlarını oluştur - ikonlarla birlikte
    const categoriesHTML = searchData.categories.map(cat => `
      <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
        ${cat.icon ? `<i class="${cat.icon}"></i>` : ''}
        ${Utils.getLocalizedText(cat.label)}
      </button>
    `).join('');

    const placeholder = Utils.getLocalizedText(searchData.placeholder);
    const noResultsTitle = Utils.getLocalizedText(searchData.noResults.title);
    const noResultsDesc = Utils.getLocalizedText(searchData.noResults.description);

    const searchHTML = `
      <div class="search-section">
        <div class="search-wrapper">
          <div class="search-input-group">
            <i class="${searchData.icon} search-icon"></i>
            <input type="text" id="faqSearch" class="search-input" placeholder="${placeholder}">
            <button type="button" id="clear-search" class="clear-search-btn" style="display:none;">
              <i class="${searchData.clearButtonIcon}"></i>
            </button>
          </div>
        </div>
        <div class="category-filters">
          ${categoriesHTML}
        </div>
      </div>
      <div class="no-results" id="noResults" style="display: none;">
        <i class="fas fa-search"></i>
        <div class="no-results-content">
          <h4>${noResultsTitle}</h4>
          <p>${noResultsDesc}</p>
        </div>
      </div>
    `;

    container.innerHTML = searchHTML;
  }

  /**
   * Accordion component'i render et
   */
  renderAccordionComponent(accordionData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const accordionHTML = `
      <div class="accordion accordion-flush" id="accordion-${accordionData.parentId}">
        ${accordionData.items.map(item => {
          const question = Utils.getLocalizedText(item.question);
          // answer artık blok dizisi (ComponentRenderer formatı) veya markdown string olabilir
          const answerRaw = Utils.getLocalizedText(item.answer);
          const answer = Array.isArray(answerRaw)
            ? ComponentRenderer.renderMultiple(answerRaw)
            : Utils.mdToHtml(answerRaw);

          return `
            <div class="accordion-item" data-faq-id="${item.id}" data-category="${accordionData.parentId.replace('faq-', '')}">
              <h2 class="accordion-header" id="heading-${item.id}">
                <button class="accordion-button collapsed" type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse-${item.id}"
                        aria-expanded="false"
                        aria-controls="collapse-${item.id}">
                  ${question}
                </button>
              </h2>
              <div id="collapse-${item.id}"
                   class="accordion-collapse collapse"
                   aria-labelledby="heading-${item.id}"
                   data-bs-parent="#accordion-${accordionData.parentId}">
                <div class="accordion-body">
                  ${answer}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', accordionHTML);
  }

  /**
   * Arama işlevini başlat
   */
  initializeSearch() {
    const searchInput = document.getElementById('faqSearch');
    const clearSearchBtn = document.getElementById('clear-search');
    const noResults = document.getElementById('noResults');

    if (!searchInput || !clearSearchBtn || !noResults) return;

    // Temizle butonunu göster/gizle
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';
      this.filterFAQs(searchTerm, this.activeCategory);
    });

    // Aramayı temizle
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      this.filterFAQs('', this.activeCategory);
      searchInput.focus();
    });
  }

  /**
   * Kategori filtreleme butonlarını başlat
   */
  initializeCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');

    categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Aktif buton stilini güncelle
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Kategoriyi kaydet
        this.activeCategory = btn.dataset.category;

        // Filtrelemeyi uygula
        const searchInput = document.getElementById('faqSearch');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        this.filterFAQs(searchTerm, this.activeCategory);
      });
    });
  }

  /**
   * FAQ'ları filtrele
   */
  filterFAQs(searchTerm, category) {
    const allItems = document.querySelectorAll('.accordion-item');
    const noResults = document.getElementById('noResults');
    const sections = document.querySelectorAll('.section-card');
    let visibleCount = 0;

    // Her item'ı kontrol et
    allItems.forEach(item => {
      const itemCategory = item.dataset.category;
      const questionText = item.querySelector('.accordion-button')?.textContent.toLowerCase() || '';
      const answerText = item.querySelector('.accordion-body')?.textContent.toLowerCase() || '';

      // Kategori filtresi
      const categoryMatch = category === 'all' || itemCategory === category;

      // Arama filtresi
      const searchMatch = searchTerm === '' || questionText.includes(searchTerm) || answerText.includes(searchTerm);

      if (categoryMatch && searchMatch) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    // Section visibility kontrolü
    sections.forEach(section => {
      if (section.id === 'search-section') return;

      const visibleItems = section.querySelectorAll('.accordion-item[style="display: block;"]');
      if (visibleItems.length > 0) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });

    // Sonuç bulunamadı mesajını göster/gizle
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
  }

  /**
   * Tek akordeon açık kalma mantığını implement et
   * Herhangi bir akordeon açıldığında diğer tüm akordeoonlar kapanır
   */
  initializeSingleAccordionBehavior() {
    const allAccordionButtons = document.querySelectorAll('.accordion-button');

    allAccordionButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Bu butona tıklandığında, diğer tüm açık akordeoonları kapat
        const allCollapses = document.querySelectorAll('.accordion-collapse.show');

        allCollapses.forEach(collapse => {
          // Tıklanan butonun hedefi değilse kapat
          const targetId = button.getAttribute('data-bs-target');
          if (`#${collapse.id}` !== targetId) {
            const bsCollapse = bootstrap.Collapse.getInstance(collapse);
            if (bsCollapse) {
              bsCollapse.hide();
            }
          }
        });
      });
    });
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
