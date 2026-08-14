/**
 * Anadolu Üniversitesi Kütüphane - Güncel Haberler Sayfası
 * JSON-Based Content System ile globalleştirildi
 * Arama, filtreleme, görünüm değiştirme ve modal özellikleri ile
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';
import { SearchFilterManager } from '../components/search-filter-manager.js';

export class GuncelHaberlerPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.newsData = [];
    this.filteredNews = [];
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.currentView = 'list'; // 'grid' or 'list' - Default: list
    this.sortOrder = 'desc'; // 'desc' (yeni->eski) or 'asc' (eski->yeni)

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
    this.searchFilterManager = null; // Render'dan sonra init edilecek
  }

  async init() {
    Utils.log('GuncelHaberlerPage initializing...');

    await this.loadPageData();
    await this.loadNewsData();
    await this.setupHeroSection();
    await this.setupContent();
    await this.setupHelpSection();

    // Search Filter Manager'ı başlat (sticky için)
    this.searchFilterManager = new SearchFilterManager('.search-section');

    this.setupEventListeners();
    this.createModalContainer();
    this.createLightboxContainer();

    // URL'den ID parametresi varsa otomatik modal aç
    this.checkUrlParams();

    Utils.log('GuncelHaberlerPage initialized');
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/guncel-haberler.json');
      if (response.ok) {
        this.pageData = await response.json();
        Utils.log('Güncel Haberler page data loaded successfully');
      } else {
        console.warn('Failed to load Güncel Haberler page data');
        this.loadFallbackPageData();
      }
    } catch (error) {
      console.error('Error loading Güncel Haberler page data:', error);
      this.loadFallbackPageData();
    }
  }

  async loadNewsData() {
    // Haber verileri pageData içinde newsItems olarak geliyor
    if (this.pageData && this.pageData.newsItems) {
      this.newsData = this.pageData.newsItems;
      this.filteredNews = [...this.newsData];
      Utils.log('News data loaded successfully:', this.newsData.length, 'items');
    } else {
      console.warn('Failed to load news data from pageData');
      this.newsData = [];
      this.filteredNews = [];
    }
  }

  loadFallbackPageData() {
    this.pageData = {
      hero: {
        title: 'Güncel Haberler',
        description: 'Kütüphanemizden haberler, duyurular ve etkinlikler',
        icon: 'bi bi-newspaper'
      },
      content: [],
      helpSection: {
        title: 'Yardıma mı ihtiyacınız var?',
        description: 'Haberler hakkında daha fazla bilgi için iletişime geçin.',
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
    const container = document.querySelector('.content-wrapper');

    if (!container) {
      console.warn('Content wrapper not found');
      return;
    }

    // JSON'dan içeriği render et
    this.renderContent(this.pageData.content);

    // Haberleri render et
    this.renderNews();
  }

  /**
   * JSON'dan içeriği render et
   */
  renderContent(contentSections) {
    const container = document.querySelector('.content-wrapper');
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
        const isSearchSection = section.id === 'search-filter-section';

        // Search section özel durum - heading yok, direkt componentleri render et
        if (isSearchSection) {
          section.components.forEach(component => {
            if (component.type === 'search-with-controls') {
              this.renderSearchWithControls(component.data, `${section.id}-components`);
            }
          });
          return;
        }

        // Heading varsa direkt render et
        if (hasHeading) {
          ComponentRenderer.appendTo(`${section.id}-components`, firstComponent);
        }

        // Geri kalan componentleri section-card-body içine al
        if (section.components.length > 1 || !hasHeading) {
          const bodyContainer = document.createElement('div');
          bodyContainer.className = 'section-card-body';
          bodyContainer.id = `${section.id}-body`;
          sectionContainer.appendChild(bodyContainer);

          // Heading'den sonraki componentleri body'ye render et
          const remainingComponents = hasHeading ? section.components.slice(1) : section.components;
          remainingComponents.forEach(component => {
            ComponentRenderer.appendTo(`${section.id}-body`, component);
          });
        }
      }
    });

    Utils.log(`${contentSections.length} sections rendered with global component system`);
  }

  /**
   * Search with controls component'i render et (sss.html'deki arama kutusu gibi)
   */
  renderSearchWithControls(searchData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Kategori butonlarını oluştur - ikonlarla birlikte (çoklu dil desteği ile)
    const categoriesHTML = searchData.categories.map(cat => `
      <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
        ${cat.icon ? `<i class="${cat.icon}"></i>` : ''}
        ${Utils.getLocalizedText(cat.label)}
      </button>
    `).join('');

    // Sıralama butonu HTML (çoklu dil)
    const sortTextDesc = Utils.getLocalizedText(searchData.controls.sort.text.desc);
    const sortControl = searchData.controls.sort.enabled ? `
      <button class="control-btn" id="sort-btn" title="Sıralama">
        <i class="${searchData.controls.sort.icon.desc}"></i>
        <span class="sort-text">${sortTextDesc}</span>
      </button>
    ` : '';

    // Görünüm toggle butonları HTML (çoklu dil)
    const viewToggleHTML = searchData.controls.viewToggle.enabled ? `
      <div class="view-toggle-group">
        ${searchData.controls.viewToggle.options.map(option => `
          <button class="view-toggle-btn ${option.id === searchData.controls.viewToggle.defaultView ? 'active' : ''}"
                  data-view="${option.id}"
                  title="${Utils.getLocalizedText(option.label)}">
            <i class="${option.icon}"></i>
          </button>
        `).join('')}
      </div>
    ` : '';

    // Placeholder çoklu dil
    const placeholder = Utils.getLocalizedText(searchData.placeholder);

    // No results mesajları çoklu dil
    const noResultsTitle = Utils.getLocalizedText(searchData.noResults.title);
    const noResultsDesc = Utils.getLocalizedText(searchData.noResults.description);

    const searchHTML = `
      <div class="search-section">
        <div class="search-and-controls">
          <div class="search-wrapper">
            <div class="search-input-group">
              <i class="${searchData.icon} search-icon"></i>
              <input type="text" id="news-search" class="search-input" placeholder="${placeholder}">
              <button type="button" id="clear-search" class="clear-search-btn" style="display:none;">
                <i class="${searchData.clearButtonIcon}"></i>
              </button>
            </div>
          </div>
          ${sortControl}
          ${viewToggleHTML}
        </div>
        <div class="category-filters">
          ${categoriesHTML}
        </div>
      </div>
      <div id="news-grid" class="news-grid list-view"></div>
      <div class="no-results" id="no-results" style="display: none;">
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
   * Kategori filtre butonlarını oluştur
   */
  renderFilterButtons() {
    const filterContainer = document.getElementById('news-filters');
    if (!filterContainer) {
      console.warn('Filter container not found');
      return;
    }

    // Benzersiz kategorileri al
    const categories = ['all', ...new Set(this.newsData.map(news => news.category))];

    const categoryIcons = {
      'all': 'bi bi-grid-3x3-gap',
      'Veritabanları': 'bi bi-database',
      'Duyuru': 'bi bi-megaphone',
      'Eğitim': 'bi bi-mortarboard',
      'Etkinlik': 'bi bi-calendar-event'
    };

    const categoryLabels = {
      'all': 'Tümü'
    };

    let html = '';
    categories.forEach(category => {
      const icon = categoryIcons[category] || 'bi bi-tag';
      const label = categoryLabels[category] || category;
      const activeClass = category === this.currentCategory ? 'active' : '';

      html += `
        <button class="news-filter-btn ${activeClass}" data-category="${category}">
          <i class="${icon}"></i>
          ${label}
        </button>
      `;
    });

    filterContainer.innerHTML = html;
  }

  /**
   * Haberleri grid/list'de render et
   */
  renderNews() {
    const newsGrid = document.getElementById('news-grid');
    const noResults = document.getElementById('no-results');

    if (!newsGrid) {
      console.warn('News grid not found');
      return;
    }

    // Görünüm class'ı ekle
    newsGrid.className = `news-grid ${this.currentView === 'list' ? 'list-view' : ''}`;

    // Sonuç yoksa mesaj göster
    if (this.filteredNews.length === 0) {
      newsGrid.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    if (noResults) noResults.style.display = 'none';

    // Haberleri tarihe göre sırala
    const sortedNews = [...this.filteredNews].sort((a, b) => {
      if (this.sortOrder === 'desc') {
        return new Date(b.date) - new Date(a.date); // Yeni -> Eski
      } else {
        return new Date(a.date) - new Date(b.date); // Eski -> Yeni
      }
    });

    let html = '';
    sortedNews.forEach(news => {
      const formattedDate = Utils.formatDate(news.date);
      const hasRealLink = news.url && news.url !== '#';

      // Çoklu dil desteği
      const title = Utils.getLocalizedText(news.title);
      const summary = Utils.getLocalizedText(news.summary);

      html += `
        <article class="news-card">
          <img src="${news.image}" alt="${title}" class="news-card-image" loading="lazy">
          <div class="news-card-content">
            <div class="news-card-header">
              <span class="news-card-category" style="background-color: ${news.categoryColor}">
                ${news.category}
              </span>
              <span class="news-card-date">
                <i class="bi bi-calendar3"></i>
                ${formattedDate}
              </span>
            </div>
            <h3 class="news-card-title">${title}</h3>
            <p class="news-card-description">${summary}</p>
            <div class="news-card-footer">
              <button class="news-card-btn" style="background-color: ${news.categoryColor}" data-news-id="${news.id}">
                Detayları Gör
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    });

    newsGrid.innerHTML = html;

    // Kart butonlarına event listener ekle
    this.setupCardButtonListeners();

    Utils.log(`${sortedNews.length} news items rendered in ${this.currentView} view`);
  }

  /**
   * Haber kart butonlarına event listener ekle
   */
  setupCardButtonListeners() {
    const cardButtons = document.querySelectorAll('.news-card-btn');
    cardButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newsId = parseInt(e.currentTarget.dataset.newsId);
        const news = this.newsData.find(n => n.id === newsId);
        if (news) {
          this.openNewsModal(news);
        }
      });
    });
  }

  /**
   * Haber detay modal'ını aç
   */
  openNewsModal(news) {
    const modal = document.getElementById('news-modal-overlay');
    if (!modal) return;

    const formattedDate = Utils.formatDate(news.date);
    const hasRealLink = news.url && news.url !== '#';

    // Çoklu dil desteği
    const title = Utils.getLocalizedText(news.title);
    const content = Utils.mdToHtml(Utils.getLocalizedText(news.content));

    const modalContent = `
      <div class="news-modal">
        <img src="${news.image}" alt="${title}" class="news-modal-image" data-lightbox-trigger>
        <div class="news-modal-header">
          <button class="news-modal-close" id="modal-close">
            <i class="bi bi-x-lg"></i>
          </button>
          <h2 class="news-modal-title">${title}</h2>
          <div class="news-modal-meta">
            <span class="news-modal-category" style="background-color: ${news.categoryColor}">
              ${news.category}
            </span>
            <span class="news-modal-date">
              <i class="bi bi-calendar3"></i>
              ${formattedDate}
            </span>
          </div>
        </div>
        <div class="news-modal-body">
          <div class="news-modal-content">${content}</div>
        </div>
        ${hasRealLink ? `
          <div class="news-modal-footer">
            <button class="news-modal-btn secondary" id="modal-close-btn">
              <i class="bi bi-x-circle"></i>
              Kapat
            </button>
            <a href="${news.url}" class="news-modal-btn primary" target="${news.url.startsWith('http') ? '_blank' : '_self'}">
              <i class="bi bi-box-arrow-up-right"></i>
              Sayfaya Git
            </a>
          </div>
        ` : ''}
      </div>
    `;

    modal.innerHTML = modalContent;
    modal.classList.add('active');

    // Close button listeners
    const closeBtn = document.getElementById('modal-close');
    const closeBtnFooter = document.getElementById('modal-close-btn');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.innerHTML = '';
      }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtnFooter) closeBtnFooter.addEventListener('click', closeModal);

    // Resme tıklama ile lightbox aç
    const lightboxTrigger = modal.querySelector('[data-lightbox-trigger]');
    if (lightboxTrigger) {
      lightboxTrigger.addEventListener('click', () => {
        this.openLightbox(news.image, news.title);
      });
    }

    // Overlay click to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC tuşu ile kapat
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * Lightbox'ı aç (resim büyütme)
   */
  openLightbox(imageSrc, altText) {
    const lightbox = document.getElementById('news-lightbox-overlay');
    if (!lightbox) return;

    const lightboxContent = `
      <button class="news-lightbox-close" id="lightbox-close">
        <i class="bi bi-x-lg"></i>
      </button>
      <img src="${imageSrc}" alt="${altText}" class="news-lightbox-image">
    `;

    lightbox.innerHTML = lightboxContent;
    lightbox.classList.add('active');

    // Close button
    const closeBtn = document.getElementById('lightbox-close');
    const closeLightbox = () => {
      lightbox.classList.remove('active');
      setTimeout(() => {
        lightbox.innerHTML = '';
      }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    // Overlay click to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('news-lightbox-image')) {
        closeLightbox();
      }
    });

    // ESC tuşu ile kapat
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * Lightbox container'ı oluştur
   */
  createLightboxContainer() {
    if (!document.getElementById('news-lightbox-overlay')) {
      const lightboxOverlay = document.createElement('div');
      lightboxOverlay.id = 'news-lightbox-overlay';
      lightboxOverlay.className = 'news-lightbox-overlay';
      document.body.appendChild(lightboxOverlay);
    }
  }

  /**
   * Modal container'ı oluştur
   */
  createModalContainer() {
    if (!document.getElementById('news-modal-overlay')) {
      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'news-modal-overlay';
      modalOverlay.className = 'news-modal-overlay';
      document.body.appendChild(modalOverlay);
    }
  }

  // formatDate fonksiyonu kaldırıldı - Utils.formatDate() kullanılıyor (çoklu dil destekli)

  /**
   * Event listener'ları kur
   */
  setupEventListeners() {
    // Arama kutusu
    const searchInput = document.getElementById('news-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.filterNews();

        // Clear button göster/gizle
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
          clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
        }
      });
    }

    // Clear search button
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.searchQuery = '';
          this.filterNews();
          clearBtn.style.display = 'none';
          searchInput.focus();
        }
      });
    }

    // Kategori filtre butonları (sss.html'deki gibi category-btn)
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        this.currentCategory = category;

        // Active class güncelle
        categoryButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.filterNews();
      });
    });

    // Görünüm toggle butonları
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    viewToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.currentView = view;

        // Active class güncelle
        viewToggleBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.renderNews();
      });
    });

    // Sıralama butonu
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
      sortBtn.addEventListener('click', (e) => {
        // Sıralama yönünü değiştir
        this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';

        // Buton metnini ve ikonunu güncelle
        const icon = sortBtn.querySelector('i');
        const textSpan = sortBtn.querySelector('.sort-text');

        // JSON'dan sort text'lerini al
        const searchData = this.pageData.content[0].components[0].data;

        if (this.sortOrder === 'desc') {
          icon.className = 'bi bi-sort-down-alt';
          if (textSpan) textSpan.textContent = Utils.getLocalizedText(searchData.controls.sort.text.desc);
        } else {
          icon.className = 'bi bi-sort-up-alt';
          if (textSpan) textSpan.textContent = Utils.getLocalizedText(searchData.controls.sort.text.asc);
        }

        // Haberleri yeniden render et
        this.renderNews();
      });
    }
  }

  /**
   * Haberleri filtrele (kategori + arama)
   */
  filterNews() {
    this.filteredNews = this.newsData.filter(news => {
      // Kategori filtresi
      const categoryMatch = this.currentCategory === 'all' || news.category === this.currentCategory;

      // Localized text'leri al (çoklu dil desteği)
      const title = Utils.getLocalizedText(news.title);
      const summary = Utils.getLocalizedText(news.summary);
      const content = Utils.mdToHtml(Utils.getLocalizedText(news.content));
      const category = Utils.getLocalizedText(news.category);

      // Arama filtresi (başlık, özet, içerik, kategori)
      const searchMatch = this.searchQuery === '' ||
        (title && title.toLowerCase().includes(this.searchQuery)) ||
        (summary && summary.toLowerCase().includes(this.searchQuery)) ||
        (content && content.toLowerCase().includes(this.searchQuery)) ||
        (category && category.toLowerCase().includes(this.searchQuery));

      return categoryMatch && searchMatch;
    });

    this.renderNews();

    // Heading'i güncelle
    const headingTitle = document.querySelector('#news-heading .heading-title');
    if (headingTitle) {
      const categoryText = this.currentCategory === 'all' ? 'Tüm Haberler' : this.currentCategory;
      const countText = `(${this.filteredNews.length})`;
      headingTitle.textContent = `${categoryText} ${countText}`;
    }
  }

  async setupHelpSection() {
    const helpData = this.pageData.helpSection || this.pageData.help;
    if (!helpData) {
      console.warn('Help section data not found');
      return;
    }

    await this.helpSectionManager.init(helpData);
  }

  /**
   * URL parametrelerini kontrol et ve varsa ilgili haberi otomatik aç
   * Kullanım: guncel-haberler.html?id=5
   */
  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    if (newsId) {
      const id = parseInt(newsId);
      const news = this.newsData.find(n => n.id === id);

      if (news) {
        // Sayfa yüklendikten kısa bir süre sonra modal'ı aç (animasyon için)
        setTimeout(() => {
          this.openNewsModal(news);
        }, 500);

        Utils.log(`Auto-opening news modal for ID: ${id}`);
      } else {
        console.warn(`News with ID ${id} not found`);
      }
    }
  }
}

export default GuncelHaberlerPage;
