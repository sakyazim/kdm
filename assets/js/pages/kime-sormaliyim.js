/**
 * Anadolu Üniversitesi Kütüphane - Kime Sormalıyım Sayfası
 * Departman ve iletişim bilgileri yönetimi
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { SearchFilterManager } from '../components/search-filter-manager.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class KimeSormaliyimPage {
  constructor(app) {
    this.app = app;
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
    this.searchFilterManager = null; // Render'dan sonra init edilecek
    this.pageData = null;
  }

  /**
   * Sayfayı başlat
   */
  async init() {
    Utils.log('KimeSormaliyimPage initializing...');

    // Sayfa verisini yükle
    this.pageData = await this.app.loadPageData('kime-sormaliyim');

    if (this.pageData) {
      // Hero section'ı render et
      if (this.pageData.hero) {
        await this.heroManager.init(this.pageData.hero);
      }

      // Search section'ı render et (no results dahil)
      if (this.pageData.searchSection) {
        this.renderSearchSection(this.pageData.searchSection);
      }

      // İçerik bölümlerini render et (bileşen tabanlı)
      if (this.pageData.content) {
        this.renderContent(this.pageData.content);
      }

      // Help section'ı render et
      if (this.pageData.helpSection) {
        await this.helpSectionManager.init(this.pageData.helpSection);
      }

      // Search Filter Manager'ı başlat (sticky için)
      this.searchFilterManager = new SearchFilterManager('.search-section');
    }

    Utils.log('KimeSormaliyimPage initialized');
  }

  /**
   * Search section'ı render et
   */
  renderSearchSection(searchData) {
    const container = document.getElementById('search-container');
    if (!container) return;

    // No results mesajını da buraya dahil et (SSS gibi)
    const noResultsData = this.pageData.noResults;

    // Çoklu dil desteği
    const placeholder = Utils.getLocalizedText(searchData.placeholder);
    const noResultsTitle = Utils.getLocalizedText(noResultsData.title);
    const noResultsDesc = Utils.getLocalizedText(noResultsData.description);

    container.innerHTML = `
      <div class="search-section">
        <div class="search-wrapper">
          <div class="search-input-group">
            <i class="${searchData.icon} search-icon"></i>
            <input type="text" id="departmentSearch" class="search-input" placeholder="${placeholder}">
            <button type="button" id="clear-search" class="clear-search-btn" style="display:none;">
              <i class="${searchData.clearButtonIcon}"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="no-results" id="noResults" style="display: none;">
        <i class="${noResultsData.icon}"></i>
        <div class="no-results-content">
          <h4>${noResultsTitle}</h4>
          <p>${noResultsDesc}</p>
        </div>
      </div>
    `;
  }

  /**
   * İçerik bölümlerini render et — ortak bileşen sistemiyle (ComponentRenderer)
   */
  renderContent(contentSections) {
    const container = document.getElementById('departments-container');
    if (!container) return;

    container.innerHTML = ComponentRenderer.buildSectionCards(contentSections);

    // Arama işlevini başlat
    this.initializeSearch();
  }

  /**
   * Arama işlevini başlat
   */
  initializeSearch() {
    const searchInput = document.getElementById('departmentSearch');
    const clearSearchBtn = document.getElementById('clear-search');
    const departmentCards = document.querySelectorAll('.section-card');
    const noResults = document.getElementById('noResults');

    if (!searchInput || !clearSearchBtn || !noResults) return;

    // Temizle butonunu göster/gizle
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';
      this.filterDepartments(searchTerm, departmentCards, noResults);
    });

    // Aramayı temizle
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      this.filterDepartments('', departmentCards, noResults);
      searchInput.focus();
    });
  }

  /**
   * Bölüm kartlarını filtrele — başlık, konular ve iletişim metni aranır
   */
  filterDepartments(searchTerm, cards, noResults) {
    let visibleCount = 0;

    cards.forEach(card => {
      const cardText = card.textContent.toLowerCase();

      if (searchTerm === '' || cardText.includes(searchTerm)) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Sonuç bulunamadı mesajını göster/gizle
    noResults.style.display = visibleCount === 0 ? 'flex' : 'none';
  }
}
