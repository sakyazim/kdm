/**
 * Anadolu Üniversitesi Kütüphane - Kime Sormalıyım Sayfası
 * Departman ve iletişim bilgileri yönetimi
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { SearchFilterManager } from '../components/search-filter-manager.js';

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

      // Departmanları render et
      if (this.pageData.departments) {
        this.renderDepartments(this.pageData.departments);
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
   * Departmanları render et
   */
  renderDepartments(departments) {
    const container = document.getElementById('departments-container');
    if (!container) return;

    // Labels'ları al
    const labels = this.pageData.labels || {};
    const topicsTitle = Utils.getLocalizedText(labels.topicsTitle || { tr: 'Bu Birimden Yardım Alabileceğiniz Konular', en: 'Topics You Can Get Help With' });
    const contactTitle = Utils.getLocalizedText(labels.contactTitle || { tr: 'İletişim Bilgileri', en: 'Contact Information' });

    departments.forEach(dept => {
      const card = document.createElement('section');
      card.className = 'section-card';
      card.setAttribute('data-department', dept.id);

      // Çoklu dil desteği
      const deptTitle = Utils.getLocalizedText(dept.title);
      const deptSubtitle = Utils.getLocalizedText(dept.subtitle);

      // Topics HTML
      const topicsHTML = dept.topics.map(topic => {
        const localizedTopic = Utils.getLocalizedText(topic);
        return `
          <div class="topic-item">
            <i class="fas fa-chevron-right topic-bullet"></i>
            <span>${localizedTopic}</span>
          </div>
        `;
      }).join('');

      // Contacts HTML
      const contactsHTML = dept.contacts.map(contact => `
        <a href="${contact.link}" class="contact-item btn-contact">
          <i class="${contact.icon}"></i>
          ${contact.text}
        </a>
      `).join('');

      card.innerHTML = `
        <div class="component-heading double-icon">
          <i class="${dept.icon} heading-icon"></i>
          <div class="heading-text">
            <h3>${deptTitle}</h3>
            <p>${deptSubtitle}</p>
          </div>
        </div>
        <div class="section-card-body">
          <div class="topics-section">
            <div class="topics-title">
              <i class="fas fa-list-ul"></i>
              ${topicsTitle}
            </div>
            <div class="topics-list variant-kime-sormaliyim">
              ${topicsHTML}
            </div>
          </div>
          <div class="contact-section">
            <div class="contact-title">${contactTitle}</div>
            <div class="contact-info">
              ${contactsHTML}
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

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
   * Departmanları filtrele
   */
  filterDepartments(searchTerm, cards, noResults) {
    let visibleCount = 0;

    cards.forEach(card => {
      const headerText = card.querySelector('.header-text')?.textContent.toLowerCase() || '';
      const topicsText = card.querySelector('.topics-list')?.textContent.toLowerCase() || '';

      if (searchTerm === '' || headerText.includes(searchTerm) || topicsText.includes(searchTerm)) {
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
