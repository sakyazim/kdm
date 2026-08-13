/**
 * Anadolu Üniversitesi Kütüphane - FAQ Page
 * SSS sayfası özel mantık ve bileşenler
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';

export class FAQPage {
  constructor(app) {
    this.app = app;
    this.data = app.data;
    this.config = app.config;
    this.pageData = null;

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();

    // State
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.allQuestions = [];
    this.filteredQuestions = [];
  }

  /**
   * SSS sayfasını başlat
   */
  async init() {
    Utils.log('FAQPage initializing...');

    // Sayfa verilerini yükle
    await this.loadPageData();

    // Hero ve Help Section'ı yükle
    await this.setupHeroSection();
    await this.setupHelpSection();

    // FAQ bileşenlerini kur
    this.setupSearchSection();
    this.setupFilterSection();
    this.setupFAQContent();

    // Event listeners
    this.attachEventListeners();

    Utils.log('FAQPage initialized');
  }

  /**
   * Sayfa verilerini yükle
   */
  async loadPageData() {
    this.pageData = await this.app.loadPageData('sss');
    if (!this.pageData) {
      console.warn('FAQ page data not found, using defaults');
      this.pageData = this.getDefaultData();
    }
    
    // Tüm soruları flat array'e çevir
    this.allQuestions = this.flattenQuestions();
    this.filteredQuestions = [...this.allQuestions];
  }

  /**
   * Tüm soruları düz array'e çevir
   */
  flattenQuestions() {
    const questions = [];

    // faqData array'ini kullan
    if (this.pageData.faqData && Array.isArray(this.pageData.faqData)) {
      this.pageData.faqData.forEach(faq => {
        // İlgili kategoriyi bul
        const category = this.pageData.categories?.find(cat => cat.id === faq.category);

        questions.push({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          categoryTitle: category?.name || faq.category,
          categoryIcon: category?.icon || 'fas fa-question-circle',
          categoryColor: category?.color || '#6366f1'
        });
      });
    }

    return questions;
  }

  /**
   * Hero section kurulumu
   */
  async setupHeroSection() {
    if (!this.pageData.hero) {
      console.warn('Hero data not found in FAQ page data');
      return;
    }

    await this.heroManager.init(this.pageData.hero);
  }

  /**
   * Arama bölümü kurulumu
   */
  setupSearchSection() {
    // Mevcut HTML'deki input zaten var, sadece placeholder'ı güncelle
    const searchInput = document.getElementById('faqSearch');
    if (searchInput && this.pageData.searchPlaceholder) {
      searchInput.placeholder = this.pageData.searchPlaceholder;
    }
  }

  /**
   * Filtre bölümü kurulumu
   */
  setupFilterSection() {
    const filterSection = document.querySelector('.category-filters');
    if (!filterSection || !this.pageData.categories) return;

    const filterButtons = `
      <button class="category-btn active" data-category="all">Tümü</button>
      ${this.pageData.categories.map(cat => `
        <button class="category-btn" data-category="${cat.id}">
          <i class="${cat.icon}"></i> ${cat.name}
        </button>
      `).join('')}
    `;

    filterSection.innerHTML = filterButtons;
  }

  /**
   * FAQ içeriği kurulumu
   */
  setupFAQContent() {
    const container = document.querySelector('.faq-container');
    if (!container) {
      console.warn('FAQ container not found');
      return;
    }

    this.renderFAQs();
  }

  /**
   * FAQ'ları render et
   */
  renderFAQs() {
    const container = document.querySelector('.faq-container');
    const noResults = document.getElementById('noResults');

    if (!container) {
      console.warn('FAQ container (.faq-container) not found');
      return;
    }

    // Filtrelenmiş soruları kategorilere göre grupla
    const groupedQuestions = this.groupByCategory(this.filteredQuestions);

    if (Object.keys(groupedQuestions).length === 0) {
      container.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    if (noResults) noResults.style.display = 'none';

    let html = '';
    Object.entries(groupedQuestions).forEach(([categoryId, questions]) => {
      const category = this.pageData.categories?.find(c => c.id === categoryId);

      html += `
        <div class="faq-category mb-4" data-category="${categoryId}">
          ${category ? `
            <div class="category-header mb-3">
              <i class="${category.icon}"></i>
              <h3>${category.name}</h3>
            </div>
          ` : ''}

          <div class="accordion" id="accordion-${categoryId}">
            ${questions.map((q, index) => {
              const qId = `faq-${categoryId}-${index}`;
              return `
                <div class="accordion-item faq-item">
                  <h2 class="accordion-header">
                    <button class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#${qId}"
                            aria-expanded="false">
                      ${q.question}
                    </button>
                  </h2>
                  <div id="${qId}"
                       class="accordion-collapse collapse"
                       data-bs-parent="#faq-all-accordions">
                    <div class="accordion-body">
                      ${q.answer}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Tüm akordiyonları tek parent altında toplamak için event listener ekle
    this.setupAccordionBehavior();
  }

  /**
   * Soruları kategoriye göre grupla
   */
  groupByCategory(questions) {
    const grouped = {};
    questions.forEach(q => {
      if (!grouped[q.category]) {
        grouped[q.category] = [];
      }
      grouped[q.category].push(q);
    });
    return grouped;
  }

  /**
   * Akordiyon davranışını ayarla - Sadece bir akordiyon açık kalsın
   */
  setupAccordionBehavior() {
    const allAccordionButtons = document.querySelectorAll('.accordion-button');

    allAccordionButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Tıklanan butona ait collapse elementini al
        const targetId = button.getAttribute('data-bs-target');
        const targetCollapse = document.querySelector(targetId);

        // Tüm açık akordiyonları kapat (tıklanan hariç)
        document.querySelectorAll('.accordion-collapse.show').forEach(openCollapse => {
          if (openCollapse !== targetCollapse) {
            const bsCollapse = bootstrap.Collapse.getInstance(openCollapse);
            if (bsCollapse) {
              bsCollapse.hide();
            }
          }
        });
      });
    });
  }

  /**
   * Event listener'ları ekle
   */
  attachEventListeners() {
    // Arama - mevcut HTML'deki ID'yi kullan
    const searchInput = document.getElementById('faqSearch');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    // Kategori filtreleri - mevcut HTML'deki class'ı kullan
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.category-btn').forEach(b =>
          b.classList.remove('active')
        );
        e.currentTarget.classList.add('active');

        this.currentCategory = e.currentTarget.dataset.category;
        this.applyFilters();
      });
    });
  }

  /**
   * Filtreleri uygula
   */
  applyFilters() {
    this.filteredQuestions = this.allQuestions.filter(q => {
      const matchesCategory = this.currentCategory === 'all' || q.category === this.currentCategory;
      const matchesSearch = !this.searchQuery || 
                           q.question.toLowerCase().includes(this.searchQuery) ||
                           q.answer.toLowerCase().includes(this.searchQuery);
      return matchesCategory && matchesSearch;
    });

    // Sonuç sayısını güncelle
    const countEl = document.getElementById('search-result-count');
    if (countEl && this.searchQuery) {
      countEl.textContent = `${this.filteredQuestions.length} sonuç bulundu`;
    } else if (countEl) {
      countEl.textContent = '';
    }

    this.renderFAQs();
  }

  /**
   * Help section kurulumu
   */
  async setupHelpSection() {
    if (!this.pageData.helpSection) {
      console.warn('Help section data not found in FAQ page data');
      return;
    }

    // HelpSection için uygun format oluştur
    const helpData = {
      title: this.pageData.helpSection.title || 'İhtiyacınız olan desteği alın',
      description: this.pageData.helpSection.description || '',
      cards: this.pageData.helpSection.buttons?.map(btn => ({
        icon: btn.icon || 'bi bi-info-circle',
        title: btn.text || 'Bilgi',
        link: btn.link || '#',
        linkText: btn.text || 'Detaylı Bilgi'
      })) || []
    };

    await this.helpSectionManager.init(helpData);
  }

  /**
   * Varsayılan veri
   */
  getDefaultData() {
    return {
      hero: {
        title: 'Sıkça Sorulan Sorular',
        description: 'Kütüphane hizmetleri hakkında sık sorulan sorular ve cevapları'
      },
      searchSection: {
        placeholder: 'Sorunuzu arayın...'
      },
      categories: []
    };
  }
}

export default FAQPage;
